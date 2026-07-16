/**
 * Knowledge-coverage safety + admin operations.
 *
 * The platform must never present an empty roadmap as a completed result. When
 * no governed (PUBLISHED, in-date, source-backed) knowledge matches a completed
 * assessment, we surface an explicit "insufficient governed knowledge" state,
 * explain what is missing, and raise an admin alert — rather than silently
 * rendering "0 steps".
 *
 * Read-only + alerting. No rules/governance/evaluation logic is duplicated here.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/i18n";

export type CoverageStatus = "COVERED" | "INSUFFICIENT_KNOWLEDGE";

export interface CoverageMissingInput {
  key: string;
  labelEn: string;
  labelAr: string;
}

export interface CoverageAssessment {
  status: CoverageStatus;
  matchedCount: number;
  /** Company-context facts that, if provided, would improve applicability. */
  missingInputs: CoverageMissingInput[];
  /** True when the knowledge base itself is empty/unpublished (not a user-input issue). */
  knowledgeBaseEmpty: boolean;
}

/** Inputs that materially drive applicability in the current ruleset. */
const APPLICABILITY_INPUTS: CoverageMissingInput[] = [
  { key: "sector", labelEn: "Sector", labelAr: "القطاع" },
  { key: "companyType", labelEn: "Company type", labelAr: "نوع الشركة" },
  { key: "entryGoal", labelEn: "Entry objective", labelAr: "هدف الدخول" },
  { key: "businessActivity", labelEn: "Business activity", labelAr: "النشاط التجاري" },
];

/**
 * Classify coverage for a completed assessment. `matchedCount` is the number of
 * governed items the evaluator actually produced (steps or recommendations).
 */
export async function assessCoverage(args: {
  matchedCount: number;
  context: { sectorId?: string | null; companyType?: string | null; entryGoal?: string | null; businessActivity?: string | null };
}): Promise<CoverageAssessment> {
  if (args.matchedCount > 0) {
    return { status: "COVERED", matchedCount: args.matchedCount, missingInputs: [], knowledgeBaseEmpty: false };
  }

  // Distinguish "we have no knowledge" from "we lack the facts to match any".
  const publishedRequirements = await prisma.requirement.count({ where: { isActive: true } });
  const knowledgeBaseEmpty = publishedRequirements === 0;

  const missingInputs = APPLICABILITY_INPUTS.filter((i) => {
    if (i.key === "sector") return !args.context.sectorId;
    if (i.key === "companyType") return !args.context.companyType;
    if (i.key === "entryGoal") return !args.context.entryGoal;
    if (i.key === "businessActivity") return !args.context.businessActivity;
    return false;
  });

  return { status: "INSUFFICIENT_KNOWLEDGE", matchedCount: 0, missingInputs, knowledgeBaseEmpty };
}

/**
 * Raise (idempotently) an admin governance alert for an assessment that matched
 * zero governed requirements. Never throws — coverage alerting must not fail the
 * user's request.
 */
export async function alertZeroCoverage(args: {
  assessmentId: string;
  knowledgeBaseEmpty: boolean;
  missingInputKeys: string[];
}): Promise<void> {
  try {
    const reason = args.knowledgeBaseEmpty
      ? "No active requirements exist — the reference/knowledge base is not seeded."
      : `No governed requirement matched. Missing context: ${args.missingInputKeys.join(", ") || "none"}.`;
    await prisma.contentAlert.upsert({
      where: {
        type_entityType_entityId_status: {
          type: "ASSESSMENT_ZERO_COVERAGE",
          entityType: "Assessment",
          entityId: args.assessmentId,
          status: "OPEN",
        },
      },
      update: { severity: "HIGH", messageEn: reason },
      create: {
        type: "ASSESSMENT_ZERO_COVERAGE",
        entityType: "Assessment",
        entityId: args.assessmentId,
        severity: "HIGH",
        status: "OPEN",
        messageEn: reason,
        messageAr: args.knowledgeBaseEmpty
          ? "لا توجد متطلبات مفعّلة — قاعدة المعرفة المرجعية غير مهيأة."
          : "لم تتطابق أي متطلبات محوكمة مع هذا التقييم.",
        metadata: { missingInputs: args.missingInputKeys } as Prisma.InputJsonValue,
      },
    });
  } catch {
    // Alerting is best-effort; never surface it to the user.
  }
}

