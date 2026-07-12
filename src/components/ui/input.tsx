import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const fieldFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_35%,transparent)]";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--card)] px-4 py-2 text-sm text-foreground placeholder:text-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-45",
        fieldFocus,
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn("text-sm font-medium text-foreground/90", className)} {...props} />
  )
);
Label.displayName = "Label";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--card)] px-4 py-3 text-sm text-foreground placeholder:text-[var(--muted)]",
        fieldFocus,
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      className={cn(
        "flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--card)] px-4 py-2 text-sm text-foreground",
        fieldFocus,
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

const badgeVariants = {
  default: "bg-[var(--surface-muted)] text-[var(--muted)] border-[var(--border-subtle)]",
  success: "bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)] border-[color-mix(in_srgb,var(--success)_28%,transparent)]",
  warning: "bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-[var(--warning)] border-[color-mix(in_srgb,var(--warning)_28%,transparent)]",
  danger: "bg-[color-mix(in_srgb,var(--error)_12%,transparent)] text-[var(--error)] border-[color-mix(in_srgb,var(--error)_28%,transparent)]",
  info: "bg-[color-mix(in_srgb,var(--info)_12%,transparent)] text-[var(--info)] border-[color-mix(in_srgb,var(--info)_28%,transparent)]",
};

export const Badge = ({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof badgeVariants }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-[var(--radius-sm)] border px-2.5 py-0.5 text-xs font-semibold tracking-wide",
      badgeVariants[variant],
      className
    )}
    {...props}
  />
);

export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("animate-pulse rounded-[var(--radius-md)] bg-[var(--surface-muted)]", className)} {...props} />
);
