/**
 * Canonical bilingual terminology. The SINGLE approved translation for every
 * core concept — components must read terms from here rather than inventing
 * competing translations inline. Arabic is written to read natively (not as a
 * translation of English) and to stay cautious about outcomes/affiliation.
 */
import type { Locale } from "@/lib/i18n";

export interface Term {
  en: string;
  ar: string;
}

export const GLOSSARY = {
  // Domain concepts
  marketEntry: { en: "Market entry", ar: "دخول السوق" },
  entryPathway: { en: "Entry pathway", ar: "مسار الدخول" },
  recommendedPathways: { en: "Recommended pathways", ar: "المسارات الموصى بها" },
  excludedPathways: { en: "Excluded pathways", ar: "المسارات المستبعدة" },
  companyContext: { en: "Company context", ar: "سياق الشركة" },
  entryObjective: { en: "Entry objective", ar: "هدف الدخول" },
  operatingModel: { en: "Operating model", ar: "نموذج التشغيل" },
  assessment: { en: "Assessment", ar: "التقييم" },
  recommendation: { en: "Recommendation", ar: "التوصية" },
  assumptions: { en: "Assumptions", ar: "الافتراضات" },
  risks: { en: "Risks & complexity", ar: "المخاطر والتعقيد" },
  complexity: { en: "Complexity", ar: "التعقيد" },
  dependencies: { en: "Dependencies", ar: "الاعتمادات" },
  authorities: { en: "Authority matrix", ar: "مصفوفة الجهات" },
  authority: { en: "Authority", ar: "الجهة" },
  officialSources: { en: "Official sources", ar: "المصادر الرسمية" },
  officialSource: { en: "Official source", ar: "المصدر الرسمي" },
  sourceClassification: { en: "Classification", ar: "التصنيف" },
  lastVerified: { en: "Last verified", ar: "آخر تحقق" },
  nextReview: { en: "Next review", ar: "المراجعة التالية" },
  informationCutoff: { en: "Information cutoff", ar: "تاريخ توقف المعلومات" },
  officialVerificationRequired: { en: "Official verification required", ar: "يلزم تحقق رسمي" },
  professionalReviewRecommended: { en: "Professional review recommended", ar: "يوصى بمراجعة مهنية" },
  userProvided: { en: "You provided", ar: "قدّمتَه أنت" },
  platformInferred: { en: "Platform inferred", ar: "استنتجته المنصة" },
  inferred: { en: "inferred", ar: "مُستنتج" },
  provided: { en: "provided", ar: "مُقدَّم" },
  planningIndicator: { en: "Planning indicator", ar: "مؤشر التخطيط" },
  nextActions: { en: "Prioritized next actions", ar: "الإجراءات التالية حسب الأولوية" },
  report: { en: "Report", ar: "التقرير" },
  overview: { en: "Overview", ar: "نظرة عامة" },
  executiveSummary: { en: "Executive summary", ar: "الملخص التنفيذي" },

  // Statuses (never conveyed by color alone)
  verified: { en: "Verified", ar: "مُحقَّق" },
  reviewDue: { en: "Review due", ar: "المراجعة مستحقة" },
  outdated: { en: "Outdated — re-verify", ar: "متقادم — يلزم إعادة التحقق" },
  noSource: { en: "No source", ar: "لا يوجد مصدر" },
  published: { en: "Published", ar: "منشور" },
  stale: { en: "Stale", ar: "متقادم" },
  retired: { en: "Retired", ar: "متوقّف" },
} as const satisfies Record<string, Term>;

export type GlossaryKey = keyof typeof GLOSSARY;

/** Resolve an approved term in the given locale. */
export function term(locale: Locale, key: GlossaryKey): string {
  const t = GLOSSARY[key];
  return locale === "ar" ? t.ar : t.en;
}

const LEVELS = {
  LOW: { en: "Low", ar: "منخفض" },
  MEDIUM: { en: "Medium", ar: "متوسط" },
  HIGH: { en: "High", ar: "مرتفع" },
} as const;

export function levelLabel(locale: Locale, level: "LOW" | "MEDIUM" | "HIGH"): string {
  return locale === "ar" ? LEVELS[level].ar : LEVELS[level].en;
}

const CLASSIFICATION: Record<string, Term> = {
  OFFICIAL_PRIMARY: { en: "Official — primary", ar: "رسمي — أساسي" },
  OFFICIAL_SECONDARY: { en: "Official — secondary", ar: "رسمي — ثانوي" },
  REGULATOR_GUIDANCE: { en: "Regulator guidance", ar: "إرشادات الجهة المنظِّمة" },
  GOVERNMENT_PORTAL: { en: "Government portal", ar: "بوابة حكومية" },
  PROFESSIONAL_REFERENCE: { en: "Professional reference", ar: "مرجع مهني" },
  INTERNAL_INTERPRETATION: { en: "Internal interpretation", ar: "تفسير داخلي" },
};

/** Localize a source classification enum for display. */
export function classificationLabel(locale: Locale, classification: string): string {
  const c = CLASSIFICATION[classification];
  return c ? (locale === "ar" ? c.ar : c.en) : classification;
}
