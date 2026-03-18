import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export function SectionCard({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("glass-panel relative overflow-hidden p-5 md:p-6", className)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(242,201,76,0.58),transparent)]" />
      <div className="mb-5 flex flex-col gap-3 border-b border-white/6 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-[0.26em] text-[#8e877b]">Module Surface</div>
          <h3 className="text-xl font-semibold tracking-[-0.04em] text-white">{title}</h3>
          {description ? <p className="mt-1 text-sm leading-7 text-[#c9c4bb]">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
