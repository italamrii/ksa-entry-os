/**
 * Platform-administrator provisioning (seed-time).
 *
 * Behavior contract:
 * - Reference data always seeds; the admin account is optional and env-gated.
 * - In PRODUCTION the admin is provisioned only when SEED_ADMIN_EMAIL and
 *   SEED_ADMIN_PASSWORD are both present, the password is not the default
 *   placeholder, and it passes the same strong-password rule as registration.
 *   Otherwise the admin step is SKIPPED (never thrown) so a deploy-time seed
 *   cannot fail a release.
 * - Outside production a missing password falls back to the default so local
 *   development and the route-smoke admin crawl keep working.
 * - Upsert is by normalized email: an existing USER account is upgraded in
 *   place. TOTP fields are never touched on update. Lockout state
 *   (failedLoginCount/lockedUntil) is reset.
 * - PASSWORD ROTATION: when SEED_ADMIN_PASSWORD no longer matches the stored
 *   hash, the hash is replaced and ALL existing sessions for the account are
 *   revoked — a rotated credential must not leave old cookies alive. This is
 *   audited as admin.password_rotated (metadata carries counts only, never
 *   the password or hash).
 * - The password is never logged, never audited, never returned.
 */
import type { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import { normalizeEmail, strongPasswordSchema } from "../src/lib/validation/schemas";
import { provisionPersonalOrganization } from "../src/lib/organizations";

export const DEFAULT_ADMIN_PASSWORD = "ChangeMe123!Secure";

export interface AdminProvisionEnv {
  nodeEnv?: string;
  email?: string;
  password?: string;
  name?: string;
}

export type AdminProvisionDecision =
  | { provision: true; email: string; password: string; name: string }
  | { provision: false; reason: string };

/** Pure decision logic — unit-testable without a database. */
export function adminProvisionDecision(env: AdminProvisionEnv): AdminProvisionDecision {
  const isProduction = env.nodeEnv === "production";
  const name = env.name?.trim() || "Platform Admin";

  if (isProduction) {
    if (!env.email) return { provision: false, reason: "SEED_ADMIN_EMAIL missing" };
    if (!env.password) return { provision: false, reason: "SEED_ADMIN_PASSWORD missing" };
    if (env.password === DEFAULT_ADMIN_PASSWORD) {
      return { provision: false, reason: "SEED_ADMIN_PASSWORD is the default placeholder" };
    }
    const strength = strongPasswordSchema.safeParse(env.password);
    if (!strength.success) {
      return { provision: false, reason: "SEED_ADMIN_PASSWORD fails strong-password validation" };
    }
    return { provision: true, email: normalizeEmail(env.email), password: env.password, name };
  }

  // Development/test convenience: default credentials unless overridden.
  return {
    provision: true,
    email: normalizeEmail(env.email ?? "admin@ksaentryos.com"),
    password: env.password ?? DEFAULT_ADMIN_PASSWORD,
    name,
  };
}

export interface AdminSeedResult {
  provisioned: boolean;
  reason?: string;
  created?: boolean;
  passwordRotated?: boolean;
  sessionsRevoked?: number;
}

export async function seedAdmin(prisma: PrismaClient): Promise<AdminSeedResult> {
  const decision = adminProvisionDecision({
    nodeEnv: process.env.NODE_ENV,
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
    name: process.env.SEED_ADMIN_NAME,
  });

  if (!decision.provision) {
    return { provisioned: false, reason: decision.reason };
  }

  const existing = await prisma.user.findUnique({
    where: { email: decision.email },
    select: { id: true, passwordHash: true },
  });

  // Only rehash when the password actually changed — keeps the seed idempotent
  // and makes rotation (and its session revocation) an explicit, detectable event.
  const passwordUnchanged = existing
    ? await verifyPassword(decision.password, existing.passwordHash)
    : false;
  const passwordHash = passwordUnchanged ? existing!.passwordHash : await hashPassword(decision.password);

  const profileFields = {
    role: "ADMIN" as const,
    name: decision.name,
    companyName: "KSA Entry OS",
    country: "Saudi Arabia",
    companyType: "local",
    entryGoal: "explore",
    locale: "ar",
    onboardingDone: true,
    failedLoginCount: 0,
    lockedUntil: null,
    // TOTP fields intentionally absent: never reset a configured second factor.
  };

  const admin = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { ...profileFields, passwordHash },
      })
    : await prisma.user.create({
        data: { ...profileFields, email: decision.email, passwordHash },
      });

  let sessionsRevoked = 0;
  const rotated = Boolean(existing) && !passwordUnchanged;
  if (rotated) {
    const res = await prisma.session.deleteMany({ where: { userId: admin.id } });
    sessionsRevoked = res.count;
  }

  await provisionPersonalOrganization(prisma, {
    userId: admin.id,
    name: "KSA Entry OS",
    profile: {
      companyName: "KSA Entry OS",
      originCountry: "Saudi Arabia",
      companyType: "local",
      entryGoal: "explore",
      locale: "ar",
      onboardingDone: true,
    },
  });

  // Audit without secrets: event shape only.
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: existing ? (rotated ? "admin.password_rotated" : "admin.reprovisioned") : "admin.provisioned",
      entity: "User",
      entityId: admin.id,
      metadata: { sessionsRevoked, source: "seed" },
    },
  });

  return {
    provisioned: true,
    created: !existing,
    passwordRotated: rotated,
    sessionsRevoked,
  };
}
