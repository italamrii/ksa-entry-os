-- ============================================================================
-- ONE-TIME production bridge: pre-Stage-2 (db-push) schema  ->  0_init baseline
-- ============================================================================
-- Context: the Railway database predates the repaired Prisma migration baseline
-- and was managed with `prisma db push`. It has the base tables but is missing
-- the Stage 2 elements that the 0_init migration expects (Session.tokenHash,
-- Payment.idempotencyKey, PaymentEvent, related indexes).
--
-- This script brings that schema up to EXACTLY the 0_init baseline so that
-- `prisma migrate resolve --applied 0_init` is valid and `prisma migrate deploy`
-- can then apply Stage 3 / 4 / 4.5 (Stage 3 backfills organizations +
-- Assessment/Payment.organizationId).
--
-- Safety:
--   * Idempotent (IF [NOT] EXISTS / duplicate_object guards) — safe to re-run.
--   * Data-preserving for Users, Assessments, Payments, ReportRequests, AuditLog.
--   * The ONLY rows removed are Session rows: Stage 2 replaced raw tokens with
--     SHA-256(tokenHash); the ~2 legacy sessions cannot be re-hashed without the
--     raw secret, so they are invalidated (users simply log in again).
--   * Run inside a transaction; review the pre/post row counts in the runbook.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Session: legacy raw `token`  ->  Stage 2 `tokenHash` (SHA-256 at rest).
--    Existing sessions are invalidated (forced re-login). Users are untouched.
-- ----------------------------------------------------------------------------
DELETE FROM "Session";

DROP INDEX IF EXISTS "Session_token_key";
DROP INDEX IF EXISTS "Session_token_idx";
ALTER TABLE "Session" DROP COLUMN IF EXISTS "token";

ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "tokenHash" TEXT;
-- Table is empty after the DELETE above, so SET NOT NULL is always safe.
ALTER TABLE "Session" ALTER COLUMN "tokenHash" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX IF NOT EXISTS "Session_tokenHash_idx" ON "Session"("tokenHash");

-- ----------------------------------------------------------------------------
-- 2. Payment: Stage 2 idempotency key + composite status index.
--    Additive only — no existing Payment rows are modified.
-- ----------------------------------------------------------------------------
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "Payment_userId_status_idx" ON "Payment"("userId", "status");

-- ----------------------------------------------------------------------------
-- 3. PaymentEvent: immutable payment status-transition log (Stage 2).
--    The "PaymentStatus" enum already exists (used by Payment.status).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PaymentEvent" (
  "id"         TEXT NOT NULL,
  "paymentId"  TEXT NOT NULL,
  "fromStatus" "PaymentStatus",
  "toStatus"   "PaymentStatus" NOT NULL,
  "source"     TEXT NOT NULL,
  "actorId"    TEXT,
  "metadata"   JSONB,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PaymentEvent_paymentId_idx" ON "PaymentEvent"("paymentId");
CREATE INDEX IF NOT EXISTS "PaymentEvent_createdAt_idx" ON "PaymentEvent"("createdAt");

DO $$ BEGIN
  ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
