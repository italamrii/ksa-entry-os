/**
 * Premium 3D Saudi Arabia market-intelligence plate.
 * Stylized silhouette with terrain depth, network lattice, and regional hubs.
 * Not an official seal — abstract geography for product identity.
 */

export type HubId =
  | "riyadh"
  | "jeddah"
  | "dammam"
  | "neom"
  | "madinah"
  | "abha"
  | "tabuk"
  | "jizan";

export type LocaleLabel = "en" | "ar";

/**
 * Hub positions are the REAL city coordinates projected with the same
 * equirectangular transform as the outline (see KSA_FACE note below), so every
 * node sits at its true geographic location.
 */
const HUBS: {
  id: HubId;
  x: number;
  y: number;
  r: number;
  accent: "emerald" | "gold";
  labelEn: string;
  labelAr: string;
}[] = [
  { id: "riyadh", x: 391.3, y: 262.3, r: 7, accent: "gold", labelEn: "Riyadh", labelAr: "الرياض" },
  { id: "jeddah", x: 201.3, y: 350.5, r: 5.5, accent: "emerald", labelEn: "Jeddah", labelAr: "جدة" },
  { id: "dammam", x: 478.1, y: 214.5, r: 5.2, accent: "emerald", labelEn: "Dammam", labelAr: "الدمام" },
  { id: "neom", x: 101.1, y: 168, r: 4.8, accent: "gold", labelEn: "NEOM", labelAr: "نيوم" },
  { id: "madinah", x: 212, y: 269, r: 4.4, accent: "emerald", labelEn: "Madinah", labelAr: "المدينة" },
  { id: "abha", x: 285.5, y: 442.9, r: 4.2, accent: "emerald", labelEn: "Abha", labelAr: "أبها" },
  { id: "tabuk", x: 134.8, y: 160.2, r: 4, accent: "emerald", labelEn: "Tabuk", labelAr: "تبوك" },
  { id: "jizan", x: 286.6, y: 479.9, r: 3.8, accent: "emerald", labelEn: "Jazan", labelAr: "جازان" },
];

const LINKS: [HubId, HubId][] = [
  ["riyadh", "jeddah"],
  ["riyadh", "dammam"],
  ["riyadh", "madinah"],
  ["riyadh", "abha"],
  ["jeddah", "madinah"],
  ["jeddah", "neom"],
  ["madinah", "tabuk"],
  ["neom", "tabuk"],
  ["jeddah", "abha"],
  ["abha", "jizan"],
];

function hub(id: HubId) {
  return HUBS.find((h) => h.id === id)!;
}

type Variant = "hero" | "canvas" | "compact";

/**
 * TRUE Saudi Arabia silhouette — real border geometry (76-point national
 * boundary ring from the public world.geo.json dataset, Natural Earth derived),
 * projected equirectangular with cos(mid-latitude) x-correction into this
 * 700x560 viewBox. Recognizable features preserved: the Jordan/Iraq zigzag
 * border (NW), the Gulf coast with the Qatar notch (E), the far-eastern
 * UAE/Oman corner, the Empty Quarter southern taper, the Yemen border, and the
 * long Red Sea diagonal (W). Stylized rendering only — not an official emblem.
 */
