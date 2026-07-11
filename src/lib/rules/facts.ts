/**
 * Normalized fact layer. Turns raw company profile + assessment answers into a
 * stable, attributed fact set used by the deterministic evaluator.
 *
 * Facts distinguish user-provided values from engine-inferred values, carry a
 * confidence level, and are versioned so historical evaluations remain
 * reproducible. Original answers are preserved untouched.
 */
import type { FactSet, NormalizedFact, FactPrimitive } from "@/lib/rules/conditions";

/** Bump when the normalization logic changes in a way that alters facts. */
export const FACTS_VERSION = 1;

export interface RawAnswers {
  companyOrigin?: string | null;
  hasForeignEntity?: boolean | null;
  sectorSlug?: string | null;
  businessActivity?: string | null;
  hiringEmployees?: boolean | null;
  sellingToGov?: boolean | null;
  needsLocalOffice?: boolean | null;
  invoiceCustomers?: boolean | null;
  sectorLicensing?: boolean | null;
  launchTimeline?: string | null;
}

export interface RawProfile {
  companyType?: string | null;
  sectorSlug?: string | null;
  entryGoal?: string | null;
  originCountry?: string | null;
  operatingModel?: string | null;
  targetRegion?: string | null;
  marketEntryStatus?: string | null;
}

export interface NormalizedFactsResult {
  version: number;
  facts: FactSet;
  originalAnswers: RawAnswers;
}

const REGULATED_SECTORS = new Set(["healthcare-support", "food-beverage"]);

function provided(
  value: FactPrimitive,
  confidence: NormalizedFact["confidence"] = "HIGH",
  labels?: { en: string; ar: string }
): NormalizedFact {
  return { value, source: "provided", confidence, labelEn: labels?.en, labelAr: labels?.ar };
}

function inferred(
  value: FactPrimitive,
  confidence: NormalizedFact["confidence"] = "MEDIUM",
  labels?: { en: string; ar: string }
): NormalizedFact {
  return { value, source: "inferred", confidence, labelEn: labels?.en, labelAr: labels?.ar };
}

function bool(v: boolean | null | undefined): boolean {
  return v === true;
}

/**
 * Build the normalized fact set. Deterministic and pure — no I/O, no clock,
 * no randomness. Missing inputs simply produce fewer/false facts.
 */
export function normalizeFacts(profile: RawProfile | null, answers: RawAnswers): NormalizedFactsResult {
  const facts: FactSet = {};
  const sectorSlug = answers.sectorSlug ?? profile?.sectorSlug ?? null;
  const companyType = profile?.companyType ?? null;

  // --- Provided facts (directly from the user) ---
  if (answers.companyOrigin != null) {
    facts["company.origin"] = provided(answers.companyOrigin, "HIGH", { en: "Company origin", ar: "أصل الشركة" });
  }
  facts["company.hasForeignEntity"] = provided(bool(answers.hasForeignEntity), "HIGH", { en: "Has a foreign entity", ar: "لديها كيان أجنبي" });
  facts["intent.hiring"] = provided(bool(answers.hiringEmployees), "HIGH", { en: "Intends to hire", ar: "ينوي التوظيف" });
  facts["intent.sellToGov"] = provided(bool(answers.sellingToGov), "HIGH", { en: "Sells to government", ar: "يبيع للحكومة" });
  facts["intent.invoiceCustomers"] = provided(bool(answers.invoiceCustomers), "HIGH", { en: "Invoices customers", ar: "يصدر فواتير للعملاء" });
  facts["presence.localOffice"] = provided(bool(answers.needsLocalOffice), "HIGH", { en: "Needs a local office", ar: "يحتاج مكتبًا محليًا" });
  facts["sector.licensing"] = provided(bool(answers.sectorLicensing), "HIGH", { en: "Sector requires licensing", ar: "القطاع يتطلب ترخيصًا" });
  if (answers.launchTimeline != null) {
    facts["plan.timeline"] = provided(answers.launchTimeline, "MEDIUM", { en: "Launch timeline", ar: "الجدول الزمني للإطلاق" });
  }
  if (sectorSlug != null) {
    facts["sector.slug"] = provided(sectorSlug, "HIGH", { en: "Sector", ar: "القطاع" });
  }
  if (companyType != null) {
    facts["company.type"] = provided(companyType, "HIGH", { en: "Company type", ar: "نوع الشركة" });
  }
  if (profile?.entryGoal != null) {
    facts["objective"] = provided(profile.entryGoal, "HIGH", { en: "Entry objective", ar: "هدف الدخول" });
  }

  // --- Inferred facts (derived, never treated as ground truth) ---
  const foreignOwnership = companyType === "foreign" || answers.companyOrigin === "foreign";
  facts["ownership.foreign"] = inferred(foreignOwnership, "HIGH", { en: "Foreign ownership context", ar: "سياق ملكية أجنبية" });

  const regulated =
    (sectorSlug != null && REGULATED_SECTORS.has(sectorSlug)) ||
    (sectorSlug === "technology-saas" && bool(answers.sectorLicensing));
  facts["activity.regulated"] = inferred(regulated, "MEDIUM", { en: "Regulated activity indication", ar: "مؤشر نشاط منظم" });

  facts["review.professionalRecommended"] = inferred(
    regulated || bool(answers.sellingToGov),
    "MEDIUM",
    { en: "Professional review recommended", ar: "يوصى بمراجعة مهنية" }
  );

  // Conflict indicator: declared local but reports holding a foreign entity.
  facts["conflict.ownership"] = inferred(
    companyType === "local" && bool(answers.hasForeignEntity),
    "MEDIUM",
    { en: "Conflicting ownership inputs", ar: "مدخلات ملكية متعارضة" }
  );

  return {
    version: FACTS_VERSION,
    facts,
    originalAnswers: {
      companyOrigin: answers.companyOrigin ?? null,
      hasForeignEntity: answers.hasForeignEntity ?? null,
      sectorSlug: sectorSlug,
      businessActivity: answers.businessActivity ?? null,
      hiringEmployees: answers.hiringEmployees ?? null,
      sellingToGov: answers.sellingToGov ?? null,
      needsLocalOffice: answers.needsLocalOffice ?? null,
      invoiceCustomers: answers.invoiceCustomers ?? null,
      sectorLicensing: answers.sectorLicensing ?? null,
      launchTimeline: answers.launchTimeline ?? null,
    },
  };
}