export function coverageMessage(coverage: CoverageAssessment, locale: Locale): string {
  if (coverage.status === "COVERED") return "";
  if (coverage.knowledgeBaseEmpty) {
    return locale === "ar"
      ? "قاعدة المعرفة المرجعية غير مكتملة حاليًا، لذلك لا يمكن إصدار خارطة طريق موثوقة. تم إخطار الفريق."
      : "The governed knowledge base is incomplete, so a reliable roadmap cannot be issued yet. Our team has been notified.";
  }
  return locale === "ar"
    ? "لا توجد معلومات كافية لتحديد المتطلبات المنطبقة بدقة. أكمل البيانات الناقصة أدناه."
    : "There is not enough information to determine applicable requirements with confidence. Complete the missing details below.";
}

// ---------------------------------------------------------------------------
// Admin knowledge operations (read-only visibility)
// ---------------------------------------------------------------------------

export async function findAssessmentsWithZeroCoverage(limit = 50) {
  return prisma.assessment.findMany({
    where: { steps: { none: {} } },
    select: { id: true, organizationId: true, createdAt: true, companyOrigin: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** Published rules that have no source-backed pathway (cannot legally evaluate). */
export async function findRulesWithoutSource() {
  const rules = await prisma.rule.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    select: { id: true, ruleKey: true, pathway: { select: { id: true, sources: { select: { id: true } } } } },
  });
  return rules.filter((r) => !r.pathway || r.pathway.sources.length === 0);
}

/** Published pathways with no ordered steps (dependency map would be empty). */
export async function findPathwaysWithoutSteps() {
  return prisma.pathway.findMany({
    where: { status: "PUBLISHED", deletedAt: null, steps: { none: {} } },
    select: { id: true, slug: true, titleEn: true },
  });
}

/** Sectors that have no published pathway — a coverage gap. */
export async function findSectorsWithoutPathway() {
  const sectors = await prisma.sector.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, nameEn: true, pathways: { where: { status: "PUBLISHED" }, select: { id: true } } },
  });
  return sectors.filter((s) => s.pathways.length === 0).map(({ id, slug, nameEn }) => ({ id, slug, nameEn }));
}

/** Content that is authored but not yet governed to PUBLISHED. */
export async function findUnpublishedKnowledge() {
  const [rules, pathways, sources] = await Promise.all([
    prisma.rule.count({ where: { status: { not: "PUBLISHED" }, deletedAt: null } }),
    prisma.pathway.count({ where: { status: { not: "PUBLISHED" }, deletedAt: null } }),
    prisma.officialSource.count({ where: { status: { not: "PUBLISHED" }, deletedAt: null } }),
  ]);
  return { rules, pathways, sources };
}

/** One call for an admin knowledge-health panel. */
export async function knowledgeHealthSummary() {
  const [zeroCoverage, rulesWithoutSource, pathwaysWithoutSteps, sectorsWithoutPathway, unpublished, openAlerts] =
    await Promise.all([
      findAssessmentsWithZeroCoverage(10),
      findRulesWithoutSource(),
      findPathwaysWithoutSteps(),
      findSectorsWithoutPathway(),
      findUnpublishedKnowledge(),
      prisma.contentAlert.count({ where: { status: "OPEN" } }),
    ]);
  return {
    assessmentsWithZeroCoverage: zeroCoverage.length,
    rulesWithoutSource: rulesWithoutSource.length,
    pathwaysWithoutSteps: pathwaysWithoutSteps.length,
    sectorsWithoutPathway: sectorsWithoutPathway.map((s) => s.slug),
    unpublished,
    openAlerts,
  };
}
