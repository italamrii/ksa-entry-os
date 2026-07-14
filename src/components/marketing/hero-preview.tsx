import type { Locale } from "@/lib/i18n";
import { SaudiTopo } from "@/components/brand/saudi-topo";

/**
 * Cropped live-workspace preview for the landing hero — mirrors IMAGE B composition:
 * slim rails + executive strip + horizontal pathway stages over topography + source rail.
 */
export function HeroPreview({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const stages = isAr
    ? [
        { n: 1, t: "سياق الشركة", d: "SaaS أجنبية" },
        { n: 2, t: "هدف الدخول", d: "تأسيس كيان" },
        { n: 3, t: "شركة أجنبية مملوكة بالكامل", d: "التوصية الأساسية", focus: true },
        { n: 4, t: "الجهات", d: "٩ جهات" },
        { n: 5, t: "الاعتمادات", d: "١٢ موافقة" },
        { n: 6, t: "المصادر", d: "١٤ متحقق" },
      ]
    : [
        { n: 1, t: "Company Context", d: "Foreign SaaS" },
        { n: 2, t: "Entry Objective", d: "Establish entity" },
        { n: 3, t: "Wholly Foreign-Owned", d: "Primary recommendation", focus: true },
        { n: 4, t: "Authorities", d: "9 authorities" },
        { n: 5, t: "Dependencies", d: "12 approvals" },
        { n: 6, t: "Official Sources", d: "14 verified" },
      ];

  const sources = isAr
    ? ["وزارة الاستثمار", "مركز الأعمال", "الزكاة والضريبة"]
    : ["MISA", "Saudi Business Center", "ZATCA"];

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="relative mx-auto w-full max-w-2xl animate-fade-in lg:max-w-none"
      aria-hidden
    >
      <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[#0c0d10] shadow-[0_24px_64px_rgba(0,0,0,0.55)]">
        <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_6.5rem] sm:grid-cols-[3.25rem_minmax(0,1fr)_7.5rem]">
          {/* Left rail */}
          <div className="flex flex-col items-center gap-2 border-e border-[var(--border-subtle)] bg-[#0a0b0e] py-3">
            <span className="h-6 w-6 rounded-md bg-[color-mix(in_srgb,var(--accent)_35%,transparent)]" />
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`h-5 w-5 rounded ${i === 0 ? "bg-[color-mix(in_srgb,var(--accent)_45%,transparent)] ring-1 ring-[var(--accent)]" : "bg-[var(--surface-muted)]"}`}
              />
            ))}
          </div>

          {/* Main stage */}
          <div className="relative min-w-0 overflow-hidden">
            <div className="relative border-b border-[var(--border-subtle)] px-3 py-2.5">
              <SaudiTopo className="pointer-events-none absolute inset-y-0 end-0 w-1/2 opacity-40" glow />
              <p className="relative text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--highlight)]">
                {isAr ? "الملخص التنفيذي" : "Executive summary"}
              </p>
              <p className="relative mt-1 line-clamp-2 text-[11px] font-semibold leading-snug text-foreground">
                {isAr
                  ? "جاهزية مرتفعة للتأسيس في السعودية خلال ٦–٩ أشهر نموذجية"
                  : "High planning readiness to establish in KSA with a 6–9 month typical setup"}
              </p>
              <div className="relative mt-2 flex gap-1.5">
                {["78%", isAr ? "متوسط" : "Medium", isAr ? "٦–٩ أشهر" : "6–9 mo"].map((m) => (
                  <span
                    key={m}
                    className="rounded border border-[var(--border-subtle)] bg-black/30 px-1.5 py-0.5 text-[8px] text-[var(--muted)]"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative px-2 py-3">
              <SaudiTopo className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] w-full opacity-55" glow />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0c0d10]/80 via-transparent to-[#0c0d10]/70" />
              <div className="relative flex items-end justify-between gap-1">
                {stages.map((s) => (
                  <div
                    key={s.n}
                    className={`min-w-0 flex-1 rounded-md border px-1 py-1.5 ${
                      s.focus
                        ? "border-[color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] shadow-[0_0_12px_rgba(47,158,110,0.25)]"
                        : "border-[var(--border-subtle)] bg-black/35"
                    }`}
                  >
                    <span
                      className={`mb-1 flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-bold ${
                        s.focus ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-muted)] text-[var(--muted)]"
                      }`}
                    >
                      {s.n}
                    </span>
                    <p className="line-clamp-2 text-[7px] font-semibold leading-tight text-foreground sm:text-[8px]">
                      {s.t}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[6px] text-[var(--muted)] sm:text-[7px]">{s.d}</p>
                    {s.focus && (
                      <span className="mx-auto mt-1 block h-6 w-px bg-gradient-to-b from-[var(--accent-bright)] to-transparent" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-px border-t border-[var(--border-subtle)] bg-[var(--border-subtle)]">
              {(isAr
                ? ["افتراضات", "المخاطر", "إجراءات"]
                : ["Assumptions", "Risks", "Actions"]
              ).map((label) => (
                <div key={label} className="bg-[#12141a] px-2 py-2">
                  <p className="text-[7px] font-semibold text-[var(--muted)]">{label}</p>
                  <div className="mt-1 space-y-1">
                    <div className="h-1 rounded bg-[var(--accent)]/40" />
                    <div className="h-1 w-2/3 rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Source rail */}
          <div className="border-s border-[var(--border-subtle)] bg-[#0a0b0e] px-1.5 py-2">
            <p className="px-1 text-[7px] font-semibold uppercase tracking-wider text-[var(--highlight)]">
              {isAr ? "مصادر" : "Sources"}
            </p>
            <p className="mt-0.5 px-1 text-[6px] text-[var(--muted)]">14/14</p>
            <ul className="mt-2 space-y-1">
              {sources.map((name) => (
                <li
                  key={name}
                  className="rounded border border-[var(--border-subtle)] bg-[#14161c] px-1.5 py-1"
                >
                  <p className="truncate text-[7px] font-medium text-foreground">{name}</p>
                  <p className="text-[6px] text-[var(--accent-bright)]">{isAr ? "متحقق" : "Verified"}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
