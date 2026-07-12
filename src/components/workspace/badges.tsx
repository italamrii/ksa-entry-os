import { BadgeCheck, Scale, Clock3, CircleAlert, CircleCheck, CircleHelp } from "lucide-react";
import { t } from "@/lib/i18n";
import type { FreshnessState, Locale, PlanningIndicatorVM, VerificationState } from "@/lib/view-models/types";

/** Meaning is never conveyed by color alone — each badge carries text + icon. */

export function VerificationBadge({ locale, state }: { locale: Locale; state: VerificationState }) {
  if (!state.requiresVerification) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300">
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
      {t(locale, "Official verification required", "يلزم تحقق رسمي")}
    </span>
  );
}

export function ProfessionalReviewBadge({ locale, state }: { locale: Locale; state: VerificationState }) {
  if (!state.requiresProfessionalReview) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--plum)_35%,transparent)] bg-[color-mix(in_srgb,var(--plum)_14%,transparent)] px-2 py-0.5 text-xs font-medium text-[color-mix(in_srgb,var(--warm-sand)_80%,var(--plum))]">
      <Scale className="h-3.5 w-3.5" aria-hidden />
      {t(locale, "Professional review recommended", "يوصى بمراجعة مهنية")}
    </span>
  );
}

const FRESHNESS: Record<FreshnessState, { en: string; ar: string; className: string; Icon: React.ComponentType<{ className?: string }> }> = {
  FRESH: { en: "Verified", ar: "محقق", className: "border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] text-[var(--success)]", Icon: CircleCheck },
  REVIEW_DUE: { en: "Review due", ar: "المراجعة مستحقة", className: "border-[color-mix(in_srgb,var(--warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] text-[var(--warning)]", Icon: Clock3 },
  STALE: { en: "Outdated — re-verify", ar: "قديم — أعد التحقق", className: "border-[color-mix(in_srgb,var(--error)_30%,transparent)] bg-[color-mix(in_srgb,var(--error)_10%,transparent)] text-[var(--error)]", Icon: CircleAlert },
  MISSING: { en: "No source", ar: "لا مصدر", className: "border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--muted)]", Icon: CircleHelp },
};

export function FreshnessIndicator({ locale, state }: { locale: Locale; state: FreshnessState }) {
  const f = FRESHNESS[state];
  const Icon = f.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${f.className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {t(locale, f.en, f.ar)}
    </span>
  );
}

export function PlanningIndicator({ locale, planning }: { locale: Locale; planning: PlanningIndicatorVM }) {
  const pct = Math.max(0, Math.min(100, planning.score));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-[var(--muted)]">{t(locale, "Planning indicator", "مؤشر التخطيط")}</span>
        <span className="text-sm font-semibold text-foreground">{pct}<span className="text-xs text-[var(--muted)]">/100</span></span>
      </div>
      <div
        className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t(locale, "Planning indicator", "مؤشر التخطيط")}
      >
        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-[var(--muted)]">{planning.label}</p>
    </div>
  );
}
