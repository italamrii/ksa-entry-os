"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardShell } from "@/components/layout/dashboard-nav";
import { localeHref } from "@/lib/i18n/locale-utils";
import { useLocale } from "@/lib/i18n/use-locale";
import {
  ASSESSMENT_QUESTIONS,
  ASSESSMENT_UI,
  optionLabel,
  questionHint,
  questionTitle,
} from "@/lib/i18n/assessment";
import { toast } from "sonner";

type FormData = Record<string, string | boolean>;

function NewAssessmentWizard() {
  const router = useRouter();
  // Canonical locale: ?lang from the URL (preserved by localeHref everywhere).
  const locale = useLocale();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [form, setForm] = useState<FormData>({
    companyOrigin: "foreign",
    hasForeignEntity: false,
    hiringEmployees: false,
    sellingToGov: false,
    needsLocalOffice: false,
    invoiceCustomers: false,
    sectorLicensing: false,
  });

  const dir = locale === "ar" ? "rtl" : "ltr";
  const QUESTIONS = ASSESSMENT_QUESTIONS;
  const current = QUESTIONS[step];
  const progress = ((step + 1) / QUESTIONS.length) * 100;
  const labels = ASSESSMENT_UI[locale];

  function setValue(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    setLoading(true);
    try {
      // Payload values are the stable internal keys — never localized.
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? labels.submitFailed);
        return;
      }
      toast.success(labels.success);
      router.push(localeHref(`/assessment/${json.assessmentId}`, locale));
    } catch {
      toast.error(labels.genericError);
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
      return;
    }
    setShowSummary(true);
  }

  function formatAnswer(q: (typeof QUESTIONS)[number]) {
    const v = form[q.key];
    if (q.type === "boolean") return v === true ? labels.yes : labels.no;
    if (q.type === "select" && q.options) {
      const opt = q.options.find((o) => o.value === v);
      return opt ? optionLabel(opt, locale) : String(v ?? "—");
    }
    return String(v ?? "—") || "—";
  }

  return (
    <div className="flex min-h-screen flex-col" dir={dir}>
      <SiteHeader locale={locale} isAuthenticated />
      <DashboardShell locale={locale} currentPath="/assessment/new">
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="surface-panel overflow-hidden rounded-[var(--radius-lg)]">
          <div className="border-b border-[var(--border-subtle)] px-6 py-5">
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--highlight)] transition-[width] duration-500 ease-out motion-reduce:transition-none"
                style={{ width: `${showSummary ? 100 : progress}%` }}
              />
            </div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
              {showSummary ? labels.review : labels.title}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">{labels.subtitle}</p>
            {!showSummary && (
              <p className="mt-2 text-caption" dir="ltr" style={{ textAlign: locale === "ar" ? "right" : "left" }}>
                {step + 1} / {QUESTIONS.length}
              </p>
            )}
          </div>

          <div className="space-y-6 px-6 py-6">
            {showSummary ? (
              <>
                <ol className="space-y-3">
                  {QUESTIONS.map((q, i) => (
                    <li key={q.key} className="surface-strip rounded-[var(--radius-md)]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-caption">{labels.provided}</p>
                          <p className="text-sm font-medium text-foreground">{questionTitle(q, locale)}</p>
                          <p className="mt-1 text-sm text-[var(--muted)]">{formatAnswer(q)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowSummary(false);
                            setStep(i);
                          }}
                        >
                          {labels.edit}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="flex justify-between gap-3">
                  <Button variant="ghost" onClick={() => setShowSummary(false)}>
                    {labels.back}
                  </Button>
                  <Button onClick={submit} disabled={loading} className="cta-glow">
                    {loading ? labels.generating : labels.generate}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-lg font-semibold text-foreground">{questionTitle(current, locale)}</p>
                  <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-muted)]/60 px-4 py-3">
                    <p className="text-caption text-[var(--highlight)]">{labels.why}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{questionHint(current, locale)}</p>
                  </div>
                </div>

                {current.type === "boolean" && (
                  <div className="flex gap-3">
                    <Button variant={form[current.key] === true ? "default" : "outline"} onClick={() => setValue(current.key, true)}>
                      {labels.yes}
                    </Button>
                    <Button variant={form[current.key] === false ? "default" : "outline"} onClick={() => setValue(current.key, false)}>
                      {labels.no}
                    </Button>
                  </div>
                )}

                {current.type === "select" && current.options && (
                  <div className="space-y-2">
                    {current.options.map((opt) => (
                      <Button
                        key={opt.value}
                        variant={form[current.key] === opt.value ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setValue(current.key, opt.value)}
                      >
                        {optionLabel(opt, locale)}
                      </Button>
                    ))}
                  </div>
                )}

                {current.type === "text" && (
                  <input
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--card)] px-4 py-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_35%,transparent)]"
                    value={(form[current.key] as string) ?? ""}
                    onChange={(e) => setValue(current.key, e.target.value)}
                    placeholder={labels.placeholder}
                  />
                )}

                <div className="flex justify-between">
                  <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
                    {labels.back}
                  </Button>
                  <Button onClick={next} disabled={loading}>
                    {step === QUESTIONS.length - 1 ? labels.review : labels.next}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        <aside className="hidden lg:block" aria-label={labels.journey}>
          <p className="text-overline mb-3">{labels.journey}</p>
          <ol className="space-y-1">
            {QUESTIONS.map((q, i) => {
              const done = showSummary || i < step;
              const active = !showSummary && i === step;
              return (
                <li
                  key={q.key}
                  className={`rounded-[var(--radius-sm)] px-3 py-2 text-xs transition ${
                    active
                      ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent-bright)]"
                      : done
                        ? "text-foreground/80"
                        : "text-[var(--muted)]"
                  }`}
                >
                  <span className="text-metric me-2 opacity-70">{i + 1}</span>
                  {questionTitle(q, locale)}
                </li>
              );
            })}
          </ol>
        </aside>
        </div>
      </DashboardShell>
    </div>
  );
}

export default function NewAssessmentPage() {
  // useSearchParams (inside useLocale) requires a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <NewAssessmentWizard />
    </Suspense>
  );
}
