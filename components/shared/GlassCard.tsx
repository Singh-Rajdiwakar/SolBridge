import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export function GlassCard({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div className={cn("glass-panel p-5 md:p-6", className)}>
      {title ? <h3 className="mb-4 text-lg font-semibold text-white">{title}</h3> : null}
      {children}
    </div>
  );
}
