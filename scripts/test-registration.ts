/**
 * Integration test: registration must create a real User row in PostgreSQL.
 *
 * Usage:
 *   npx tsx scripts/test-registration.ts
 *
 * Requires DATABASE_URL pointing at the target Postgres (local or Railway).
 * Does not use mocks. Creates then deletes a throwaway user.
 */

import { PrismaClient } from "@prisma/client";
import { normalizeEmail, registerSchema } from "../src/lib/validation/schemas";
import { registerUser } from "../src/lib/auth/register-user";
import { verifyPassword } from "../src/lib/auth/password";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("FAIL: DATABASE_URL is not set");
    process.exit(1);
  }

  console.log("DATABASE_URL host:", databaseUrl.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@"));

  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    console.error(
      "FAIL: cannot connect to PostgreSQL. Fix DATABASE_URL (Railway: set it on the web service).",
      err instanceof Error ? err.message : err
    );
    await prisma.$disconnect();
    process.exit(1);
  }

  const stamp = Date.now();
  const email = `regtest+${stamp}@example.com`;
  const password = "TestPass123";

  const payload = {
    name: "Registration Test",
    email: `  ${email.toUpperCase()}  `,
    password,
    companyName: "Test Co",
    country: "Saudi Arabia",
    companyType: "foreign",
    entryGoal: "explore",
    sectorId: "",
  };

  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    console.error("FAIL: Zod validation rejected payload", parsed.error.flatten());
    process.exit(1);
  }

  const normalized = normalizeEmail(parsed.data.email);
  if (normalized !== email) {
    console.error("FAIL: email was not normalized", normalized);
    process.exit(1);
  }

  const result = await registerUser({
    ...parsed.data,
    email: normalized,
  });
  if (!result.ok) {
    console.error("FAIL: registerUser returned error", result);
    process.exit(1);
  }

  const row = await prisma.user.findUnique({ where: { email } });
  if (!row) {
    console.error("FAIL: User row not found in database after registerUser");
    process.exit(1);
  }

  if (row.passwordHash === password || row.passwordHash.length < 20) {
    console.error("FAIL: password appears unhashed");
    process.exit(1);
  }

  const valid = await verifyPassword(password, row.passwordHash);
  if (!valid) {
    console.error("FAIL: Argon2 verify failed against stored hash");
    process.exit(1);
  }

  const dup = await registerUser({
    ...parsed.data,
    email: normalized,
  });
  if (dup.ok || dup.code !== "DUPLICATE_EMAIL") {
    console.error("FAIL: duplicate email did not return DUPLICATE_EMAIL", dup);
    process.exit(1);
  }

  await prisma.session.deleteMany({ where: { userId: row.id } });
  await prisma.auditLog.deleteMany({ where: { userId: row.id } });
  await prisma.user.delete({ where: { id: row.id } });

  console.log("PASS: registration persists User to PostgreSQL with Argon2id hash");
  console.log("  userId:", row.id);
  console.log("  email:", row.email);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
