import type { Locale } from "./index";

/**
 * Build a locale-aware href. The `lang` query is placed BEFORE any `#fragment`
 * so anchor links stay valid: e.g. `localeHref("/#how-it-works", "ar")` yields
 * `/?lang=ar#how-it-works`, never `/#how-it-works?lang=ar` (which makes the
 * fragment `how-it-works?lang=ar` — an invalid CSS selector that throws during
 * Next.js hash-scroll and hangs client navigation).
 */
export function localeHref(path: string, locale: Locale): string {
  const hashIndex = path.indexOf("#");
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const beforeHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const [pathname, query] = beforeHash.split("?");

  const params = new URLSearchParams(query ?? "");
  if (locale === "ar") {
    params.set("lang", "ar");
  } else {
    params.delete("lang");
  }

  const qs = params.toString();
  return `${pathname}${qs ? `?${qs}` : ""}${hash}`;
}

export function getLocaleFromSearch(lang?: string | null): Locale {
  return lang === "ar" ? "ar" : "en";
}
