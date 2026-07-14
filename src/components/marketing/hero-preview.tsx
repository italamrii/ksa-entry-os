import type { Locale } from "@/lib/i18n";
import { SaudiMap3D } from "@/components/brand/saudi-topo";

/**
 * Landing / workspace-aligned hero composition:
 * dominant 3D Saudi map with regional hubs + floating executive intelligence strip.
 */
export function HeroPreview({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";

  const signals = isAr
    ? [
        { k: "مسارات", v: "مُعدَّة" },
        { k: "جهات", v: "٩" },
        { k: "مصادر", v: "١٤" },
      ]
    : [
        { k: "Pathways", v: "Mapped" },
        { k: "Authorities", v: "9" },
        { k: "Sources", v: "14" },
      ];

  const stages = isAr
    ? ["سياق", "هدف", "مسار", "جهات", "اعتماد", "مصادر"]
    : ["Context", "Objective", "Pathway", "Authorities", "Deps", "Sources"];

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="relative mx-auto w-full max-w-3xl lg:max-w-none"
      aria-hidden
    >
      {/* Map centerpiece */}
      <div className="relative mx-auto aspect-[5/4] w-full max-w-xl sm:max-w-2xl lg:max-w-none lg:aspect-[6/5]">
        <div className="pointer-events-none absolute inset-[8%] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--accent)_22%,transparent),transparent_68%)] blur-2xl" />
        <SaudiMap3D
          className="absolute inset-0"
          variant="hero"
          showLabels
          locale={isAr ? "ar" : "en"}
          focusHub="riyadh"
        />

        {/* Floating intelligence HUD — top */}
        <div className="absolute start-0 top-2 z-10 max-w-[11.5rem] rounded-lg border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--obsidian)_82%,transparent)] px-3 py-2 shadow-[0_12px_36px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:start-2 sm:top-4 sm:max-w-[13rem]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--highlight)]">
            {isAr ? "ذكاء الدخول" : "Entry intelligence"}
          </p>
          <p className="mt-1 text-[11px] font-semibold leading-snug text-foreground">
            {isAr ? "تسلسل رسمي للمملكة" : "Official KSA pathway sequence"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {signals.map((s) => (
              <span
                key={s.k}
                className="rounded border border-[var(--border-subtle)] bg-black/35 px-1.5 py-0.5 text-[8px] text-[var(--muted)]"
              >
                <span className="text-[var(--accent-bright)]">{s.v}</span> {s.k}
              </span>
            ))}
          </div>
        </div>

        {/* Pathway micro-rail — bottom overlay on map */}
        <div className="absolute inset-x-2 bottom-1 z-10 sm:inset-x-6 sm:bottom-3">
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--obsidian)_78%,transparent)] px-2 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:px-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--highlight)]">
                {isAr ? "لوحة المسار" : "Pathway canvas"}
              </p>
              <p className="text-[8px] text-[var(--accent-bright)]">
                {isAr ? "التوصية · وادي الرياض" : "Focus · Riyadh hub"}
              </p>
            </div>
            <ol className="flex items-stretch justify-between gap-1">
              {stages.map((label, i) => {
                const focus = i === 2;
                return (
                  <li
                    key={label}
                    className={`min-w-0 flex-1 rounded-md border px-1 py-1.5 text-center ${
                      focus
                        ? "border-[color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)]"
                        : "border-[var(--border-subtle)] bg-black/30"
                    }`}
                  >
                    <span
                      className={`mx-auto mb-1 flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-bold ${
                        focus ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-muted)] text-[var(--muted)]"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <p className="truncate text-[7px] font-semibold text-foreground sm:text-[8px]">{label}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* Source chip — side */}
        <div className="absolute end-1 top-[38%] z-10 hidden max-w-[7.5rem] rounded-md border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--obsidian)_84%,transparent)] px-2 py-1.5 text-[8px] shadow-lg backdrop-blur-sm sm:block">
          <p className="font-semibold text-[var(--highlight)]">{isAr ? "مصادر" : "Sources"}</p>
          <p className="mt-0.5 text-foreground/90">MISA · ZATCA · SBC</p>
          <p className="mt-0.5 text-[var(--accent-bright)]">{isAr ? "١٤ متحقق" : "14 verified"}</p>
        </div>
      </div>
    </div>
  );
}
