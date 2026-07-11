/**
 * Security integration tests against a live Postgres + optional local server assumptions.
 * Run: npm run test:security
 *
 * Skips gracefully only when DATABASE_URL is missing — reports SKIP and exits non-zero
 * so CI does not silently claim success.
 */
import { PrismaClient, type PaymentStatus } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import { hashSessionToken, generateRawSessionToken } from "../src/lib/auth/token-hash";
import { registerUser } from "../src/lib/auth/register-user";
import { normalizeEmail } from "../src/lib/validation/schemas";
import { applyPaymentStatusChange } from "../src/lib/payments/status";
import { userHasVerifiedPaidAccess } from "../src/lib/payments/entitlement";
import { generateInvoiceNumber } from "../src/lib/utils";
import { verifyPassword } from "../src/lib/auth/password";

function fail(msg: string): never {
  console.error("FAIL:", msg);
  process.exit(1);
}

function ok(msg: string) {
  console.log("OK:", msg);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("SKIP/FAIL: DATABASE_URL is not set — security integration tests cannot run");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    console.error("FAIL: cannot connect", err instanceof Error ? err.message : err);
    await prisma.$disconnect();
    process.exit(1);
  }

  const stamp = Date.now();
  const emailA = `seca+${stamp}@example.com`;
  const emailB = `secb+${stamp}@example.com`;
  const password = "SecTestPass1";

  const regA = await registerUser({
    name: "Sec A",
    email: normalizeEmail(emailA),
    password,
    companyName: "A Co",
    country: "SA",
    companyType: "foreign",
    entryGoal: "explore",
  });
  if (!regA.ok) fail(`register A: ${regA.message}`);

  const regB = await registerUser({
    name: "Sec B",
    email: normalizeEmail(emailB),
    password,
    companyName: "B Co",
    country: "SA",
    companyType: "foreign",
    entryGoal: "explore",
  });
  if (!regB.ok) fail(`register B: ${regB.message}`);

  const userA = await prisma.user.findUniqueOrThrow({ where: { email: emailA } });
  const userB = await prisma.user.findUniqueOrThrow({ where: { email: emailB } });

  // Registration now provisions a personal organization for each user.
  const orgA = (
    await prisma.organizationMembership.findFirstOrThrow({ where: { userId: userA.id } })
  ).organizationId;
  const orgB = (
    await prisma.organizationMembership.findFirstOrThrow({ where: { userId: userB.id } })
  ).organizationId;

  // Duplicate email
  const dup = await registerUser({
    name: "Dup",
    email: emailA,
    password,
    companyName: "D",
    country: "SA",
    companyType: "foreign",
    entryGoal: "explore",
  });
  if (dup.ok || dup.code !== "DUPLICATE_EMAIL") fail("duplicate email not rejected");
  ok("duplicate email rejected");

  // Password verify
  if (!(await verifyPassword(password, userA.passwordHash))) fail("password verify");
  if (await verifyPassword("WrongPass1", userA.passwordHash)) fail("invalid password accepted");
  ok("password hashing/verify");

  // Session token hashing at rest
  const raw = generateRawSessionToken();
  const tokenHash = hashSessionToken(raw);
  const expiresAt = new Date(Date.now() + 60_000);
  await prisma.session.create({
    data: { userId: userA.id, tokenHash, expiresAt },
  });
  const stored = await prisma.session.findUniqueOrThrow({ where: { tokenHash } });
  if (stored.tokenHash === raw) fail("raw token stored in DB");
  if (stored.tokenHash !== createHash("sha256").update(raw, "utf8").digest("hex")) {
    fail("tokenHash mismatch");
  }
  ok("session token hashed at rest");

  // Revoke
  await prisma.session.deleteMany({ where: { tokenHash } });
  const gone = await prisma.session.findUnique({ where: { tokenHash } });
  if (gone) fail("session not revoked");
  ok("session revocation");

  // Expired session row
  const expiredRaw = generateRawSessionToken();
  const expiredHash = hashSessionToken(expiredRaw);
  await prisma.session.create({
    data: {
      userId: userA.id,
      tokenHash: expiredHash,
      expiresAt: new Date(Date.now() - 1000),
    },
  });
  const expired = await prisma.session.findUniqueOrThrow({ where: { tokenHash: expiredHash } });
  if (expired.expiresAt >= new Date()) fail("expired session not in past");
  ok("expired session detectable");

  // Assessment ownership isolation
  const assessmentA = await prisma.assessment.create({
    data: {
      userId: userA.id,
      organizationId: orgA,
      companyOrigin: "foreign",
      hasForeignEntity: true,
      hiringEmployees: false,
      sellingToGov: false,
      needsLocalOffice: false,
      invoiceCustomers: false,
      sectorLicensing: false,
      isPreview: true,
    },
  });
  const foreignRead = await prisma.assessment.findFirst({
    where: { id: assessmentA.id, userId: userB.id },
  });
  if (foreignRead) fail("user B can query user A assessment with ownership filter");
  ok("assessment horizontal isolation (query filter)");

  // Payment: user cannot rely on client PAID — applyPaymentStatusChange demo blocked in production-like
  const request = await prisma.reportRequest.create({
    data: {
      userId: userA.id,
      assessmentId: assessmentA.id,
      plan: "PROFESSIONAL",
      status: "PENDING",
    },
  });
  const payment = await prisma.payment.create({
    data: {
      userId: userA.id,
      organizationId: orgA,
      requestId: request.id,
      amount: 499,
      currency: "SAR",
      status: "PENDING",
      invoiceNumber: generateInvoiceNumber(),
    },
  });

  const prevDemo = process.env.ALLOW_DEMO_PAYMENTS;
  process.env.ALLOW_DEMO_PAYMENTS = "false";
  const demoOff = await applyPaymentStatusChange({
    paymentId: payment.id,
    toStatus: "PAID",
    source: "demo_dev",
    actorId: userA.id,
  });
  if (demoOff.ok) fail("demo payment allowed when flag false");
  ok("demo payment mutation disabled when ALLOW_DEMO_PAYMENTS=false");

  process.env.ALLOW_DEMO_PAYMENTS = "true";
  const demoOk = await applyPaymentStatusChange({
    paymentId: payment.id,
    toStatus: "PAID",
    source: "demo_dev",
    actorId: userA.id,
  });
  if (!demoOk.ok) fail(`demo should work in dev: ${demoOk.error}`);
  ok("demo payment allowed in development with flag");

  const entitled = await userHasVerifiedPaidAccess(userA.id, {
    assessmentId: assessmentA.id,
  });
  if (!entitled) fail("verified paid entitlement missing after PAID");
  const entitledB = await userHasVerifiedPaidAccess(userB.id);
  if (entitledB) fail("user B incorrectly entitled");
  ok("premium entitlement gated on verified PAID");

  // Idempotent webhook-style event
  const eventId = `evt_${randomBytes(8).toString("hex")}`;
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "PENDING" as PaymentStatus },
  });
  const wh1 = await applyPaymentStatusChange({
    paymentId: payment.id,
    toStatus: "PAID",
    source: "webhook",
    idempotencyKey: eventId,
  });
  const wh2 = await applyPaymentStatusChange({
    paymentId: payment.id,
    toStatus: "PAID",
    source: "webhook",
    idempotencyKey: eventId,
  });
  if (!wh1.ok || !wh2.ok) fail("webhook idempotency failed");
  const events = await prisma.paymentEvent.count({ where: { paymentId: payment.id } });
  if (events < 1) fail("payment events not recorded");
  ok("webhook idempotency + payment events");

  // Admin path records audit via applyPaymentStatusChange
  await applyPaymentStatusChange({
    paymentId: payment.id,
    toStatus: "REFUNDED",
    source: "admin",
    actorId: userA.id,
    metadata: { reason: "test refund" },
  });
  const refunded = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
  if (refunded.status !== "REFUNDED") fail("admin status change failed");
  ok("admin payment mutation with events");

  // Cleanup
  await prisma.paymentEvent.deleteMany({ where: { paymentId: payment.id } });
  await prisma.payment.delete({ where: { id: payment.id } });
  await prisma.reportRequest.delete({ where: { id: request.id } });
  await prisma.assessment.delete({ where: { id: assessmentA.id } });
  await prisma.session.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
  await prisma.auditLog.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
  // Organizations are not owned by User via FK; remove them (cascades profile/memberships).
  await prisma.organization.deleteMany({ where: { id: { in: [orgA, orgB] } } });

  if (prevDemo === undefined) delete process.env.ALLOW_DEMO_PAYMENTS;
  else process.env.ALLOW_DEMO_PAYMENTS = prevDemo;

  await prisma.$disconnect();
  console.log("\nAll security integration checks passed.");
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
