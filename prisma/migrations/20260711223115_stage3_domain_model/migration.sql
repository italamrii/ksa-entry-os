/*
  Warnings:

  - Added the required column `organizationId` to the `Assessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'REVIEWER');

-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'SOURCE_VERIFIED', 'REVIEWED', 'LEGAL_FLAG_CHECK', 'APPROVED', 'PUBLISHED', 'STALE', 'RETIRED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'GENERATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- AlterTable
-- organizationId is added nullable here and backfilled + set NOT NULL near the
-- end of this migration (there may be existing rows without an organization).
ALTER TABLE "Assessment" ADD COLUMN     "normalizedFacts" JSONB,
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "organizationId" TEXT;

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "OrgStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyName" TEXT,
    "originCountry" TEXT,
    "companyType" TEXT,
    "sectorId" TEXT,
    "activityId" TEXT,
    "entryGoal" TEXT,
    "entryObjectiveId" TEXT,
    "operatingModel" TEXT,
    "targetRegion" TEXT,
    "marketEntryStatus" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "sectorId" TEXT,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryObjective" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntryObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficialSource" (
    "id" TEXT NOT NULL,
    "authorityId" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "jurisdiction" TEXT NOT NULL DEFAULT 'SA',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "effectiveDate" TIMESTAMP(3),
    "lastVerified" TIMESTAMP(3),
    "nextReview" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "reviewerId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficialSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pathway" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "applicability" JSONB,
    "complexity" "Complexity" NOT NULL DEFAULT 'MEDIUM',
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "sectorId" TEXT,
    "activityId" TEXT,
    "requiresProfessionalReview" BOOLEAN NOT NULL DEFAULT false,
    "requiresVerification" BOOLEAN NOT NULL DEFAULT true,
    "effectiveDate" TIMESTAMP(3),
    "lastReviewed" TIMESTAMP(3),
    "nextReview" TIMESTAMP(3),
    "reviewerId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pathway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PathwayStep" (
    "id" TEXT NOT NULL,
    "pathwayId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "authorityId" TEXT,
    "requiresVerification" BOOLEAN NOT NULL DEFAULT true,
    "requiresProfessionalReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PathwayStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PathwayStepDependency" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "dependsOnId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PathwayStepDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PathwaySource" (
    "id" TEXT NOT NULL,
    "pathwayId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PathwaySource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PathwayAssumption" (
    "id" TEXT NOT NULL,
    "pathwayId" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "textAr" TEXT NOT NULL,
    "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PathwayAssumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAnswer" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "pathwayId" TEXT,
    "ruleId" TEXT,
    "reason" TEXT NOT NULL,
    "applicability" JSONB,
    "assumptions" JSONB,
    "uncertainty" "ConfidenceLevel" NOT NULL DEFAULT 'MEDIUM',
    "requiresVerification" BOOLEAN NOT NULL DEFAULT true,
    "requiresProfessionalReview" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "assessmentId" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSnapshot" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "content" JSONB NOT NULL,
    "infoCutoffDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "plan" "PlanType" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentReviewHistory" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "fromStatus" "ContentStatus",
    "toStatus" "ContentStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentReviewHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE INDEX "OrganizationMembership_userId_idx" ON "OrganizationMembership"("userId");

-- CreateIndex
CREATE INDEX "OrganizationMembership_organizationId_idx" ON "OrganizationMembership"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_organizationId_userId_key" ON "OrganizationMembership"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_organizationId_key" ON "CompanyProfile"("organizationId");

-- CreateIndex
CREATE INDEX "CompanyProfile_sectorId_idx" ON "CompanyProfile"("sectorId");

-- CreateIndex
CREATE INDEX "CompanyProfile_activityId_idx" ON "CompanyProfile"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_slug_key" ON "Activity"("slug");

-- CreateIndex
CREATE INDEX "Activity_sectorId_idx" ON "Activity"("sectorId");

-- CreateIndex
CREATE UNIQUE INDEX "EntryObjective_slug_key" ON "EntryObjective"("slug");

-- CreateIndex
CREATE INDEX "OfficialSource_authorityId_idx" ON "OfficialSource"("authorityId");

-- CreateIndex
CREATE INDEX "OfficialSource_status_idx" ON "OfficialSource"("status");

-- CreateIndex
CREATE INDEX "OfficialSource_nextReview_idx" ON "OfficialSource"("nextReview");

-- CreateIndex
CREATE UNIQUE INDEX "Pathway_slug_key" ON "Pathway"("slug");

-- CreateIndex
CREATE INDEX "Pathway_status_idx" ON "Pathway"("status");

-- CreateIndex
CREATE INDEX "Pathway_sectorId_idx" ON "Pathway"("sectorId");

-- CreateIndex
CREATE INDEX "Pathway_activityId_idx" ON "Pathway"("activityId");

-- CreateIndex
CREATE INDEX "Pathway_nextReview_idx" ON "Pathway"("nextReview");

-- CreateIndex
CREATE INDEX "PathwayStep_pathwayId_idx" ON "PathwayStep"("pathwayId");

-- CreateIndex
CREATE INDEX "PathwayStep_authorityId_idx" ON "PathwayStep"("authorityId");

-- CreateIndex
CREATE UNIQUE INDEX "PathwayStep_pathwayId_order_key" ON "PathwayStep"("pathwayId", "order");

-- CreateIndex
CREATE INDEX "PathwayStepDependency_stepId_idx" ON "PathwayStepDependency"("stepId");

-- CreateIndex
CREATE INDEX "PathwayStepDependency_dependsOnId_idx" ON "PathwayStepDependency"("dependsOnId");

-- CreateIndex
CREATE UNIQUE INDEX "PathwayStepDependency_stepId_dependsOnId_key" ON "PathwayStepDependency"("stepId", "dependsOnId");

-- CreateIndex
CREATE INDEX "PathwaySource_pathwayId_idx" ON "PathwaySource"("pathwayId");

-- CreateIndex
CREATE INDEX "PathwaySource_sourceId_idx" ON "PathwaySource"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "PathwaySource_pathwayId_sourceId_key" ON "PathwaySource"("pathwayId", "sourceId");

-- CreateIndex
CREATE INDEX "PathwayAssumption_pathwayId_idx" ON "PathwayAssumption"("pathwayId");

-- CreateIndex
CREATE INDEX "AssessmentAnswer_assessmentId_idx" ON "AssessmentAnswer"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAnswer_assessmentId_key_key" ON "AssessmentAnswer"("assessmentId", "key");

-- CreateIndex
CREATE INDEX "Recommendation_assessmentId_idx" ON "Recommendation"("assessmentId");

-- CreateIndex
CREATE INDEX "Recommendation_pathwayId_idx" ON "Recommendation"("pathwayId");

-- CreateIndex
CREATE INDEX "Report_organizationId_idx" ON "Report"("organizationId");

-- CreateIndex
CREATE INDEX "Report_assessmentId_idx" ON "Report"("assessmentId");

-- CreateIndex
CREATE INDEX "ReportSnapshot_reportId_idx" ON "ReportSnapshot"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSnapshot_reportId_version_key" ON "ReportSnapshot"("reportId", "version");

-- CreateIndex
CREATE INDEX "Subscription_organizationId_idx" ON "Subscription"("organizationId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "ContentReviewHistory_entityType_entityId_idx" ON "ContentReviewHistory"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ContentReviewHistory_reviewerId_idx" ON "ContentReviewHistory"("reviewerId");

-- CreateIndex
CREATE INDEX "Assessment_organizationId_idx" ON "Assessment"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");

-- CreateIndex
CREATE INDEX "Payment_organizationId_idx" ON "Payment"("organizationId");

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyProfile" ADD CONSTRAINT "CompanyProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyProfile" ADD CONSTRAINT "CompanyProfile_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyProfile" ADD CONSTRAINT "CompanyProfile_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyProfile" ADD CONSTRAINT "CompanyProfile_entryObjectiveId_fkey" FOREIGN KEY ("entryObjectiveId") REFERENCES "EntryObjective"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialSource" ADD CONSTRAINT "OfficialSource_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Stage 3 data backfill: provision a personal organization (OWNER membership +
-- company profile) for every existing user, then attach existing assessments
-- and payments to their owner's organization. Deterministic ids keep this
-- idempotent-safe and re-runnable against a known baseline. Data-preserving:
-- no existing rows are deleted or overwritten.
-- ---------------------------------------------------------------------------

-- One organization per existing user.
INSERT INTO "Organization" ("id", "name", "slug", "status", "createdAt", "updatedAt")
SELECT 'org_' || u."id",
       COALESCE(NULLIF(btrim(u."companyName"), ''), u."name"),
       'org-' || u."id",
       'ACTIVE',
       now(), now()
FROM "User" u;

-- OWNER membership linking the user to their organization.
INSERT INTO "OrganizationMembership" ("id", "organizationId", "userId", "role", "createdAt", "updatedAt")
SELECT 'mem_' || u."id", 'org_' || u."id", u."id", 'OWNER', now(), now()
FROM "User" u;

-- Company profile seeded from the user's mirrored profile columns.
INSERT INTO "CompanyProfile" ("id", "organizationId", "companyName", "originCountry", "companyType", "sectorId", "entryGoal", "locale", "onboardingDone", "createdAt", "updatedAt")
SELECT 'cp_' || u."id", 'org_' || u."id", u."companyName", u."country", u."companyType", u."sectorId", u."entryGoal", COALESCE(u."locale", 'en'), u."onboardingDone", now(), now()
FROM "User" u;

-- Attach existing assessments and payments to their owner's organization.
UPDATE "Assessment" a SET "organizationId" = 'org_' || a."userId" WHERE a."organizationId" IS NULL;
UPDATE "Payment" p SET "organizationId" = 'org_' || p."userId" WHERE p."organizationId" IS NULL;

-- Now that every row has an organization, enforce NOT NULL.
ALTER TABLE "Assessment" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "organizationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Pathway" ADD CONSTRAINT "Pathway_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pathway" ADD CONSTRAINT "Pathway_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathwayStep" ADD CONSTRAINT "PathwayStep_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "Pathway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathwayStep" ADD CONSTRAINT "PathwayStep_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathwayStepDependency" ADD CONSTRAINT "PathwayStepDependency_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "PathwayStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathwayStepDependency" ADD CONSTRAINT "PathwayStepDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "PathwayStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathwaySource" ADD CONSTRAINT "PathwaySource_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "Pathway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathwaySource" ADD CONSTRAINT "PathwaySource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "OfficialSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathwayAssumption" ADD CONSTRAINT "PathwayAssumption_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "Pathway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAnswer" ADD CONSTRAINT "AssessmentAnswer_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "Pathway"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSnapshot" ADD CONSTRAINT "ReportSnapshot_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReviewHistory" ADD CONSTRAINT "ContentReviewHistory_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