const KSA_FACE =
  "M292.4 495 L289.1 483.1 L281.4 474.7 L279.5 463.6 L266.4 453.7 L252.8 430.3 L245.7 407.7 L228.1 388.5 L216.8 384 L200 357.4 L197.1 338.1 L198.2 321.6 L183.6 290.7 L171.7 279.9 L158 274.1 L149.7 258.2 L151.1 251.9 L144 237.5 L136.6 231.3 L126.7 210.6 L111.3 188.1 L98.3 169 L85.7 169.2 L89.6 153.9 L90.8 144.1 L93.9 133 L122.1 137.5 L133.1 128.9 L139.2 118.9 L158.5 115 L162.7 105.7 L171.1 101 L145.8 73.2 L196.6 59.2 L201.5 55 L232 62.5 L269.8 82 L341.3 138 L388.5 140.2 L411.1 142.9 L417.4 156.1 L435.4 155.4 L445.3 179.4 L457.8 185.8 L462.1 195.5 L479.4 207.2 L481 218.7 L478.4 228 L481.6 237.3 L488.9 245.1 L492.3 254.3 L496.1 261.1 L503.8 266.6 L510.8 264.6 L515.6 275.2 L516.6 281.7 L526.3 309.9 L602.6 323.9 L607.7 318 L619.3 337.7 L602.4 393.4 L526.3 421.2 L453.1 431.9 L429.5 444.4 L411.3 473.6 L399.4 478.2 L393.1 469 L383.4 470.4 L358.9 467.6 L354.2 464.8 L324.9 465.4 L318 468 L307.6 460.7 L300.9 474.4 L303.5 486.1 L292.4 495 Z";

const EXTRUDE_Y = 34;

function offsetPath(d: string, dy: number): string {
  return d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_m, x: string, y: string) => {
    return `${x} ${Number(y) + dy}`;
  });
}

