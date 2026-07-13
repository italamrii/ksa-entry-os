import { BadgeCheck, Scale, Clock3, CircleAlert, CircleCheck, CircleHelp } from "lucide-react";
import { term, type GlossaryKey } from "@/lib/i18n/glossary";
import { formatScore } from "@/lib/i18n/format";
import type { FreshnessState, Locale, PlanningIndicatorVM, VerificationState } from "@/lib/view-models/types";

/** Meaning is never conveyed by color alone — each badge carries text + icon. */

export function VerificationBadge({ locale, state }: { locale: Locale; state: VerificationState }) {
  if (!state.requiresVerification) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300">
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
      {term(locale, "officialVerificationRequired")}
    </span>
  );
}

export function ProfessionalReviewBadge({ locale, state }: { locale: Locale; state: VerificationState }) {
  if (!state.requiresProfessionalReview) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--plum)_35%,transparent)] bg-[color-mix(in_srgb,var(--plum)_14%,transparent)] px-2 py-0.5 text-xs font-medium text-[color-mix(in_srgb,var(--warm-sand)_80%,var(--plum))]">
      <Scale className="h-3.5 w-3.5" aria-hidden />
      {term(locale, "professionalReviewRecommended")}
    </span>
  );
}

const FRESHNESS: Record<FreshnessState, { key: GlossaryKey; className: string; Icon: React.ComponentType<{ className?: string }> }> = {
  FRESH: { key: "verified", className: "border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] text-[var(--success)]", Icon: CircleCheck },
  REVIEW_DUE: { key: "reviewDue", className: "border-[color-mix(in_srgb,var(--warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] text-[var(--warning)]", Icon: Clock3 },
  STALE: { key: "outdated", className: "border-[color-mix(in_srgb,var(--error)_30%,transparent)] bg-[color-mix(in_srgb,var(--error)_10%,transparent)] text-[var(--error)]", Icon: CircleAlert },
  MISSING: { key: "noSource", className: "border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--muted)]", Icon: CircleHelp },
};

export function FreshnessIndicator({ locale, state }: { locale: Locale; state: FreshnessState }) {
  const f = FRESHNESS[state];
  const Icon = f.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${f.className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {term(locale, f.key)}
    </span>
  );
}

export function PlanningIndicator({ locale, planning }: { locale: Locale; planning: PlanningIndicatorVM }) {
  const pct = Math.max(0, Math.min(100, planning.score));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-[var(--muted)]">{term(locale, "planningIndicator")}</span>
        <span className="text-sm font-semibold text-foreground" dir="ltr">{formatScore(locale, pct)}</span>
      </div>
      <div
        className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={term(locale, "planningIndicator")}
      >
        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-[var(--muted)]">{planning.label}</p>
    </div>
  );
}
