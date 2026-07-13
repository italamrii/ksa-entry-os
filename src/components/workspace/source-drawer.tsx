"use client";

import { useEffect, useRef } from "react";
import { X, ExternalLink, AlertTriangle } from "lucide-react";
import { t } from "@/lib/i18n";
import { term, classificationLabel } from "@/lib/i18n/glossary";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import type { Locale, SourceVM } from "@/lib/view-models/types";
import { FreshnessIndicator } from "./badges";

/**
 * SourceDrawer — a contextual evidence layer for one official source. It is an
 * accessible modal dialog: focus moves in on open, Escape closes, focus returns
 * to the trigger, and it makes explicit that following the link leaves the
 * platform for an independently operated site.
 */
export function SourceDrawer({ locale, source, onClose }: { locale: Locale; source: SourceVM | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!source) return;
    prevFocus.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prevFocus.current?.focus?.();
    };
  }, [source, onClose]);

  if (!source) return null;
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end sm:items-stretch" dir={dir}>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t(locale, "Official source details", "تفاصيل المصدر الرسمي")}
        className="relative flex max-h-[88vh] w-full max-w-md flex-col overflow-y-auto rounded-t-[var(--radius-lg)] border border-[var(--border-subtle)] border-b-0 bg-[var(--card)] p-6 shadow-2xl animate-drawer-in motion-reduce:animate-none sm:h-full sm:max-h-none sm:rounded-none sm:border-b sm:border-s sm:border-e-0 sm:border-t-0"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">{source.title}</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={t(locale, "Close", "إغلاق")} className="rounded-[var(--radius-sm)] p-1 text-[var(--muted)] outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="mt-3"><FreshnessIndicator locale={locale} state={source.freshness} /></div>

        <dl className="mt-5 space-y-3 text-sm">
          <Row label={t(locale, "Issuing authority", "الجهة المُصدِرة")} value={source.authority ?? t(locale, "Unknown", "غير معروفة")} />
          <Row label={term(locale, "sourceClassification")} value={classificationLabel(locale, source.classification)} />
          <Row label={t(locale, "Original language", "اللغة الأصلية")} value={source.language.toUpperCase()} />
          <Row label={t(locale, "Version", "الإصدار")} value={formatNumber(locale, source.version)} />
          <Row label={term(locale, "lastVerified")} value={formatDate(locale, source.lastVerified)} />
          <Row label={term(locale, "nextReview")} value={formatDate(locale, source.nextReview)} />
        </dl>

        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="flex items-start gap-2 text-xs text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {t(
              locale,
              "You are about to leave KSA Entry OS. This is an independently operated official website. Verification and execution happen there — we do not control its content.",
              "أنت على وشك مغادرة منصة KSA Entry OS إلى موقع رسمي مستقل. يتم التحقق والتنفيذ هناك، ولا نتحكم في محتواه."
            )}
          </p>
        </div>

        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white outline-none hover:bg-[var(--accent-bright)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          {t(locale, "Open official source", "فتح المصدر الرسمي")}
        </a>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
