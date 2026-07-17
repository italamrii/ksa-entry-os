/**
 * Admin provisioning + subscription administration integration tests (live DB).
 * Run: npm run test:admin
 *
 * Proves the full Section-8 runtime contract: env-gated provisioning, USER
 * upgrade, idempotency (no duplicate user/org/membership), password rotation
 * with session revocation, no password in logs, subscription grant/upgrade/
 * cancel with the single-ACTIVE invariant, entitlement changes, audit
 * entries, and tenant isolation.
 */
import { prisma } from "../src/lib/prisma";
import { seedAdmin } from "../prisma/seed-admin";
import { verifyPassword } from "../src/lib/auth/password";
import { createUserSession } from "../src/lib/auth";
import { registerUser } from "../src/lib/auth/register-user";
import { normalizeEmail } from "../src/lib/validation/schemas";
import { administerSubscription, SubscriptionError, activeSubscriptionPlansForUser } from "../src/lib/subscriptions";
import { resolveEntitlements, userHasVerifiedPaidAccess } from "../src/lib/payments/entitlement";

function fail(msg: string): never {
  console.error("FAIL:", msg);
  process.exit(1);
}
function ok(msg: string) {
  console.log("OK:", msg);
}

/** Run fn with SEED_ADMIN_* env overridden, capturing console output. */
async function withAdminEnv<T>(
  env: { email?: string; password?: string; name?: string; nodeEnv?: string },
  fn: () => Promise<T>
): Promise<{ result: T; logs: string }> {
  const prev = {
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
    name: process.env.SEED_ADMIN_NAME,
    nodeEnv: process.env.NODE_ENV,
  };
  const lines: string[] = [];
  const orig = { log: console.log, warn: console.warn, error: console.error };
  const capture = (...args: unknown[]) => lines.push(args.map(String).join(" "));
  try {
    if (env.email !== undefined) process.env.SEED_ADMIN_EMAIL = env.email;
    else delete process.env.SEED_ADMIN_EMAIL;
    if (env.password !== undefined) process.env.SEED_ADMIN_PASSWORD = env.password;
    else delete process.env.SEED_ADMIN_PASSWORD;
    if (env.name !== undefined) process.env.SEED_ADMIN_NAME = env.name;
    else delete process.env.SEED_ADMIN_NAME;
    if (env.nodeEnv !== undefined)
      (process.env as Record<string, string>).NODE_ENV = env.nodeEnv;
    console.log = capture;
    console.warn = capture;
    console.error = capture;
    const result = await fn();
    return { result, logs: lines.join("\n") };
  } finally {
    console.log = orig.log;
    console.warn = orig.warn;
    console.error = orig.error;
    process.env.SEED_ADMIN_EMAIL = prev.email;
    process.env.SEED_ADMIN_PASSWORD = prev.password;
    process.env.SEED_ADMIN_NAME = prev.name;
    (process.env as Record<string, string>).NODE_ENV = prev.nodeEnv ?? "";
    if (prev.email === undefined) delete process.env.SEED_ADMIN_EMAIL;
    if (prev.password === undefined) delete process.env.SEED_ADMIN_PASSWORD;
    if (prev.name === undefined) delete process.env.SEED_ADMIN_NAME;
  }
}

