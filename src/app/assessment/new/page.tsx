"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardShell } from "@/components/layout/dashboard-nav";
import { LAUNCH_TIMELINES } from "@/lib/constants";
import { toast } from "sonner";

const QUESTIONS_EN = [
  { key: "companyOrigin", type: "select", label: "Is your company Saudi-based or foreign?", options: [{ value: "foreign", label: "Foreign company" }, { value: "local", label: "Saudi / local company" }], hint: "Provided fact — used to select investment pathways." },
  { key: "hasForeignEntity", type: "boolean", label: "Do you already have a legal entity outside Saudi Arabia?", hint: "Helps distinguish branch vs. new entity routes." },
  { key: "businessActivity", type: "text", label: "What is your primary business activity in KSA?", hint: "Free-text context for sector-aware guidance." },
  { key: "hiringEmployees", type: "boolean", label: "Will you hire employees in Saudi Arabia?", hint: "May surface labor and social-insurance pathways." },
  { key: "sellingToGov", type: "boolean", label: "Do you plan to sell to government entities?", hint: "May affect procurement readiness notes." },
  { key: "needsLocalOffice", type: "boolean", label: "Do you need a local office or presence?", hint: "Informs municipal and presence-related steps." },
  { key: "invoiceCustomers", type: "boolean", label: "Will you invoice Saudi customers?", hint: "May relate to tax readiness pathways." },
  { key: "sectorLicensing", type: "boolean", label: "Does your activity require sector-specific licensing?", hint: "Flags sector licensing pathways when applicable." },
  { key: "launchTimeline", type: "select", label: "What is your target market-entry timeline?", options: LAUNCH_TIMELINES.map((t) => ({ value: t.value, label: t.labelEn })), hint: "Planning context only — not an approval forecast." },
];

const QUESTIONS_AR = [
  { key: "companyOrigin", type: "select", label: "هل شركتكم سعودية أم أجنبية؟", options: [{ value: "foreign", label: "شركة أجنبية" }, { value: "local", label: "شركة سعودية / محلية" }], hint: "حقيقة مُقدَّمة — تُستخدم لاختيار مسارات الاستثمار." },
  { key: "hasForeignEntity", type: "boolean", label: "هل لديكم كيان قانوني خارج المملكة؟", hint: "يساعد على التمييز بين الفرع والكيان الجديد." },
  { key: "businessActivity", type: "text", label: "ما نشاطكم التجاري الرئيسي في السعودية؟", hint: "سياق نصي للتوجيه القطاعي." },
  { key: "hiringEmployees", type: "boolean", label: "هل ستُوظّفون موظفين في المملكة؟", hint: "قد يُظهر مسارات العمل والتأمينات." },
  { key: "sellingToGov", type: "boolean", label: "هل تخططون للبيع للجهات الحكومية؟", hint: "قد يؤثر على ملاحظات جاهزية المشتريات." },
  { key: "needsLocalOffice", type: "boolean", label: "هل تحتاجون مكتبًا أو حضورًا محليًا؟", hint: "يُفيد خطوات البلدية والحضور المحلي." },
  { key: "invoiceCustomers", type: "boolean", label: "هل ستُصدِرون فواتير لعملاء سعوديين؟", hint: "قد يرتبط بمسارات الجاهزية الضريبية." },
  { key: "sectorLicensing", type: "boolean", label: "هل يتطلب نشاطكم ترخيصًا قطاعيًا؟", hint: "يُظهر مسارات الترخيص القطاعي عند الانطباق." },
  { key: "launchTimeline", type: "select", label: "ما الجدول الزمني المستهدف لدخول السوق؟", options: LAUNCH_TIMELINES.map((t) => ({ value: t.value, label: t.labelAr })), hint: "سياق تخطيط فقط — ليس توقع موافقة." },
];

type FormData = Record<string, string | boolean>;

export default function NewAssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [locale] = useState<"en" | "ar">(() =>
    typeof document !== "undefined" && document.documentElement.dir === "rtl" ? "ar" : "en"
  );
  const [form, setForm] = useState<FormData>({
    companyOrigin: "foreign",
    hasForeignEntity: false,
    hiringEmployees: false,
    sellingToGov: false,
    needsLocalOffice: false,
    invoiceCustomers: false,
    sectorLicensing: false,
  });

  const QUESTIONS = locale === "ar" ? QUESTIONS_AR : QUESTIONS_EN;
  const current = QUESTIONS[step];
  const progress = ((step + 1) / QUESTIONS.length) * 100;

  const labels = locale === "ar"
    ? { title: "تحليل ملف دخول الشركة", subtitle: "أسئلة موجَّهة لربط المسارات الرسمية المناسبة", back: "رجوع", next: "التالي", generate: "إنشاء خارطة طريق الدخول", generating: "جاري رسم المسارات…", yes: "نعم", no: "لا", placeholder: "صف نشاط شركتك", review: "مراجعة الإجابات", provided: "مُقدَّم", edit: "تعديل" }
    : { title: "Company entry profiling", subtitle: "Guided questions to map official pathways for your expansion plan", back: "Back", next: "Next", generate: "Generate entry roadmap", generating: "Mapping pathways…", yes: "Yes", no: "No", placeholder: "Describe your business activity", review: "Review answers", provided: "Provided", edit: "Edit" };

  function setValue(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to create assessment");
        return;
      }
      toast.success(locale === "ar" ? "تم إنشاء خارطة الطريق" : "Entry roadmap generated");
      router.push(`/assessment/${json.assessmentId}`);
    } catch {
      toast.error("Something went wrong");
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
      return q.options.find((o) => o.value === v)?.label ?? String(v ?? "—");
    }
    return String(v ?? "—") || "—";
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader isAuthenticated />
      <DashboardShell locale={locale} currentPath="/assessment/new">
        <div className="surface-panel mx-auto w-full max-w-xl overflow-hidden rounded-[var(--radius-lg)]">
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
              <p className="mt-2 text-caption">
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
                          <p className="text-sm font-medium text-foreground">{q.label}</p>
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
                  <p className="text-lg font-semibold text-foreground">{current.label}</p>
                  {"hint" in current && current.hint && (
                    <p className="mt-2 text-sm text-[var(--muted)]">{current.hint}</p>
                  )}
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
                        {opt.label}
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
      </DashboardShell>
    </div>
  );
}
