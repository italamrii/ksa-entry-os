"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardShell } from "@/components/layout/dashboard-nav";
import { LAUNCH_TIMELINES } from "@/lib/constants";
import { toast } from "sonner";

const QUESTIONS_EN = [
  { key: "companyOrigin", type: "select", label: "Is your company Saudi-based or foreign?", options: [{ value: "foreign", label: "Foreign company" }, { value: "local", label: "Saudi / local company" }] },
  { key: "hasForeignEntity", type: "boolean", label: "Do you already have a legal entity outside Saudi Arabia?" },
  { key: "businessActivity", type: "text", label: "What is your primary business activity in KSA?" },
  { key: "hiringEmployees", type: "boolean", label: "Will you hire employees in Saudi Arabia?" },
  { key: "sellingToGov", type: "boolean", label: "Do you plan to sell to government entities?" },
  { key: "needsLocalOffice", type: "boolean", label: "Do you need a local office or presence?" },
  { key: "invoiceCustomers", type: "boolean", label: "Will you invoice Saudi customers?" },
  { key: "sectorLicensing", type: "boolean", label: "Does your activity require sector-specific licensing?" },
  { key: "launchTimeline", type: "select", label: "What is your target market-entry timeline?", options: LAUNCH_TIMELINES.map((t) => ({ value: t.value, label: t.labelEn })) },
];

const QUESTIONS_AR = [
  { key: "companyOrigin", type: "select", label: "هل شركتكم سعودية أم أجنبية؟", options: [{ value: "foreign", label: "شركة أجنبية" }, { value: "local", label: "شركة سعودية / محلية" }] },
  { key: "hasForeignEntity", type: "boolean", label: "هل لديكم كيان قانوني خارج المملكة؟" },
  { key: "businessActivity", type: "text", label: "ما نشاطكم التجاري الرئيسي في السعودية؟" },
  { key: "hiringEmployees", type: "boolean", label: "هل ستُوظّفون موظفين في المملكة؟" },
  { key: "sellingToGov", type: "boolean", label: "هل تخططون للبيع للجهات الحكومية؟" },
  { key: "needsLocalOffice", type: "boolean", label: "هل تحتاجون مكتبًا أو حضورًا محليًا؟" },
  { key: "invoiceCustomers", type: "boolean", label: "هل ستُصدِرون فواتير لعملاء سعوديين؟" },
  { key: "sectorLicensing", type: "boolean", label: "هل يتطلب نشاطكم ترخيصًا قطاعيًا؟" },
  { key: "launchTimeline", type: "select", label: "ما الجدول الزمني المستهدف لدخول السوق؟", options: LAUNCH_TIMELINES.map((t) => ({ value: t.value, label: t.labelAr })) },
];

type FormData = Record<string, string | boolean>;

export default function NewAssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
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
    ? { title: "تحليل ملف دخول الشركة", subtitle: "أجب على أسئلة موجهة لربط المسارات الرسمية المناسبة", back: "رجوع", next: "التالي", generate: "إنشاء خارطة طريق الدخول", generating: "جاري رسم المسارات…", yes: "نعم", no: "لا", placeholder: "صف نشاط شركتك" }
    : { title: "Company entry profiling", subtitle: "Answer guided questions to map official pathways that apply to your expansion plan", back: "Back", next: "Next", generate: "Generate entry roadmap", generating: "Mapping pathways…", yes: "Yes", no: "No", placeholder: "Describe your business activity" };

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
    if (step < QUESTIONS.length - 1) setStep(step + 1);
    else submit();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader isAuthenticated />
      <DashboardShell locale={locale} currentPath="/assessment/new">
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
              <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <CardTitle>{labels.title}</CardTitle>
            <CardDescription>{labels.subtitle}</CardDescription>
            <p className="text-xs text-[var(--muted)]">{step + 1} / {QUESTIONS.length}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg font-semibold text-foreground">{current.label}</p>

            {current.type === "boolean" && (
              <div className="flex gap-3">
                <Button variant={form[current.key] === true ? "default" : "outline"} onClick={() => setValue(current.key, true)}>{labels.yes}</Button>
                <Button variant={form[current.key] === false ? "default" : "outline"} onClick={() => setValue(current.key, false)}>{labels.no}</Button>
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
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--card)] px-4 py-3 text-sm text-foreground"
                value={(form[current.key] as string) ?? ""}
                onChange={(e) => setValue(current.key, e.target.value)}
                placeholder={labels.placeholder}
              />
            )}

            <div className="flex justify-between">
              <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>{labels.back}</Button>
              <Button onClick={next} disabled={loading} className={step === QUESTIONS.length - 1 ? "cta-glow" : ""}>
                {loading ? labels.generating : step === QUESTIONS.length - 1 ? labels.generate : labels.next}
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardShell>
    </div>
  );
}
