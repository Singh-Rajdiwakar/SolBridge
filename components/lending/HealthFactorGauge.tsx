import { formatNumber } from "@/utils/format";

function getGaugeWidth(healthFactor: number) {
  if (healthFactor >= 2) return "25%";
  if (healthFactor >= 1.5) return "55%";
  if (healthFactor >= 1.1) return "78%";
  return "100%";
}

function getGaugeTone(healthFactor: number) {
  if (healthFactor >= 2) return "bg-emerald-400";
  if (healthFactor >= 1.5) return "bg-amber-400";
  if (healthFactor >= 1.1) return "bg-orange-400";
  return "bg-rose-400";
}

function getGaugeLabel(healthFactor: number) {
  if (healthFactor >= 2) return "safe";
  if (healthFactor >= 1.5) return "moderate";
  if (healthFactor >= 1.1) return "risky";
  return "danger";
}

export function HealthFactorGauge({ healthFactor }: { healthFactor: number }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>Health factor</span>
        <span>{formatNumber(healthFactor)}</span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${getGaugeTone(healthFactor)}`} style={{ width: getGaugeWidth(healthFactor) }} />
      </div>
      <div className="mt-3 text-sm capitalize text-slate-400">{getGaugeLabel(healthFactor)}</div>
    </div>
  );
}
