import { Link2 } from "lucide-react";
import { Badge } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n";
import { getLanding } from "@/lib/i18n/content";

export function JourneyTimeline({ locale }: { locale: Locale }) {
  const L = getLanding(locale);
  const timeline = landingTimelineDetails(locale);

  return (
    <div className="relative">
      <div className="absolute start-5 top-0 hidden h-full w-px bg-gradient-to-b from-emerald-500/50 via-emerald-500/20 to-transparent sm:block" />
      <div className="space-y-4">
        {timeline.map((item, i) => (
          <div
            key={item.title}
            className="group relative flex gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card)]/80 p-5 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 sm:ps-14"
          >
            <span className="absolute start-3.5 top-6 hidden h-3 w-3 rounded-full border-2 border-emerald-400 bg-[var(--background)] sm:block group-hover:scale-110 group-hover:shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_40%,transparent)] transition-transform" />
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-400 sm:hidden">
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="font-semibold text-foreground">{item.title}</h4>
                <Badge variant={item.risk === "High" ? "danger" : item.risk === "Medium" ? "warning" : "success"}>
                  {item.risk}
                </Badge>
              </div>
              <p className="mt-1.5 text-sm text-[var(--muted)]">{item.why}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                <span>
                  <span className="text-[var(--muted)]">{item.authorityLabel}: </span>
                  <span className="font-medium text-foreground/80">{item.authority}</span>
                </span>
                <span>
                  <span className="text-[var(--muted)]">{item.appliesLabel}: </span>
                  <span className="text-foreground/70">{item.applies}</span>
                </span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                <Link2 className="h-3 w-3" />
                {item.linkStatus}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-sm font-medium text-emerald-400/90">{L.roadmapPreview.subtitle}</p>
    </div>
  );
}

function landingTimelineDetails(locale: Locale) {
  const isAr = locale === "ar";
  const authorityLabel = isAr ? "الجهة" : "Authority";
  const appliesLabel = isAr ? "ينطبق عند" : "Applies when";

  return [
    {
      title: isAr ? "مراجعة نموذج الدخول" : "Entry model review",
      why: isAr ? "تحديد هيكل الدخول المناسب قبل أي إجراء رسمي" : "Identify the right entry structure before any formal action",
      authority: isAr ? "مركز الأعمال السعودي" : "Saudi Business Center",
      applies: isAr ? "جميع الشركات" : "All companies",
      risk: isAr ? "منخفض" : "Low",
      linkStatus: isAr ? "رابط رسمي متاح" : "Official link available",
      authorityLabel,
      appliesLabel,
    },
    {
      title: isAr ? "مسار الاستثمار الأجنبي" : "Investment pathway awareness",
      why: isAr ? "فهم متطلبات الملكية والترخيص للشركات الأجنبية" : "Understand ownership and licensing requirements for foreign entities",
      authority: isAr ? "وزارة الاستثمار" : "Ministry of Investment",
      applies: isAr ? "الشركات الأجنبية" : "Foreign companies",
      risk: isAr ? "متوسط" : "Medium",
      linkStatus: isAr ? "رابط رسمي متاح" : "Official link available",
      authorityLabel,
      appliesLabel,
    },
    {
      title: isAr ? "مسار تأسيس الأعمال" : "Business setup route",
      why: isAr ? "تحديد خطوات الإعداد عبر البوابات الرسمية الموحدة" : "Map setup steps through unified official portals",
      authority: isAr ? "مركز الأعمال السعودي" : "Saudi Business Center",
      applies: isAr ? "تأسيس كيان محلي" : "Local entity establishment",
      risk: isAr ? "متوسط" : "Medium",
      linkStatus: isAr ? "رابط رسمي متاح" : "Official link available",
      authorityLabel,
      appliesLabel,
    },
    {
      title: isAr ? "الوعي بالسجل التجاري" : "Commercial registration awareness",
      why: isAr ? "فهم متطلبات التسجيل قبل بدء النشاط التجاري" : "Understand registration requirements before commercial activity",
      authority: isAr ? "وزارة التجارة" : "Ministry of Commerce",
      applies: isAr ? "الحضور التجاري المحلي" : "Local business presence",
      risk: isAr ? "متوسط" : "Medium",
      linkStatus: isAr ? "رابط رسمي متاح" : "Official link available",
      authorityLabel,
      appliesLabel,
    },
    {
      title: isAr ? "الجاهزية الضريبية / VAT" : "Tax / VAT readiness",
      why: isAr ? "تحديد متى قد يلزم التسجيل لدى هيئة الزكاة والضريبة" : "Determine when ZATCA registration may apply",
      authority: "ZATCA",
      applies: isAr ? "إصدار فواتير للعملاء السعوديين" : "Invoicing Saudi customers",
      risk: isAr ? "مرتفع" : "High",
      linkStatus: isAr ? "رابط رسمي متاح" : "Official link available",
      authorityLabel,
      appliesLabel,
    },
    {
      title: isAr ? "إعداد صاحب العمل" : "Employer setup",
      why: isAr ? "الامتثال لمتطلبات التوظيف والتأمينات" : "Meet employment and social insurance obligations",
      authority: isAr ? "التأمينات · قوى · مدد" : "GOSI · Qiwa · Mudad",
      applies: isAr ? "عند التوظيف في المملكة" : "When hiring in KSA",
      risk: isAr ? "متوسط" : "Medium",
      linkStatus: isAr ? "روابط رسمية متاحة" : "Official links available",
      authorityLabel,
      appliesLabel,
    },
    {
      title: isAr ? "مراجعة الترخيص القطاعي" : "Sector licensing check",
      why: isAr ? "تحديد التراخيص الإضافية حسب نشاط الشركة" : "Identify additional licenses based on business activity",
      authority: isAr ? "جهة قطاعية" : "Sector authority",
      applies: isAr ? "أنشطة منظمة" : "Regulated activities",
      risk: isAr ? "مرتفع" : "High",
      linkStatus: isAr ? "يتطلب تحققًا" : "Verification required",
      authorityLabel,
      appliesLabel,
    },
    {
      title: isAr ? "الجاهزية التشغيلية" : "Operational readiness",
      why: isAr ? "قائمة تحقق نهائية قبل الإطلاق" : "Final checklist before launch",
      authority: isAr ? "متعددة" : "Multiple",
      applies: isAr ? "قبل الإطلاق" : "Pre-launch",
      risk: isAr ? "منخفض" : "Low",
      linkStatus: isAr ? "ملخص داخلي" : "Internal summary",
      authorityLabel,
      appliesLabel,
    },
  ];
}
