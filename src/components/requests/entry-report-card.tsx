import Link from "next/link";
import { Badge } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ArrowRight, ArrowLeft, Download, Map, FileText } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { getRequests } from "@/lib/i18n/content";

interface EntryReportCardProps {
  locale: Locale;
  request: {
    id: string;
    plan: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    assessmentId: string | null;
    payments: { status: string; invoiceNumber: string }[];
  };
  companyName: string;
  sectorName?: string | null;
  entryGoal?: string | null;
  hasPaidReport: boolean;
}

function mapStatus(status: string, paymentStatus?: string, locale?: Locale): { label: string; variant: "default" | "success" | "warning" | "danger" | "info" } {
  const R = getRequests(locale ?? "en");
  if (paymentStatus === "PENDING") return { label: R.statusLabels.PENDING, variant: "warning" };
  if (status === "COMPLETED") return { label: R.statusLabels.COMPLETED, variant: "success" };
  if (status === "IN_REVIEW") return { label: R.statusLabels.IN_REVIEW, variant: "info" };
  if (status === "CANCELLED") return { label: R.statusLabels.CANCELLED, variant: "default" };
  if (status === "PENDING" && paymentStatus === "PAID") return { label: R.statusLabels.GENERATED, variant: "success" };
  return { label: R.statusLabels.DRAFT, variant: "default" };
}

export function EntryReportCard({
  locale,
  request,
  companyName,
  sectorName,
  entryGoal,
  hasPaidReport,
}: EntryReportCardProps) {
  const R = getRequests(locale);
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const payment = request.payments[0];
  const status = mapStatus(request.status, payment?.status, locale);

  return (
    <div className="surface-elevated hover-lift group rounded-2xl p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">{request.plan} {locale === "ar" ? "تقرير" : "Report"}</h3>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">{R.company}</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">{companyName}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">{R.sector}</p>
              <p className="mt-0.5 text-sm text-foreground/80">{sectorName ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">{R.objective}</p>
              <p className="mt-0.5 text-sm text-foreground/80">{entryGoal ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">{R.lastUpdated}</p>
              <p className="mt-0.5 text-sm text-foreground/80">{formatDate(request.updatedAt, locale)}</p>
            </div>
          </div>
          {payment && (
            <p className="mt-3 text-xs text-[var(--muted)]">
              {R.payment}: <span className="font-medium text-foreground/70">{payment.status}</span>
              <span className="mx-2">·</span>
              {payment.invoiceNumber}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          {request.assessmentId && (
            <Link href={`/assessment/${request.assessmentId}`}>
              <Button variant="outline" size="sm" className="w-full gap-1.5 sm:w-auto">
                <Map className="h-3.5 w-3.5" />
                {R.openRoadmap}
              </Button>
            </Link>
          )}
          {hasPaidReport && request.assessmentId && (
            <a href={`/api/assessments/${request.assessmentId}/pdf`}>
              <Button size="sm" className="w-full gap-1.5 sm:w-auto">
                <Download className="h-3.5 w-3.5" />
                {R.downloadReport}
              </Button>
            </a>
          )}
          {request.status === "IN_REVIEW" && (
            <Link href={`/assessment/${request.assessmentId}`}>
              <Button variant="ghost" size="sm" className="gap-1 text-teal-400">
                {R.continueReview} <Arrow className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function EntryReportsEmpty({ locale }: { locale: Locale }) {
  const R = getRequests(locale);
  return (
    <div className="surface-panel rounded-2xl px-8 py-14 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 ring-1 ring-teal-500/20">
        <FileText className="h-7 w-7 text-teal-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{R.emptyTitle}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--muted)]">{R.emptyBody}</p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/assessment/new">
          <Button className="cta-glow gap-2">{R.emptyCta}</Button>
        </Link>
        <Link href="/payments">
          <Button variant="outline">{R.upgradeCta}</Button>
        </Link>
      </div>
    </div>
  );
}
