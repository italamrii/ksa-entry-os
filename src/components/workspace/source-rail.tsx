"use client";

import { ExternalLink } from "lucide-react";
import { t } from "@/lib/i18n";
import { classificationLabel } from "@/lib/i18n/glossary";
import { formatDate } from "@/lib/i18n/format";
import type { Locale, SourceVM } from "@/lib/view-models/types";
import { FreshnessIndicator } from "./badges";

/**
 * Permanent Official Sources rail (IMAGE B). Dense evidence column — not a card stack.
 */
export function SourceRail({
  locale,
  sources,
  verifiedCount,
  informationCutoff,
  onOpenSource,
}: {
  locale: Locale;
  sources: SourceVM[];
  verifiedCount: number;
  informationCutoff: string | null;
  onOpenSource: (source: SourceVM) => void;
}) {
  return (
    <aside
      aria-label={t(locale, "Official sources", "المصادر الرسمية")}
      className="source-rail hidden border-s border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--obsidian)_72%,#12141a)] xl:flex xl:flex-col"
    >
      <div className="sticky top-[4.25rem] flex max-h-[calc(100vh-4.25rem)] flex-col overflow-hidden">
        <div className="border-b border-[var(--border-subtle)] px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--highlight)]">
            {t(locale, "Official sources", "المصادر الرسمية")}
          </p>
          <p className="mt-1 text-[11px] text-[var(--muted)]">
            {t(locale, "All sources", "كل المصادر")} ({sources.length}) · {t(locale, "Verified", "متحقق")} ({verifiedCount})
          </p>
          {locale === "en" && (
            <p className="mt-0.5 text-[11px] text-[var(--muted)]" lang="ar" dir="rtl">
              المصادر الرسمية
            </p>
          )}
          {locale === "ar" && (
            <p className="mt-0.5 text-[11px] text-[var(--muted)]" lang="en" dir="ltr">
              Official Sources
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-2.5">
          {sources.length === 0 ? (
            <p className="px-2 text-sm text-[var(--muted)]">
              {t(locale, "No sources linked yet.", "لا مصادر مرتبطة بعد.")}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {sources.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onOpenSource(s)}
                    aria-haspopup="dialog"
                    className="group w-full rounded-md border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--card)_90%,transparent)] px-3 py-2.5 text-start outline-none transition hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-[var(--highlight)]">
                          {s.authority ?? t(locale, "Unknown authority", "جهة غير معروفة")}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs font-semibold text-foreground">{s.title}</p>
                      </div>
                      <ExternalLink
                        className="mt-0.5 h-3 w-3 shrink-0 text-[var(--muted)] opacity-0 transition group-hover:opacity-100"
                        aria-hidden
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] text-[var(--muted)]">
                      {classificationLabel(locale, s.classification)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <FreshnessIndicator locale={locale} state={s.freshness} />
                    </div>
                    <dl className="mt-2 grid gap-0.5 text-[10px] text-[var(--muted)]">
                      <div className="flex justify-between gap-2">
                        <dt>{t(locale, "Last verified", "آخر تحقق")}</dt>
                        <dd className="text-foreground/80">{formatDate(locale, s.lastVerified)}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>{t(locale, "Next review", "المراجعة التالية")}</dt>
                        <dd className="text-foreground/80">{formatDate(locale, s.nextReview)}</dd>
                      </div>
                    </dl>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-[var(--border-subtle)] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            {t(locale, "Source verification", "تحقق المصادر")}
          </p>
          {informationCutoff && (
            <p className="mt-1.5 text-[11px] text-[var(--muted)]">
              {t(locale, "Information cutoff", "تاريخ توقف المعلومات")}:{" "}
              <span className="text-foreground/85">{formatDate(locale, informationCutoff)}</span>
            </p>
          )}
          <p className="mt-1 text-[11px] text-[var(--muted)]">
            {t(locale, "Method: official portal links", "الطريقة: روابط البوابات الرسمية")}
          </p>
          <div className="mt-2 flex items-center gap-1.5" aria-label={t(locale, "Data confidence", "ثقة البيانات")}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${
                  i < Math.min(4, Math.max(1, verifiedCount))
                    ? "bg-[var(--accent-bright)]"
                    : "bg-[var(--border)]"
                }`}
              />
            ))}
            <span className="ms-1 text-[10px] text-[var(--muted)]">
              {t(locale, "Confidence", "الثقة")}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
