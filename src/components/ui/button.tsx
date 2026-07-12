import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-45 active:translate-y-px",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-[var(--accent-bright)] to-[var(--accent)] text-white shadow-lg shadow-[color-mix(in_srgb,var(--accent)_28%,transparent)] hover:brightness-110",
        secondary:
          "bg-[var(--surface-muted)] text-foreground border border-[var(--border-subtle)] hover:border-[color-mix(in_srgb,var(--highlight)_35%,transparent)] hover:bg-[color-mix(in_srgb,var(--highlight)_6%,transparent)]",
        outline:
          "border border-[var(--border-subtle)] bg-transparent text-foreground hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]",
        ghost: "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-foreground",
        destructive: "bg-[var(--error)] text-white hover:brightness-110",
        link: "text-[var(--accent-bright)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-[var(--radius-sm)] px-4 text-xs",
        lg: "h-12 rounded-[var(--radius-lg)] px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { buttonVariants };