export function SaudiMap3D({
  className,
  variant = "hero",
  showLabels = false,
  locale = "en",
  focusHub = "riyadh",
}: {
  className?: string;
  variant?: Variant;
  showLabels?: boolean;
  locale?: LocaleLabel;
  focusHub?: HubId;
}) {
  const uid = `ksa3d-${variant}`;
  const dense = variant !== "compact";

  return (
    <div className={className} aria-hidden>
      <div
        className="saudi-map-stage relative h-full w-full will-change-transform motion-reduce:!transform-none"
        style={
          variant === "hero"
            ? {
                transform: "perspective(1600px) rotateX(32deg) rotateZ(-6deg) scale(1.12)",
                transformOrigin: "50% 72%",
              }
            : variant === "canvas"
              ? {
                  transform: "perspective(1200px) rotateX(18deg) scale(1.15)",
                  transformOrigin: "50% 55%",
                }
              : { transform: "perspective(900px) rotateX(14deg) scale(1.02)" }
        }
      >
        <div className="pointer-events-none absolute inset-x-[10%] bottom-[2%] h-[16%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(47,158,110,0.32),transparent_72%)] blur-lg" />

        <svg
          viewBox="0 0 700 560"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative h-full w-full"
          focusable="false"
        >
          <defs>
            <linearGradient id={`${uid}-face`} x1="0.2" y1="0.05" x2="0.85" y2="0.95">
              <stop offset="0%" stopColor={variant === "canvas" ? "#2a3540" : "#232a36"} />
              <stop offset="35%" stopColor={variant === "canvas" ? "#1a4034" : "#17302a"} />
              <stop offset="100%" stopColor={variant === "canvas" ? "#0d4f3b" : "#0a3a2c"} />
            </linearGradient>
            <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c4a574" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#3db882" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#c4a574" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id={`${uid}-wall`} x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#0f4f3c" />
              <stop offset="100%" stopColor="#06140f" />
            </linearGradient>
            <radialGradient id={`${uid}-aura`} cx="55%" cy="48%" r="50%">
              <stop offset="0%" stopColor="#3db882" stopOpacity="0.4" />
              <stop offset="55%" stopColor="#1a7a5c" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#0c0d10" stopOpacity="0" />
            </radialGradient>
            <filter id={`${uid}-glow`} x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <clipPath id={`${uid}-clip`}>
              <path d={KSA_FACE} />
            </clipPath>
            <pattern id={`${uid}-grid`} width="26" height="26" patternUnits="userSpaceOnUse">
              <path d="M26 0H0V26" fill="none" stroke="#3db882" strokeOpacity="0.16" strokeWidth="0.75" />
            </pattern>
          </defs>

          <ellipse cx="355" cy="290" rx="275" ry="170" fill={`url(#${uid}-aura)`} />

          {/* Extruded volume: stacked vertical offsets of the true outline form
              solid side walls for any silhouette (no hand-drawn bridge path). */}
          {Array.from({ length: 9 }, (_, i) => (
            <path
              key={i}
              d={offsetPath(KSA_FACE, (EXTRUDE_Y * (9 - i)) / 9)}
              fill={`url(#${uid}-wall)`}
              opacity={0.95}
            />
          ))}

          <path
            d={KSA_FACE}
            fill={`url(#${uid}-face)`}
            stroke={`url(#${uid}-rim)`}
            strokeWidth="2.4"
            filter={`url(#${uid}-glow)`}
          />

          <g clipPath={`url(#${uid}-clip)`}>
            <rect x="80" y="50" width="545" height="450" fill={`url(#${uid}-grid)`} />
            {dense && (
              <>
                <path d="M170 160c80-20 170-26 260-8 75 15 145 52 190 100" stroke="#2f9e6e" strokeOpacity="0.32" strokeWidth="1.15" />
                <path d="M185 230c85-14 180-16 265 10 70 22 130 60 162 105" stroke="#c4a574" strokeOpacity="0.26" strokeWidth="1.05" />
                <path d="M200 300c80-8 170 0 250 28 58 22 110 62 132 108" stroke="#3db882" strokeOpacity="0.22" strokeWidth="1" />
                <path d="M210 120c95-6 200 18 285 62" stroke="#d8cbb4" strokeOpacity="0.14" strokeWidth="0.9" />
              </>
            )}
            <path d={KSA_FACE} fill="rgba(243,239,230,0.06)" />
          </g>

          {LINKS.map(([a, b]) => {
            const A = hub(a);
            const B = hub(b);
            return (
              <line
                key={`${a}-${b}`}
                x1={A.x}
                y1={A.y}
                x2={B.x}
                y2={B.y}
                stroke="#c4a574"
                strokeOpacity="0.5"
                strokeWidth="1.2"
              />
            );
          })}

          {HUBS.map((h) => {
            const focused = h.id === focusHub;
            const fill = h.accent === "gold" ? "#c4a574" : "#3db882";
            return (
              <g key={h.id}>
                {focused && <circle cx={h.x} cy={h.y} r={h.r + 12} fill={fill} fillOpacity="0.2" />}
                <circle cx={h.x} cy={h.y} r={h.r + 4} fill={fill} fillOpacity="0.25" />
                <circle cx={h.x} cy={h.y} r={h.r} fill={fill} fillOpacity={focused ? 1 : 0.9} />
                <circle cx={h.x} cy={h.y} r={1.7} fill="#f3efe6" />
                {showLabels && (
                  <text
                    x={h.x + (h.id === "dammam" ? -42 : 11)}
                    y={h.y - 10}
                    fill="#d8cbb4"
                    fontSize="12"
                    fontFamily="ui-sans-serif, system-ui, sans-serif"
                    fontWeight="600"
                    opacity="0.92"
                  >
                    {locale === "ar" ? h.labelAr : h.labelEn}
                  </text>
                )}
              </g>
            );
          })}

          {(() => {
            const f = hub(focusHub);
            return (
              <g>
                <line
                  x1={f.x}
                  y1={f.y - 10}
                  x2={f.x}
                  y2={f.y - 88}
                  stroke="#3db882"
                  strokeOpacity="0.65"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
                <circle cx={f.x} cy={f.y - 88} r="3.5" fill="#3db882" />
                <circle cx={f.x} cy={f.y - 88} r="8" fill="#3db882" fillOpacity="0.25" />
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}

/** Back-compat wrapper for existing imports. */
export function SaudiTopo({
  className,
}: {
  className?: string;
  glow?: boolean;
}) {
  return <SaudiMap3D className={className} variant="canvas" focusHub="riyadh" />;
}
