import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-600/25 hover:from-teal-400 hover:to-teal-500 hover:shadow-teal-500/30",
        secondary:
          "bg-[var(--surface-muted)] text-foreground border border-[var(--border-subtle)] hover:border-teal-500/30 hover:bg-teal-500/5",
        outline:
          "border border-[var(--border-subtle)] bg-transparent text-foreground hover:border-teal-500/40 hover:bg-teal-500/5",
        ghost: "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-foreground",
        destructive: "bg-red-600 text-white hover:bg-red-500",
        link: "text-teal-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
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
