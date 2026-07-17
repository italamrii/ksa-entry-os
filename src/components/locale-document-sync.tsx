"use client";

import { Suspense, useEffect } from "react";
import { useLocale } from "@/lib/i18n/use-locale";

/**
 * Keeps the document element's lang/dir in step with the URL locale.
 *
 * Locale lives in `?lang=` rather than a route segment, and a root layout
 * cannot read searchParams — so without this, Arabic pages ship
 * `<html lang="en">` with no `dir`: screen readers announce the wrong
 * language and any content outside a dir-wrapped container renders LTR.
 * This is the ONLY place that writes document.documentElement.lang/dir;
 * components must resolve locale from useLocale()/props, never by reading
 * the DOM back.
 */
function LocaleDocumentSyncInner() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);
  return null;
}

export function LocaleDocumentSync() {
  return (
    <Suspense fallback={null}>
      <LocaleDocumentSyncInner />
    </Suspense>
  );
}
