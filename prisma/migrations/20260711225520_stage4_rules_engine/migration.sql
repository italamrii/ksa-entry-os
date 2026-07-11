-- AlterTable
ALTER TABLE "Recommendation" ADD COLUMN     "evaluationResultId" TEXT,
ADD COLUMN     "nextActions" JSONB,
ADD COLUMN     "priorityFactors" JSONB,
ADD COLUMN     "priorityScore" INTEGER,
ADD COLUMN     "reasoning" JSONB,
ADD COLUMN     "riskFactors" JSONB,
ADD COLUMN     "ruleKey" TEXT,
ADD COLUMN     "ruleVersion" INTEGER;

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "explanationEn" TEXT NOT NULL,
    "explanationAr" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "effectiveDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "conditions" JSONB NOT NULL,
    "outcomes" JSONB,
    "pathwayId" TEXT,
    "assumptions" JSONB,
    "uncertainty" "ConfidenceLevel" NOT NULL DEFAULT 'MEDIUM',
    "requiresProfessionalReview" BOOLEAN NOT NULL DEFAULT false,
    "requiresVerification" BOOLEAN NOT NULL DEFAULT true,
    "reviewerId" TEXT,
    "limitationsEn" TEXT,
    "limitationsAr" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationResult" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "factsVersion" INTEGER NOT NULL,
    "knowledgeVersion" INTEGER NOT NULL DEFAULT 1,
    "rulesetSignature" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "factsSnapshot" JSONB NOT NULL,
    "sourcesSnapshot" JSONB NOT NULL,
    "risks" JSONB NOT NULL,
    "assumptions" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssumptionDecision" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "assumptionKey" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "decidedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssumptionDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Rule_status_idx" ON "Rule"("status");

-- CreateIndex
CREATE INDEX "Rule_pathwayId_idx" ON "Rule"("pathwayId");

-- CreateIndex
CREATE UNIQUE INDEX "Rule_ruleKey_version_key" ON "Rule"("ruleKey", "version");

-- CreateIndex
CREATE INDEX "EvaluationResult_assessmentId_idx" ON "EvaluationResult"("assessmentId");

-- CreateIndex
CREATE INDEX "EvaluationResult_organizationId_idx" ON "EvaluationResult"("organizationId");

-- CreateIndex
CREATE INDEX "EvaluationResult_assessmentId_inputHash_idx" ON "EvaluationResult"("assessmentId", "inputHash");

-- CreateIndex
CREATE INDEX "AssumptionDecision_assessmentId_idx" ON "AssumptionDecision"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssumptionDecision_assessmentId_assumptionKey_key" ON "AssumptionDecision"("assessmentId", "assumptionKey");

-- CreateIndex
CREATE INDEX "Recommendation_evaluationResultId_idx" ON "Recommendation"("evaluationResultId");

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_evaluationResultId_fkey" FOREIGN KEY ("evaluationResultId") REFERENCES "EvaluationResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "Pathway"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationResult" ADD CONSTRAINT "EvaluationResult_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationResult" ADD CONSTRAINT "EvaluationResult_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssumptionDecision" ADD CONSTRAINT "AssumptionDecision_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssumptionDecision" ADD CONSTRAINT "AssumptionDecision_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
