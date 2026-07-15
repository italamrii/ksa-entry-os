"use client";

import { useSearchParams } from "next/navigation";
import { getLocaleFromSearch } from "@/lib/i18n/locale-utils";
import type { Locale } from "@/lib/i18n";

/**
 * Canonical client-side locale resolution: reads `?lang` from the URL.
 * Pair every `router.push(...)` with `localeHref(path, locale)` so Arabic is
 * never dropped across client navigations or post-submit redirects.
 */
export function useLocale(): Locale {
  const params = useSearchParams();
  return getLocaleFromSearch(params.get("lang"));
}
