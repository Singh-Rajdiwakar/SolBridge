import { AlertTriangle } from "lucide-react";

import { cn } from "@/utils/cn";

export function EmergencyActionButton({
  label,
  variant,
  onClick,
  disabled,
}: {
  label: string;
  variant: "danger" | "warning" | "secondary";
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "flex items-center justify-between rounded-[1.5rem] px-4 py-4 text-left transition disabled:opacity-50",
        variant === "danger" && "border border-rose-400/12 bg-rose-500/5 hover:border-rose-300/20 hover:bg-rose-500/8",
        variant === "warning" && "border border-amber-400/12 bg-amber-500/5 hover:border-amber-300/20 hover:bg-amber-500/8",
        variant === "secondary" && "border border-white/10 bg-white/[0.03] hover:border-cyan-300/20 hover:bg-white/[0.05]",
      )}
      onClick={onClick}
    >
      <div>
        <div className="font-medium text-white">{label}</div>
        <div className="mt-1 text-sm text-slate-400">Protected admin action</div>
      </div>
      <AlertTriangle className="h-5 w-5 text-rose-300" />
    </button>
  );
}
