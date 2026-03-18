"use client";

import { cn } from "@/utils/cn";

export function FilterTabs({
  items,
  active,
  onChange,
}: {
  items: { label: string; value: string }[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-[rgba(224,185,75,0.14)] bg-[rgba(255,255,255,0.03)] p-1.5">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium text-[#c9c4bb] transition",
            active === item.value && "border border-[rgba(224,185,75,0.22)] bg-[rgba(224,185,75,0.12)] text-white shadow-[0_10px_30px_rgba(224,185,75,0.08)]",
          )}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
