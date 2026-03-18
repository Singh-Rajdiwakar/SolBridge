import { STATUS_TONES } from "@/lib/constants";
import { cn } from "@/utils/cn";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        STATUS_TONES[status.toLowerCase()] || "border-white/10 bg-white/5 text-[#c9c4bb]",
      )}
    >
      {status}
    </span>
  );
}
