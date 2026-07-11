export type Locale = "en" | "ar";

export function getDirection(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}

export function t(locale: Locale, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

export function localizedField<T extends Record<string, unknown>>(
  locale: Locale,
  obj: T,
  field: string
): string {
  const key = locale === "ar" ? `${field}Ar` : `${field}En`;
  const value = obj[key as keyof T];
  if (typeof value === "string") return value;
  const fallback = obj[`${field}En` as keyof T];
  return typeof fallback === "string" ? fallback : "";
}

export const nav = {
  en: {
    home: "Home",
    pricing: "Pricing",
    login: "Log in",
    register: "Get started",
    dashboard: "Dashboard",
    assessment: "New Assessment",
    requests: "Entry Reports",
    payments: "Payments",
    settings: "Settings",
    admin: "Admin",
    logout: "Log out",
  },
  ar: {
    home: "الرئيسية",
    pricing: "الأسعار",
    login: "تسجيل الدخول",
    register: "ابدأ التقييم",
    dashboard: "لوحة التحكم",
    assessment: "تقييم جديد",
    requests: "تقارير الدخول",
    payments: "المدفوعات",
    settings: "الإعدادات",
    admin: "الإدارة",
    logout: "تسجيل الخروج",
  },
} as const;

export const complexityLabels = {
  en: { LOW: "Low", MEDIUM: "Medium", HIGH: "High" },
  ar: { LOW: "منخفض", MEDIUM: "متوسط", HIGH: "مرتفع" },
} as const;

export const riskLabels = {
  en: { LOW: "Low", MEDIUM: "Medium", HIGH: "High" },
  ar: { LOW: "منخفض", MEDIUM: "متوسط", HIGH: "مرتفع" },
} as const;
