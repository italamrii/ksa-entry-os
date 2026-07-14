/**
 * Abstract Saudi Arabian market topography — geographic linework for spatial
 * grounding. Not an official map seal; no emblems, flags, or government marks.
 */
export function SaudiTopo({
  className,
  glow = false,
}: {
  className?: string;
  glow?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 800 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="topo-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a1d24" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0f4f3c" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="topo-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2f9e6e" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#c4a574" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#2f9e6e" stopOpacity="0.2" />
        </linearGradient>
        {glow && (
          <filter id="topo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Soft terrain plate */}
      <path
        d="M120 100c70-40 160-55 255-48 90 7 170 38 235 90 45 36 88 90 90 148 2 68-40 120-102 146-75 32-168 40-256 26-82-13-160-46-208-102-44-52-55-130-14-260z"
        fill="url(#topo-fill)"
        stroke="url(#topo-line)"
        strokeWidth="1.5"
        filter={glow ? "url(#topo-glow)" : undefined}
      />

      {/* Network lattice — denser for readable topography */}
      <path d="M160 180c80-28 170-36 260-20 70 12 140 48 180 96" stroke="#2f9e6e" strokeOpacity="0.38" strokeWidth="1.25" />
      <path d="M180 240c90-20 190-24 280-4 60 14 118 46 150 86" stroke="#c4a574" strokeOpacity="0.32" strokeWidth="1.25" />
      <path d="M200 300c84-12 180-10 260 18 52 18 98 52 118 92" stroke="#2f9e6e" strokeOpacity="0.28" strokeWidth="1.25" />
      <path d="M240 150c100-10 210 8 300 55 70 36 130 95 145 155" stroke="#3db882" strokeOpacity="0.2" strokeWidth="1" />

      {/* Network nodes (market centres — abstract) */}
      <circle cx="320" cy="210" r="4.5" fill="#c4a574" fillOpacity="0.95" />
      <circle cx="420" cy="250" r="4" fill="#2f9e6e" fillOpacity="0.85" />
      <circle cx="500" cy="190" r="3.5" fill="#d8cbb4" fillOpacity="0.75" />
      <circle cx="280" cy="300" r="3.5" fill="#2f9e6e" fillOpacity="0.7" />
      <circle cx="380" cy="320" r="3" fill="#c4a574" fillOpacity="0.55" />
      <path d="M320 210L420 250L500 190M420 250L280 300L380 320L420 250" stroke="#c4a574" strokeOpacity="0.45" strokeWidth="1.25" />

      {/* Perspective grid */}
      {Array.from({ length: 8 }).map((_, i) => (
        <line
          key={`h-${i}`}
          x1="120"
          y1={130 + i * 36}
          x2="680"
          y2={145 + i * 38}
          stroke="#3db882"
          strokeOpacity="0.09"
          strokeWidth="1"
        />
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <line
          key={`v-${i}`}
          x1={160 + i * 52}
          y1="120"
          x2={140 + i * 58}
          y2="400"
          stroke="#3db882"
          strokeOpacity="0.07"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}
