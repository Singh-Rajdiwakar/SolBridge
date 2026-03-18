import * as React from "react";

import { cn } from "@/utils/cn";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl border border-[rgba(224,185,75,0.12)] bg-[rgba(21,24,27,0.92)] px-3 py-2 text-sm text-[#f6f3ed] placeholder:text-[#8e877b] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition focus:border-[rgba(242,201,76,0.34)] focus:ring-2 focus:ring-[rgba(242,201,76,0.14)]",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
