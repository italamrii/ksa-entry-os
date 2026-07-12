import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

type LogoTone = "color" | "mono" | "inverse";

/**
 * Abstract mark: nested arcs suggesting entry pathways converging on a market
 * center — Saudi-inspired geometry without official emblems or seals.
 */
export function LogoMark({
  className,
  tone = "color",
  title,
}: {
  className?: string;
  tone?: LogoTone;
  title?: string;
}) {
  const fills =
    tone === "mono"
      ? { outer: "currentColor", mid: "currentColor", core: "currentColor", opacity: [0.9, 0.55, 1] }
      : tone === "inverse"
        ? { outer: "#f3efe6", mid: "#d8cbb4", core: "#c4a574", opacity: [1, 1, 1] }
        : { outer: "#2f9e6e", mid: "#c4a574", core: "#f3efe6", opacity: [1, 1, 1] };

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-10 w-10", className)}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <rect width="40" height="40" rx="10" fill={tone === "mono" ? "transparent" : "#14161c"} />
      <path
        d="M8 28c4.5-10 19.5-10 24 0"
        stroke={fills.outer}
        strokeOpacity={fills.opacity[0]}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M11 22c3.5-7 14.5-7 18 0"
        stroke={fills.mid}
        strokeOpacity={fills.opacity[1]}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="15" r="3.2" fill={fills.core} fillOpacity={fills.opacity[2]} />
      <path
        d="M20 18.5v7"
        stroke={fills.mid}
        strokeOpacity={fills.opacity[1]}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LogoLockup({
  className,
  tone = "color",
  showTagline = true,
  tagline,
  compact = false,
}: {
  className?: string;
  tone?: LogoTone;
  showTagline?: boolean;
  tagline?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark tone={tone} title={APP_NAME} className={compact ? "h-8 w-8" : "h-10 w-10"} />
      <span className="hidden min-w-0 sm:block">
        <span className="block truncate text-sm font-semibold tracking-tight text-foreground">
          {APP_NAME}
        </span>
        {showTagline && (
          <span className="block truncate text-[10px] text-[var(--muted)]">
            {tagline ?? "Market Entry Intelligence"}
          </span>
        )}
      </span>
    </span>
  );
}