async function cleanup(emails: string[]) {
  const users = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  const orgs = await prisma.organizationMembership.findMany({
    where: { userId: { in: ids } },
    select: { organizationId: true },
  });
  await prisma.auditLog.deleteMany({ where: { userId: { in: ids } } });
  await prisma.auditLog.deleteMany({ where: { organizationId: { in: orgs.map((o) => o.organizationId) } } });
  await prisma.subscription.deleteMany({ where: { organizationId: { in: orgs.map((o) => o.organizationId) } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.organization.deleteMany({ where: { id: { in: orgs.map((o) => o.organizationId) } } });
}

async function main() {
  await prisma.$queryRaw`SELECT 1`;
  const stamp = Date.now();
  const adminEmail = `admintest+${stamp}@example.com`;
  const userEmail = `admintarget+${stamp}@example.com`;
  const otherEmail = `adminother+${stamp}@example.com`;
  const PASSWORD_1 = `ProdAdminPass${stamp}A`;
  const PASSWORD_2 = `RotatedPass${stamp}B`;

  try {
    // --- 1. Production gates: missing env / default / weak all skip ---
    {
      const { result } = await withAdminEnv({ nodeEnv: "production" }, () => seedAdmin(prisma));
      if (result.provisioned) fail("provisioned admin without env vars in production");
      const { result: r2 } = await withAdminEnv(
        { nodeEnv: "production", email: adminEmail, password: "ChangeMe123!Secure" },
        () => seedAdmin(prisma)
      );
      if (r2.provisioned) fail("provisioned admin with the default placeholder password");
      const { result: r3 } = await withAdminEnv(
        { nodeEnv: "production", email: adminEmail, password: "weakpass" },
        () => seedAdmin(prisma)
      );
      if (r3.provisioned) fail("provisioned admin with a weak password");
      ok("production seed skips admin when env is missing, default, or weak");
    }

    // --- 2. Valid env creates ADMIN; password never printed ---
    {
      const { result, logs } = await withAdminEnv(
        { nodeEnv: "production", email: adminEmail, password: PASSWORD_1, name: "Ops Admin" },
        () => seedAdmin(prisma)
      );
      if (!result.provisioned || !result.created) fail("valid env did not create the admin");
      if (logs.includes(PASSWORD_1)) fail("password appeared in seed output");
      const admin = await prisma.user.findUnique({ where: { email: normalizeEmail(adminEmail) } });
      if (!admin) fail("admin row missing");
      if (admin.role !== "ADMIN") fail("role is not ADMIN");
      if (!admin.onboardingDone) fail("onboardingDone not set");
      if (admin.locale !== "ar") fail("locale not ar");
      if (admin.name !== "Ops Admin") fail("SEED_ADMIN_NAME not applied");
      if (!(await verifyPassword(PASSWORD_1, admin.passwordHash))) fail("stored hash does not verify");
      const audit = await prisma.auditLog.findFirst({
        where: { userId: admin.id, action: "admin.provisioned" },
      });
      if (!audit) fail("admin.provisioned audit entry missing");
      if (JSON.stringify(audit.metadata).includes(PASSWORD_1)) fail("password leaked into audit metadata");
      ok("valid env creates ADMIN (ar locale, onboarded, named, audited, no password in logs)");
    }

    // --- 3. Idempotency: second run duplicates nothing ---
    {
      const before = {
        users: await prisma.user.count({ where: { email: normalizeEmail(adminEmail) } }),
        orgs: await prisma.organization.count({ where: { name: "KSA Entry OS" } }),
      };
      const { result } = await withAdminEnv(
        { nodeEnv: "production", email: adminEmail, password: PASSWORD_1 },
        () => seedAdmin(prisma)
      );
      if (!result.provisioned || result.created) fail("second run should update, not create");
      if (result.passwordRotated) fail("unchanged password reported as rotated");
      const admin = await prisma.user.findUnique({
        where: { email: normalizeEmail(adminEmail) },
        include: { memberships: true },
      });
      if (!admin || admin.memberships.length !== 1) fail("duplicate/missing membership after re-run");
      const after = {
        users: await prisma.user.count({ where: { email: normalizeEmail(adminEmail) } }),
        orgs: await prisma.organization.count({ where: { name: "KSA Entry OS" } }),
      };
      if (before.users !== after.users || before.orgs !== after.orgs) fail("re-run duplicated user or org");
      if (admin.memberships[0].role !== "OWNER") fail("admin org membership is not OWNER");
      ok("repeated runs are idempotent (same user, one OWNER membership, no duplicate org)");
    }

    // --- 4. Rotation updates the hash and revokes sessions ---
    {
      const admin = await prisma.user.findUniqueOrThrow({ where: { email: normalizeEmail(adminEmail) } });
      await createUserSession(admin.id, admin.email, "ADMIN");
      const sessionsBefore = await prisma.session.count({ where: { userId: admin.id } });
      if (sessionsBefore === 0) fail("test setup: no session to revoke");
      const { result, logs } = await withAdminEnv(
        { nodeEnv: "production", email: adminEmail, password: PASSWORD_2 },
        () => seedAdmin(prisma)
      );
      if (!result.provisioned || !result.passwordRotated) fail("rotation not detected");
      if (result.sessionsRevoked !== sessionsBefore) fail("rotation did not revoke all sessions");
      if (logs.includes(PASSWORD_2) || logs.includes(PASSWORD_1)) fail("password in rotation logs");
      const rotated = await prisma.user.findUniqueOrThrow({ where: { id: admin.id } });
      if (!(await verifyPassword(PASSWORD_2, rotated.passwordHash))) fail("new password does not verify");
      if (await verifyPassword(PASSWORD_1, rotated.passwordHash)) fail("old password still verifies");
      if ((await prisma.session.count({ where: { userId: admin.id } })) !== 0) fail("sessions survived rotation");
      const audit = await prisma.auditLog.findFirst({ where: { userId: admin.id, action: "admin.password_rotated" } });
      if (!audit) fail("rotation audit entry missing");
      ok("password rotation updates the hash, revokes all sessions, and is audited");
    }

    // --- 5. Upgrading an existing USER account to ADMIN ---
    {
      const reg = await registerUser({
        name: "Future Admin", email: normalizeEmail(otherEmail), password: "FutureAdmin123",
        companyName: "Other Co", country: "SA", companyType: "local", entryGoal: "explore",
      });
      if (!reg.ok) fail("registration failed");
      const { result } = await withAdminEnv(
        { nodeEnv: "production", email: otherEmail, password: PASSWORD_2 },
        () => seedAdmin(prisma)
      );
      if (!result.provisioned || result.created) fail("existing USER should be upgraded in place");
      const upgraded = await prisma.user.findUniqueOrThrow({ where: { id: reg.userId }, include: { memberships: true } });
      if (upgraded.role !== "ADMIN") fail("existing USER not upgraded to ADMIN");
      if (upgraded.memberships.length !== 1) fail("upgrade duplicated the membership");
      ok("existing USER is upgraded to ADMIN without duplicating the org");
    }

    // --- 6. Subscriptions: grant → entitlements → upgrade → cancel → audit ---
    {
      const admin = await prisma.user.findUniqueOrThrow({ where: { email: normalizeEmail(adminEmail) } });
      const reg = await registerUser({
        name: "Target", email: normalizeEmail(userEmail), password: "TargetPass123",
        companyName: "Target Co", country: "SA", companyType: "foreign", entryGoal: "setup",
      });
      if (!reg.ok) fail("target registration failed");

      // Baseline: no paid access.
      if (await userHasVerifiedPaidAccess(reg.userId)) fail("fresh user has paid access");
      if ((await resolveEntitlements(reg.userId)).tier !== "FREE") fail("fresh user is not FREE");

      // Grant PROFESSIONAL → STANDARD tier entitlements + paid access.
      const g1 = await administerSubscription({ targetUserId: reg.userId, action: "grant", plan: "PROFESSIONAL", actorId: admin.id });
      if (g1.after?.plan !== "PROFESSIONAL" || g1.after.status !== "ACTIVE") fail("grant PROFESSIONAL failed");
      if ((await resolveEntitlements(reg.userId)).tier !== "STANDARD") fail("PROFESSIONAL plan did not yield STANDARD entitlements");
      if (!(await userHasVerifiedPaidAccess(reg.userId))) fail("subscription did not grant paid access");
      ok("grant PROFESSIONAL → ACTIVE subscription, STANDARD entitlements, paid access");

      // Upgrade to BUSINESS supersedes — never two ACTIVE.
      const g2 = await administerSubscription({ targetUserId: reg.userId, action: "grant", plan: "BUSINESS", actorId: admin.id });
      if (g2.after?.plan !== "BUSINESS") fail("grant BUSINESS failed");
      const activeCount = await prisma.subscription.count({ where: { organizationId: g2.organizationId, status: "ACTIVE" } });
      if (activeCount !== 1) fail(`single-ACTIVE invariant violated: ${activeCount} active rows`);
      if ((await resolveEntitlements(reg.userId)).tier !== "PROFESSIONAL") fail("BUSINESS plan did not yield PROFESSIONAL entitlements");
      ok("upgrade to BUSINESS supersedes the old plan — exactly one ACTIVE subscription");

      // Expired period end = no entitlement.
      await administerSubscription({ targetUserId: reg.userId, action: "activate", currentPeriodEnd: new Date(Date.now() - 1000), actorId: admin.id });
      if ((await resolveEntitlements(reg.userId)).tier !== "FREE") fail("expired period still grants entitlements");
      ok("a lapsed currentPeriodEnd stops granting entitlements");

      // Cancel → FREE + audited with before/after and acting admin.
      await administerSubscription({ targetUserId: reg.userId, action: "activate", currentPeriodEnd: null, actorId: admin.id });
      const c = await administerSubscription({ targetUserId: reg.userId, action: "cancel", actorId: admin.id });
      if (c.after?.status !== "CANCELED") fail("cancel failed");
      if ((await resolveEntitlements(reg.userId)).tier !== "FREE") fail("canceled subscription still grants entitlements");
      if (await userHasVerifiedPaidAccess(reg.userId)) fail("canceled subscription still grants paid access");
      const audits = await prisma.auditLog.findMany({
        where: { organizationId: g2.organizationId, action: { startsWith: "admin.subscription." } },
        orderBy: { createdAt: "asc" },
      });
      if (audits.length < 5) fail(`expected >=5 subscription audit entries, got ${audits.length}`);
      for (const a of audits) {
        if (a.userId !== admin.id) fail("audit entry missing acting admin id");
        const meta = a.metadata as { before?: unknown; after?: unknown } | null;
        if (!meta || meta.before === undefined || meta.after === undefined) fail("audit entry missing before/after");
      }
      ok(`cancel → FREE; ${audits.length} audit entries all carry acting admin + before/after`);

      // Double-cancel fails cleanly.
      let threw = false;
      try {
        await administerSubscription({ targetUserId: reg.userId, action: "cancel", actorId: admin.id });
      } catch (e) {
        threw = e instanceof SubscriptionError;
      }
      if (!threw) fail("cancel without an active subscription should fail");
      ok("cancel without an active subscription is rejected");

      // Tenant isolation: the target's subscription never leaks to another user.
      const other = await prisma.user.findUniqueOrThrow({ where: { email: normalizeEmail(otherEmail) } });
      const otherPlans = await activeSubscriptionPlansForUser(other.id);
      const targetOrgs = await prisma.organizationMembership.findMany({ where: { userId: reg.userId } });
      const otherOrgs = await prisma.organizationMembership.findMany({ where: { userId: other.id } });
      const overlap = targetOrgs.some((t) => otherOrgs.some((o) => o.organizationId === t.organizationId));
      if (overlap) fail("test users unexpectedly share an organization");
      await administerSubscription({ targetUserId: reg.userId, action: "grant", plan: "BUSINESS", actorId: admin.id });
      const otherPlansAfter = await activeSubscriptionPlansForUser(other.id);
      if (otherPlansAfter.length !== otherPlans.length) fail("subscription leaked across organizations");
      ok("tenant isolation holds: another org's user gains nothing from the grant");
    }

    console.log("\nAll admin provisioning + subscription checks passed.");
  } finally {
    await cleanup([normalizeEmail(adminEmail), normalizeEmail(userEmail), normalizeEmail(otherEmail)]);
    await prisma.$disconnect();
  }
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
