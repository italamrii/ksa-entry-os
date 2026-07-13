/**
 * NarrativePanel — a titled, landmarked region. The workspace is built from
 * narrative panels and decision strips rather than a grid of cards.
 */
export function NarrativePanel({
  title,
  description,
  actions,
  children,
  id,
  className,
  embedded = false,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  className?: string;
  embedded?: boolean;
}) {
  return (
    <section id={id} aria-label={title} className={["scroll-mt-24", className].filter(Boolean).join(" ")}>
      <div
        className={
          embedded
            ? "mb-3 flex items-end justify-between gap-3"
            : "mb-4 flex items-end justify-between gap-3 border-b border-[var(--border-subtle)] pb-3"
        }
      >
        <div className="min-w-0">
          <h2 className="text-overline">{title}</h2>
          {description && <p className="mt-1.5 text-sm text-[var(--muted)]">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

/** DecisionStrip — a compact, scannable row of label/value facts. */
export function DecisionStrip({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="surface-panel grid grid-cols-2 gap-x-6 gap-y-4 rounded-[var(--radius-lg)] p-5 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((it, i) => (
        <div key={i} className="min-w-0 border-s border-[var(--border-subtle)] ps-3 first:border-s-0 first:ps-0">
          <dt className="text-caption">{it.label}</dt>
          <dd className="mt-0.5 truncate text-sm font-medium text-foreground">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * EvidencePanel — progressive disclosure of detailed reasoning. Uses the native
 * <details>/<summary> element so it is fully keyboard-operable without JS.
 */
export function EvidencePanel({
  summary,
  children,
  defaultOpen = false,
}: {
  summary: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-muted)]/40"
    >
      <summary className="cursor-pointer list-none rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]">
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="text-[var(--highlight)] transition group-open:rotate-90 motion-reduce:transition-none"
          >
            ›
          </span>
          {summary}
        </span>
      </summary>
      <div className="animate-evidence border-t border-[var(--border-subtle)] px-4 py-3 text-sm text-[var(--muted)]">
        {children}
      </div>
    </details>
  );
}
