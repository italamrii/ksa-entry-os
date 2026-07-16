import Link from "next/link";
import { localeHref } from "@/lib/i18n/locale-utils";
import { AlertTriangle, Inbox, Loader2, ShieldAlert, Clock, ServerCrash, FileQuestion } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/view-models/types";

interface StateProps {
  locale: Locale;
}

/**
 * Every workspace state answers three questions: what happened, why it matters,
 * and what to do next. Rendered as semantic regions with accessible status text.
 */
function NoticeState({
  icon: Icon,
  tone = "neutral",
  title,
  what,
  why,
  next,
  action,
  role = "region",
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "warning" | "danger" | "info";
  title: string;
  what: string;
  why?: string;
  next?: string;
  action?: React.ReactNode;
  role?: "region" | "status" | "alert";
}) {
  const toneRing = {
    neutral: "border-[var(--border-subtle)]",
    warning: "border-amber-500/30",
    danger: "border-red-500/30",
    info: "border-emerald-500/30",
  }[tone];
  return (
    <section
      role={role}
      aria-live={role === "status" || role === "alert" ? "polite" : undefined}
      className={`surface-panel rounded-2xl border ${toneRing} p-6 lg:p-8`}
    >
      <div className="flex items-start gap-4">
        <Icon className="mt-0.5 h-6 w-6 shrink-0 text-[var(--muted)]" aria-hidden />
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-1.5 text-sm text-[var(--muted)]">{what}</p>
          {why && <p className="mt-1 text-sm text-[var(--muted)]">{why}</p>}
          {next && <p className="mt-2 text-sm font-medium text-foreground">{next}</p>}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </section>
  );
}

export function LoadingState({ locale }: StateProps) {
  return (
    <div role="status" aria-live="polite" className="surface-panel flex items-center gap-3 rounded-2xl p-6 text-sm text-[var(--muted)]">
      <Loader2 className="h-5 w-5 motion-safe:animate-spin" aria-hidden />
      <span>{t(locale, "Loading your decision workspace…", "جارٍ تحميل مساحة القرار…")}</span>
    </div>
  );
}

export function EmptyState({ locale }: StateProps) {
  return (
    <NoticeState
      icon={Inbox}
      title={t(locale, "Nothing here yet", "لا يوجد شيء بعد")}
      what={t(locale, "There is no data to display in this area.", "لا توجد بيانات لعرضها هنا.")}
      next={t(locale, "Complete an assessment to populate your workspace.", "أكمل تقييمًا لتعبئة مساحة العمل.")}
    />
  );
}

export function NoAssessmentState({ locale }: StateProps) {
  return (
    <NoticeState
      icon={FileQuestion}
      tone="info"
      title={t(locale, "Start your first assessment", "ابدأ تقييمك الأول")}
      what={t(locale, "Your workspace becomes active once you complete a guided assessment.", "تصبح مساحة العمل نشطة بعد إكمال تقييم موجَّه.")}
      why={t(locale, "We use your non-sensitive context to organize possible pathways from official sources.", "نستخدم سياقك غير الحساس لتنظيم المسارات المحتملة من المصادر الرسمية.")}
      next={t(locale, "It takes a few minutes and you can save and resume.", "يستغرق دقائق ويمكنك الحفظ والمتابعة.")}
      action={
        <Link href={localeHref("/assessment/new", locale)} className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">
          {t(locale, "Begin assessment", "ابدأ التقييم")}
        </Link>
      }
    />
  );
}

export function EvaluationUnavailableState({ locale, assessmentId }: StateProps & { assessmentId?: string }) {
  return (
    <NoticeState
      icon={AlertTriangle}
      tone="warning"
      title={t(locale, "Evaluation not generated yet", "لم يتم إنشاء التقييم بعد")}
      what={t(locale, "This assessment has not been evaluated against the current ruleset.", "لم يُقيَّم هذا التقييم وفق مجموعة القواعد الحالية.")}
      next={t(locale, "Run an evaluation to see recommended pathways and reasoning.", "شغّل التقييم لعرض المسارات والأسباب.")}
      action={
        assessmentId ? (
          <a href={`/api/assessments/${assessmentId}/evaluate`} className="text-sm font-medium text-emerald-400">
            {t(locale, "How evaluation works", "كيف يعمل التقييم")}
          </a>
        ) : undefined
      }
    />
  );
}

