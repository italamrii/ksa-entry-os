import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  variant?: "default" | "muted" | "bordered";
}

export function Section({ children, className, id, variant = "default" }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "section-padding px-4 sm:px-6 lg:px-8",
        variant === "muted" && "bg-[var(--surface-muted)]/50",
        variant === "bordered" && "border-y border-[var(--border-subtle)]",
        className
      )}
    >
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

interface SectionHeaderProps {
  overline?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  overline,
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-12 max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {overline && (
        <p className="text-overline mb-3">{overline}</p>
      )}
      <h2 className="text-headline text-foreground">{title}</h2>
      {subtitle && (
        <p className="text-subhead mt-4 text-[var(--muted)]">{subtitle}</p>
      )}
    </div>
  );
}
