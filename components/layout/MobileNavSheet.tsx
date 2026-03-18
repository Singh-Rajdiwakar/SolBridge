"use client";

import Link from "next/link";
import type { NavItem } from "@/types";
import { cn } from "@/utils/cn";

export function MobileNavSheet({
  open,
  onOpenChange,
  links,
  activeTab,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links: NavItem[];
  activeTab: string;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md xl:hidden"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="absolute right-0 top-0 h-full w-[84vw] max-w-sm border-l border-white/10 bg-[rgba(5,9,22,0.98)] p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-white">Menu</div>
            <div className="text-sm text-slate-400">Navigate the dashboard</div>
          </div>
          <button
            type="button"
            className="rounded-md border border-white/10 px-4 py-2 text-sm text-slate-300"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>

        <div className="space-y-2">
          {links.map((item) => {
            const active = activeTab.startsWith(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md border border-white/10 px-4 py-3 text-sm text-slate-300 transition",
                  active && "border-cyan-300/20 bg-cyan-400/10 text-white",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
