import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDate as formatDateLocalized } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Long, locale-aware date. Delegates to the centralized formatter (Gregorian
 * calendar + Latin numerals in both locales). */
export function formatDate(date: Date | string, locale: Locale | string = "en") {
  return formatDateLocalized(locale === "ar" ? "ar" : "en", date);
}

export function generateInvoiceNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${ts}-${rand}`;
}
