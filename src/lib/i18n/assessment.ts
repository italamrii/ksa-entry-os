/**
 * Centralized bilingual assessment content. The SINGLE source for question
 * titles, "why this matters" hints, option labels, and wizard UI copy.
 * Components must consume this by locale — never duplicate translations inline.
 *
 * Internal values (question keys, option values like "foreign"/"setup") are
 * stable English keys and are what the API receives; only DISPLAY labels are
 * localized. Do not change payload values to translate the UI.
 */
import { LAUNCH_TIMELINES } from "@/lib/constants";
import type { Locale } from "@/lib/i18n";

export interface AssessmentOption {
  value: string;
  labelEn: string;
  labelAr: string;
}

export interface AssessmentQuestion {
  key: string;
  type: "select" | "boolean" | "text";
  titleEn: string;
  titleAr: string;
  hintEn: string;
  hintAr: string;
  options?: AssessmentOption[];
  /** Localized validation message when the answer is required but missing. */
  requiredEn?: string;
  requiredAr?: string;
}

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    key: "companyOrigin",
    type: "select",
    titleEn: "Is your company Saudi-based or foreign?",
    titleAr: "هل شركتكم سعودية أم أجنبية؟",
    hintEn: "Provided fact — used to select investment pathways.",
    hintAr: "حقيقة مُقدَّمة — تُستخدم لاختيار مسارات الاستثمار.",
    options: [
      { value: "foreign", labelEn: "Foreign company", labelAr: "شركة أجنبية" },
      { value: "local", labelEn: "Saudi / local company", labelAr: "شركة سعودية / محلية" },
    ],
    requiredEn: "Select your company origin to continue.",
    requiredAr: "اختر أصل الشركة للمتابعة.",
  },
  {
    key: "hasForeignEntity",
    type: "boolean",
    titleEn: "Do you already have a legal entity outside Saudi Arabia?",
    titleAr: "هل لديكم كيان قانوني خارج المملكة؟",
    hintEn: "Helps distinguish branch vs. new entity routes.",
    hintAr: "يساعد على التمييز بين الفرع والكيان الجديد.",
  },
  {
    key: "businessActivity",
    type: "text",
    titleEn: "What is your primary business activity in KSA?",
    titleAr: "ما نشاطكم التجاري الرئيسي في السعودية؟",
    hintEn: "Free-text context for sector-aware guidance.",
    hintAr: "سياق نصي للتوجيه القطاعي.",
  },
  {
    key: "hiringEmployees",
    type: "boolean",
    titleEn: "Will you hire employees in Saudi Arabia?",
    titleAr: "هل ستُوظّفون موظفين في المملكة؟",
    hintEn: "May surface labor and social-insurance pathways.",
    hintAr: "قد يُظهر مسارات العمل والتأمينات.",
  },
  {
    key: "sellingToGov",
    type: "boolean",
    titleEn: "Do you plan to sell to government entities?",
    titleAr: "هل تخططون للبيع للجهات الحكومية؟",
    hintEn: "May affect procurement readiness notes.",
    hintAr: "قد يؤثر على ملاحظات جاهزية المشتريات.",
  },
  {
    key: "needsLocalOffice",
    type: "boolean",
    titleEn: "Do you need a local office or presence?",
    titleAr: "هل تحتاجون مكتبًا أو حضورًا محليًا؟",
    hintEn: "Informs municipal and presence-related steps.",
    hintAr: "يُفيد خطوات البلدية والحضور المحلي.",
  },
  {
    key: "invoiceCustomers",
    type: "boolean",
    titleEn: "Will you invoice Saudi customers?",
    titleAr: "هل ستُصدِرون فواتير لعملاء سعوديين؟",
    hintEn: "May relate to tax readiness pathways.",
    hintAr: "قد يرتبط بمسارات الجاهزية الضريبية.",
  },
  {
    key: "sectorLicensing",
    type: "boolean",
    titleEn: "Does your activity require sector-specific licensing?",
    titleAr: "هل يتطلب نشاطكم ترخيصًا قطاعيًا؟",
    hintEn: "Flags sector licensing pathways when applicable.",
    hintAr: "يُظهر مسارات الترخيص القطاعي عند الانطباق.",
  },
  {
    key: "launchTimeline",
    type: "select",
    titleEn: "What is your target market-entry timeline?",
    titleAr: "ما الجدول الزمني المستهدف لدخول السوق؟",
    hintEn: "Planning context only — not an approval forecast.",
    hintAr: "سياق تخطيط فقط — ليس توقع موافقة.",
    options: LAUNCH_TIMELINES.map((t) => ({ value: t.value, labelEn: t.labelEn, labelAr: t.labelAr })),
  },
];

/** Wizard chrome / states, localized in one place. */
export const ASSESSMENT_UI = {
  en: {
    title: "Strategic entry session",
    subtitle: "Guided questions to map official pathways for your expansion plan",
    back: "Back",
    next: "Next",
    generate: "Generate entry roadmap",
    generating: "Mapping pathways…",
    yes: "Yes",
    no: "No",
    placeholder: "Describe your business activity",
    review: "Review answers",
    provided: "Provided",
    edit: "Edit",
    why: "Why this matters",
    journey: "Assessment journey",
    submitFailed: "Failed to create assessment",
    genericError: "Something went wrong. Your answers are kept — please try again.",
    success: "Entry roadmap generated",
  },
  ar: {
    title: "جلسة تخطيط الدخول",
    subtitle: "أسئلة موجَّهة لربط المسارات الرسمية المناسبة",
    back: "رجوع",
    next: "التالي",
    generate: "إنشاء خارطة طريق الدخول",
    generating: "جاري رسم المسارات…",
    yes: "نعم",
    no: "لا",
    placeholder: "صف نشاط شركتك",
    review: "مراجعة الإجابات",
    provided: "مُقدَّم",
    edit: "تعديل",
    why: "لماذا يهم",
    journey: "رحلة التقييم",
    submitFailed: "تعذر إنشاء التقييم",
    genericError: "حدث خطأ ما. إجاباتك محفوظة — يرجى المحاولة مرة أخرى.",
    success: "تم إنشاء خارطة الطريق",
  },
} as const;

export function questionTitle(q: AssessmentQuestion, locale: Locale): string {
  return locale === "ar" ? q.titleAr : q.titleEn;
}
export function questionHint(q: AssessmentQuestion, locale: Locale): string {
  return locale === "ar" ? q.hintAr : q.hintEn;
}
export function optionLabel(o: AssessmentOption, locale: Locale): string {
  return locale === "ar" ? o.labelAr : o.labelEn;
}
