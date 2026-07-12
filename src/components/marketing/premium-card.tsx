import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface PremiumCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
  href?: string;
  badge?: string;
  meta?: { label: string; value: string }[];
  footer?: React.ReactNode;
  variant?: "default" | "featured" | "compact";
}

export function PremiumCard({
  title,
  description,
  icon: Icon,
  children,
  className,
  badge,
  meta,
  footer,
  variant = "default",
}: PremiumCardProps) {
  return (
    <div
      className={cn(
        "surface-elevated group relative rounded-2xl p-6 transition-all duration-300",
        variant === "featured" && "ring-1 ring-emerald-500/30",
        variant === "compact" && "p-5",
        className
      )}
    >
      {badge && (
        <span className="absolute -top-3 start-6 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/25">
          {badge}
        </span>
      )}
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 transition group-hover:bg-emerald-500/15">
            <Icon className="h-5 w-5 text-emerald-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className={cn("font-semibold text-foreground", variant === "compact" ? "text-sm" : "text-base")}>
            {title}
          </h3>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{description}</p>
          )}
        </div>
      </div>
      {meta && meta.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4 border-t border-[var(--border-subtle)] pt-4">
          {meta.map((m) => (
            <div key={m.label}>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">{m.label}</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">{m.value}</p>
            </div>
          ))}
        </div>
      )}
      {children && <div className="mt-4">{children}</div>}
      {footer && <div className="mt-5 border-t border-[var(--border-subtle)] pt-4">{footer}</div>}
    </div>
  );
}
