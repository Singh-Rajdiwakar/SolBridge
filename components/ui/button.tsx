import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(242,201,76,0.45)]",
  {
    variants: {
      variant: {
        default:
          "border-[rgba(242,201,76,0.28)] bg-[linear-gradient(135deg,#c89b2c,#f2c94c)] text-[#080909] shadow-[0_18px_54px_rgba(224,185,75,0.22)] hover:-translate-y-0.5 hover:brightness-105",
        secondary:
          "border-[rgba(224,185,75,0.14)] bg-[rgba(255,255,255,0.03)] text-[#f6f3ed] hover:border-[rgba(242,201,76,0.3)] hover:bg-[rgba(255,255,255,0.06)]",
        ghost: "border-transparent text-[#c9c4bb] hover:bg-[rgba(255,255,255,0.04)] hover:text-white",
        danger:
          "border-rose-400/20 bg-rose-500/10 text-rose-100 hover:border-rose-300/40 hover:bg-rose-500/16",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 px-5 text-base",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
