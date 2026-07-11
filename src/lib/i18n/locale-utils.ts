import type { Locale } from "./index";

export function localeHref(path: string, locale: Locale): string {
  if (locale === "ar") {
    const [base, query] = path.split("?");
    const params = new URLSearchParams(query ?? "");
    params.set("lang", "ar");
    const qs = params.toString();
    return qs ? `${base}?${qs}` : `${base}?lang=ar`;
  }
  return path.replace(/[?&]lang=ar(&|$)/, (_, sep) => (sep === "&" ? "?" : "")).replace(/\?$/, "");
}

export function getLocaleFromSearch(lang?: string | null): Locale {
  return lang === "ar" ? "ar" : "en";
}