export function PartialDataState({ locale, missing }: StateProps & { missing?: string }) {
  return (
    <NoticeState
      icon={AlertTriangle}
      tone="warning"
      role="status"
      title={t(locale, "Showing partial results", "عرض نتائج جزئية")}
      what={missing ?? t(locale, "Some information is incomplete, so results may be limited.", "بعض المعلومات غير مكتملة، لذا قد تكون النتائج محدودة.")}
      next={t(locale, "Complete your company profile and assessment to refine the workspace.", "أكمل ملف الشركة والتقييم لتحسين النتائج.")}
    />
  );
}

export function UnauthorizedState({ locale }: StateProps) {
  return (
    <NoticeState
      icon={ShieldAlert}
      tone="danger"
      role="alert"
      title={t(locale, "You don't have access", "لا تملك صلاحية الوصول")}
      what={t(locale, "This workspace belongs to a different organization.", "تخص مساحة العمل هذه مؤسسة أخرى.")}
      next={t(locale, "Return to your own workspace.", "عد إلى مساحة عملك.")}
      action={
        <Link href={localeHref("/workspace", locale)} className="text-sm font-medium text-emerald-400">
          {t(locale, "Go to my workspace", "الذهاب إلى مساحتي")}
        </Link>
      }
    />
  );
}

export function RateLimitedState({ locale }: StateProps) {
  return (
    <NoticeState
      icon={Clock}
      tone="warning"
      role="status"
      title={t(locale, "Too many requests", "طلبات كثيرة")}
      what={t(locale, "You've reached a temporary limit.", "لقد وصلت إلى حد مؤقت.")}
      next={t(locale, "Please wait a moment and try again.", "انتظر لحظة ثم حاول مجددًا.")}
    />
  );
}

export function ErrorState({ locale }: StateProps) {
  return (
    <NoticeState
      icon={ServerCrash}
      tone="danger"
      role="alert"
      title={t(locale, "Something went wrong", "حدث خطأ ما")}
      what={t(locale, "We couldn't load this part of the workspace.", "تعذّر تحميل هذا الجزء.")}
      next={t(locale, "Refresh the page or try again shortly.", "حدّث الصفحة أو حاول لاحقًا.")}
    />
  );
}

/**
 * Insufficient governed knowledge — shown INSTEAD of a silent "0 steps" result.
 * Explains what is missing and never presents an empty roadmap as complete.
 * Safety copy is always shown regardless of plan.
 */
export function InsufficientKnowledgeState({
  locale,
  message,
  missingInputs,
}: StateProps & { message: string; missingInputs: { key: string; labelEn: string; labelAr: string }[] }) {
  return (
    <div className="surface-panel rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--warning)_6%,transparent)] p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--warning)]" aria-hidden />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">
            {t(locale, "Roadmap not issued — more information needed", "لم تصدر خارطة الطريق — المعلومات غير كافية")}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{message}</p>
          {missingInputs.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {missingInputs.map((m) => (
                <li
                  key={m.key}
                  className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-muted)]/60 px-2.5 py-1 text-xs text-foreground"
                >
                  {locale === "ar" ? m.labelAr : m.labelEn}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-[var(--muted)]">
            {t(
              locale,
              "This is not a completed roadmap. Verify all requirements with the official authority before acting.",
              "هذه ليست خارطة طريق مكتملة. تحقق من جميع المتطلبات مع الجهة الرسمية قبل اتخاذ أي إجراء."
            )}
          </p>
          <Link
            href={localeHref("/assessment/new", locale)}
            className="mt-4 inline-flex text-sm font-medium text-[var(--accent-bright)] outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
          >
            {t(locale, "Update your answers", "حدّث إجاباتك")}
          </Link>
        </div>
      </div>
    </div>
  );
}
