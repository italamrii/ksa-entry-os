export const APP_NAME = "KSA Entry OS";
export const APP_TAGLINE_EN = "Navigate Saudi market entry with confidence.";
export const APP_TAGLINE_AR = "افهم خطوات دخول السوق السعودي بوضوح وثقة.";

export const DISCLAIMER_EN =
  "This platform provides general guidance and informational reports to help companies understand potential steps for entering the Saudi market using public official sources. The platform is not a government entity, law firm, tax advisor, accounting firm, or licensed consultancy. Information provided does not constitute legal, tax, accounting, or regulatory advice and does not guarantee approval, registration, licensing, or acceptance by any authority. Users should verify all requirements with official authorities or licensed advisors before making decisions.";

export const DISCLAIMER_AR =
  "تقدم هذه المنصة معلومات وتقارير إرشادية عامة لمساعدة الشركات على فهم الخطوات المحتملة لدخول السوق السعودي بالاعتماد على مصادر رسمية متاحة للعامة. لا تمثل المنصة جهة حكومية، ولا تعد مكتب محاماة أو مستشارًا ضريبيًا أو محاسبيًا أو جهة مرخصة لتقديم الاستشارات النظامية. لا تُعد المعلومات المقدمة استشارة قانونية أو ضريبية أو محاسبية أو تنظيمية، ولا تضمن قبول أو إصدار أي سجل أو ترخيص أو موافقة من أي جهة. يجب على المستخدم التحقق من المتطلبات عبر الجهات الرسمية أو المستشارين المرخصين قبل اتخاذ أي قرار.";

export const PRICING = {
  FREE: { name: "Free", price: 0, currency: "SAR", features: ["Basic assessment", "Limited roadmap preview"] },
  PROFESSIONAL: {
    name: "Professional Report",
    price: 499,
    currency: "SAR",
    features: ["Full roadmap", "PDF export", "Official links", "Risk notes"],
  },
  BUSINESS: {
    name: "Business",
    price: 1499,
    currency: "SAR",
    features: ["Full report", "Priority review request", "Consultation booking request"],
  },
} as const;

export const COMPANY_TYPES = [
  { value: "foreign", labelEn: "Foreign Company", labelAr: "شركة أجنبية" },
  { value: "local", labelEn: "Saudi / Local Company", labelAr: "شركة سعودية / محلية" },
  { value: "branch", labelEn: "Branch / Representative Office", labelAr: "فرع / مكتب تمثيلي" },
] as const;

export const ENTRY_GOALS = [
  { value: "setup", labelEn: "Establish a legal entity", labelAr: "تأسيس كيان قانوني" },
  { value: "hire", labelEn: "Hire employees in KSA", labelAr: "توظيف موظفين في السعودية" },
  { value: "sell", labelEn: "Sell products/services", labelAr: "بيع منتجات/خدمات" },
  { value: "gov", labelEn: "Sell to government", labelAr: "البيع للجهات الحكومية" },
  { value: "explore", labelEn: "Explore market entry options", labelAr: "استكشاف خيارات دخول السوق" },
] as const;

export const LAUNCH_TIMELINES = [
  { value: "1-3", labelEn: "1–3 months", labelAr: "1–3 أشهر" },
  { value: "3-6", labelEn: "3–6 months", labelAr: "3–6 أشهر" },
  { value: "6-12", labelEn: "6–12 months", labelAr: "6–12 شهرًا" },
  { value: "12+", labelEn: "12+ months", labelAr: "أكثر من 12 شهرًا" },
] as const;
