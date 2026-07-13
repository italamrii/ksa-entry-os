/**
 * Centralized locale-aware formatting. One source of truth for dates, numbers,
 * and percentages so numeral conventions never get mixed across the UI.
 *
 * Policy: Arabic uses natural Arabic month names but the Gregorian calendar and
 * Latin (Western) numerals — the readable, unambiguous choice for GCC executive
 * users and consistent with the Gregorian dates the platform stores. Technical
 * identifiers and URLs are never reformatted.
 */
import type { Locale } from "@/lib/i18n";

function intlLocale(locale: Locale): string {
  return locale === "ar" ? "ar" : "en";
}

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  calendar: "gregory",
  numberingSystem: "latn",
  year: "numeric",
  month: "long",
  day: "numeric",
};

/** Long, locale-aware date (e.g. "11 July 2026" / "11 يوليو 2026"). */
export function formatDate(locale: Locale, value: Date | string | null | undefined, fallback = "—"): string {
  if (!value) return fallback;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat(intlLocale(locale), DATE_OPTS).format(d);
}

/** Short numeric date (e.g. "11/07/2026") with Latin numerals in both locales. */
export function formatDateShort(locale: Locale, value: Date | string | null | undefined, fallback = "—"): string {
  if (!value) return fallback;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function formatNumber(locale: Locale, value: number): string {
  return new Intl.NumberFormat(intlLocale(locale), { numberingSystem: "latn" }).format(value);
}

/** A bounded indicator like "74/100" with Latin numerals in both locales. */
export function formatScore(locale: Locale, value: number, max = 100): string {
  return `${formatNumber(locale, value)}/${formatNumber(locale, max)}`;
}

export function formatPercent(locale: Locale, value0to100: number): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    numberingSystem: "latn",
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value0to100 / 100);
}

/** Locale-aware currency (server stores integer minor-unit-free amounts). */
export function formatCurrency(locale: Locale, amount: number, currency = "SAR"): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    numberingSystem: "latn",
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
