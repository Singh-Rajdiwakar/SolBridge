import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]",
  {
    variants: {
      variant: {
        default: "border-[rgba(224,185,75,0.2)] bg-[rgba(224,185,75,0.08)] text-[#f3d57c]",
        muted: "border-white/10 bg-white/5 text-[#c9c4bb]",
        success: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
        danger: "border-rose-400/20 bg-rose-500/10 text-rose-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
