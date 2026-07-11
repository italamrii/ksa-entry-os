-- CreateEnum
CREATE TYPE "SourceClassification" AS ENUM ('OFFICIAL_PRIMARY', 'OFFICIAL_SECONDARY', 'REGULATOR_GUIDANCE', 'GOVERNMENT_PORTAL', 'PROFESSIONAL_REFERENCE', 'INTERNAL_INTERPRETATION');

-- CreateEnum
CREATE TYPE "SourceAvailability" AS ENUM ('AVAILABLE', 'UNREACHABLE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "GovernanceRole" AS ENUM ('AUTHOR', 'REVIEWER', 'LEGAL_REVIEWER', 'PUBLISHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('SOURCE_REVIEW_DUE', 'SOURCE_OVERDUE', 'SOURCE_UNREACHABLE', 'SOURCE_FINGERPRINT_CHANGED', 'PUBLISHED_MISSING_METADATA', 'RULE_LINKED_STALE_SOURCE', 'PATHWAY_LINKED_RETIRED_DEPENDENCY', 'UNRESOLVED_REVIEW', 'REJECTED_PUBLICATION', 'EXPIRED_EFFECTIVE_DATE');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "DisclaimerContext" AS ENUM ('PLATFORM', 'EVALUATION', 'REPORT', 'EXTERNAL_LINK', 'PROFESSIONAL_REVIEW', 'OFFICIAL_VERIFICATION', 'OUTDATED_INFO');

-- AlterTable
ALTER TABLE "ContentReviewHistory" ADD COLUMN     "changeReason" TEXT,
ADD COLUMN     "entityVersion" INTEGER,
ADD COLUMN     "reviewerRole" "GovernanceRole";

-- AlterTable
ALTER TABLE "EvaluationResult" ADD COLUMN     "governanceSignature" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "OfficialSource" ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "availability" "SourceAvailability" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "changeReason" TEXT,
ADD COLUMN     "classification" "SourceClassification" NOT NULL DEFAULT 'INTERNAL_INTERPRETATION',
ADD COLUMN     "domain" TEXT,
ADD COLUMN     "fingerprint" TEXT,
ADD COLUMN     "limitationsAr" TEXT,
ADD COLUMN     "limitationsEn" TEXT,
ADD COLUMN     "previousVersionId" TEXT,
ADD COLUMN     "reviewNotes" TEXT,
ADD COLUMN     "reviewerRole" "GovernanceRole",
ADD COLUMN     "supersededById" TEXT,
ADD COLUMN     "translationComplete" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Pathway" ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "changeReason" TEXT,
ADD COLUMN     "previousVersionId" TEXT,
ADD COLUMN     "reviewerRole" "GovernanceRole",
ADD COLUMN     "supersededById" TEXT;

-- AlterTable
ALTER TABLE "Rule" ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "changeReason" TEXT,
ADD COLUMN     "previousVersionId" TEXT,
ADD COLUMN     "reviewerRole" "GovernanceRole",
ADD COLUMN     "supersededById" TEXT;

-- CreateTable
CREATE TABLE "ContentAlert" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "messageEn" TEXT NOT NULL,
    "messageAr" TEXT NOT NULL,
    "metadata" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disclaimer" (
    "id" TEXT NOT NULL,
    "context" "DisclaimerContext" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "textEn" TEXT NOT NULL,
    "textAr" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Disclaimer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentAlert_status_idx" ON "ContentAlert"("status");

-- CreateIndex
CREATE INDEX "ContentAlert_type_idx" ON "ContentAlert"("type");

-- CreateIndex
CREATE INDEX "ContentAlert_entityType_entityId_idx" ON "ContentAlert"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentAlert_type_entityType_entityId_status_key" ON "ContentAlert"("type", "entityType", "entityId", "status");

-- CreateIndex
CREATE INDEX "Disclaimer_context_status_idx" ON "Disclaimer"("context", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Disclaimer_context_version_key" ON "Disclaimer"("context", "version");

-- CreateIndex
CREATE INDEX "OfficialSource_classification_idx" ON "OfficialSource"("classification");
