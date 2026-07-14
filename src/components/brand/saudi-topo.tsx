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

const HUBS: {
  id: HubId;
  x: number;
  y: number;
  r: number;
  accent: "emerald" | "gold";
  labelEn: string;
  labelAr: string;
}[] = [
  { id: "riyadh", x: 392, y: 278, r: 7, accent: "gold", labelEn: "Riyadh", labelAr: "الرياض" },
  { id: "jeddah", x: 218, y: 305, r: 5.5, accent: "emerald", labelEn: "Jeddah", labelAr: "جدة" },
  { id: "dammam", x: 530, y: 255, r: 5.2, accent: "emerald", labelEn: "Dammam", labelAr: "الدمام" },
  { id: "neom", x: 168, y: 118, r: 4.8, accent: "gold", labelEn: "NEOM", labelAr: "نيوم" },
  { id: "madinah", x: 248, y: 225, r: 4.4, accent: "emerald", labelEn: "Madinah", labelAr: "المدينة" },
  { id: "abha", x: 268, y: 410, r: 4.2, accent: "emerald", labelEn: "Abha", labelAr: "أبها" },
  { id: "tabuk", x: 205, y: 148, r: 4, accent: "emerald", labelEn: "Tabuk", labelAr: "تبوك" },
  { id: "jizan", x: 248, y: 458, r: 3.8, accent: "emerald", labelEn: "Jazan", labelAr: "جازان" },
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
 * Recognizable stylized KSA outline (N→E→S→W):
 * Gulf bulge east, Empty Quarter SE, Red Sea west, NW toward NEOM/Tabuk.
 */
const KSA_FACE =
  "M155 95 L175 70 L230 55 L290 48 L350 52 L410 68 L470 95 L520 130 L555 175 L575 230 L580 280 L565 330 L540 370 L505 410 L460 448 L400 475 L340 490 L290 495 L250 485 L225 455 L210 415 L195 370 L175 320 L155 270 L140 220 L135 170 L145 125 Z";

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
  const extruded = offsetPath(KSA_FACE, EXTRUDE_Y);

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

          <ellipse cx="360" cy="340" rx="250" ry="150" fill={`url(#${uid}-aura)`} />

          {/* Extruded volume */}
          <path d={extruded} fill={`url(#${uid}-wall)`} opacity="0.95" />
          {/* Bridge walls between face and extrusion (east & south edges approx) */}
          <path
            d={`M580 280 L580 ${280 + EXTRUDE_Y} L565 ${330 + EXTRUDE_Y} L540 ${370 + EXTRUDE_Y} L505 ${410 + EXTRUDE_Y} L460 ${448 + EXTRUDE_Y} L400 ${475 + EXTRUDE_Y} L340 ${490 + EXTRUDE_Y} L290 ${495 + EXTRUDE_Y} L250 ${485 + EXTRUDE_Y} L225 ${455 + EXTRUDE_Y} L210 ${415 + EXTRUDE_Y} L195 ${370 + EXTRUDE_Y} L175 ${320 + EXTRUDE_Y} L155 ${270 + EXTRUDE_Y} L140 ${220 + EXTRUDE_Y} L135 ${170 + EXTRUDE_Y} L145 ${125 + EXTRUDE_Y} L155 95 L145 125 L135 170 L140 220 L155 270 L175 320 L195 370 L210 415 L225 455 L250 485 L290 495 L340 490 L400 475 L460 448 L505 410 L540 370 L565 330 L580 280 Z`}
            fill={`url(#${uid}-wall)`}
            opacity="0.85"
          />

          <path
            d={KSA_FACE}
            fill={`url(#${uid}-face)`}
            stroke={`url(#${uid}-rim)`}
            strokeWidth="2.4"
            filter={`url(#${uid}-glow)`}
          />

          <g clipPath={`url(#${uid}-clip)`}>
            <rect x="100" y="40" width="520" height="480" fill={`url(#${uid}-grid)`} />
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
