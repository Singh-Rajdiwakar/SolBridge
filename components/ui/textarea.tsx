import * as React from "react";

import { cn } from "@/utils/cn";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[120px] w-full rounded-xl border border-[rgba(224,185,75,0.12)] bg-[rgba(21,24,27,0.92)] px-3 py-3 text-sm text-[#f6f3ed] placeholder:text-[#8e877b] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition focus:border-[rgba(242,201,76,0.34)] focus:ring-2 focus:ring-[rgba(242,201,76,0.14)]",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea };
