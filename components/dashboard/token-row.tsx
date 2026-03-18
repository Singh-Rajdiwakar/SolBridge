import type { ReactNode } from "react";
import { TOKEN_OPTIONS } from "@/lib/constants";
import { cn } from "@/utils/cn";

export function TokenRow({
  token,
  label,
  value,
}: {
  token: string;
  label?: string;
  value?: ReactNode;
}) {
  const tokenConfig = TOKEN_OPTIONS.find((entry) => entry.value === token);

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-md bg-gradient-to-br text-sm font-semibold text-white shadow-glow",
            tokenConfig?.color || "from-cyan-300 to-blue-500",
          )}
        >
          {token.slice(0, 2)}
        </div>
        <div>
          <div className="font-medium text-white">{token}</div>
          {label ? <div className="text-sm text-slate-400">{label}</div> : null}
        </div>
      </div>
      {value ? <div className="text-sm text-slate-300">{value}</div> : null}
    </div>
  );
}
