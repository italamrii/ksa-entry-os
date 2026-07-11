import { Badge } from "@/components/ui/input";
import { ExternalLink, AlertTriangle } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { complexityLabels, riskLabels, t, localizedField } from "@/lib/i18n";

interface StepProps {
  step: {
    titleEn: string;
    titleAr: string;
    descriptionEn: string;
    descriptionAr: string;
    officialUrl?: string | null;
    complexity: string;
    riskLevel: string;
    categoryEn?: string | null;
    categoryAr?: string | null;
    disclaimerEn?: string | null;
    disclaimerAr?: string | null;
    appliesWhenEn?: string | null;
    appliesWhenAr?: string | null;
    authority?: { nameEn: string; nameAr: string } | null;
  };
  index: number;
  locale: Locale;
  locked?: boolean;
}

export function RoadmapStepCard({ step, index, locale, locked }: StepProps) {
  const complexity = complexityLabels[locale][step.complexity as keyof typeof complexityLabels.en] ?? step.complexity;
  const risk = riskLabels[locale][step.riskLevel as keyof typeof riskLabels.en] ?? step.riskLevel;
  const riskVariant = step.riskLevel === "HIGH" ? "danger" : step.riskLevel === "MEDIUM" ? "warning" : "success";

  return (
    <div className={`surface-elevated rounded-2xl p-6 ${locked ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-sm font-bold text-teal-400 ring-1 ring-teal-500/20">
            {index + 1}
          </span>
          <div>
            <h3 className="text-base font-semibold text-foreground">{localizedField(locale, step, "title")}</h3>
            {step.authority && (
              <p className="mt-1 text-sm text-[var(--muted)]">
                {t(locale, "Authority", "الجهة")}: {localizedField(locale, step.authority, "name")}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="default">{complexity}</Badge>
          <Badge variant={riskVariant}>{risk}</Badge>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">{localizedField(locale, step, "description")}</p>

      {step.appliesWhenEn && (
        <p className="mt-3 text-xs text-[var(--muted)]">
          <span className="font-semibold text-foreground/70">{t(locale, "When it applies", "متى ينطبق")}:</span>{" "}
          {localizedField(locale, step, "appliesWhen")}
        </p>
      )}

      {step.categoryEn && (
        <p className="mt-1 text-xs text-[var(--muted)]">
          <span className="font-semibold text-foreground/70">{t(locale, "Category", "الفئة")}:</span>{" "}
          {localizedField(locale, step, "category")}
        </p>
      )}

      {step.officialUrl && (
        <a
          href={step.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal-400 hover:text-teal-300"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t(locale, "Official link", "الرابط الرسمي")}
        </a>
      )}

      {(step.disclaimerEn || step.riskLevel === "HIGH") && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-xs leading-relaxed text-amber-200/90">
            {localizedField(locale, step, "disclaimer") ||
              t(locale, "Licensed advisor may be required.", "قد يلزم مستشار مرخص.")}
          </p>
        </div>
      )}
    </div>
  );
}
