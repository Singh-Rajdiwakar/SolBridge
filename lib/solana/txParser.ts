export function getExplorerProtocolTone(protocol: string) {
  const normalized = protocol.toLowerCase();
  if (normalized.includes("stake")) {
    return "border-emerald-400/20 bg-emerald-500/12 text-emerald-200";
  }
  if (normalized.includes("liquidity") || normalized.includes("swap")) {
    return "border-cyan-400/20 bg-cyan-500/12 text-cyan-100";
  }
  if (normalized.includes("lend") || normalized.includes("borrow")) {
    return "border-blue-400/20 bg-blue-500/12 text-blue-100";
  }
  if (normalized.includes("governance") || normalized.includes("vote")) {
    return "border-violet-400/20 bg-violet-500/12 text-violet-100";
  }
  if (normalized.includes("token")) {
    return "border-amber-400/20 bg-amber-500/12 text-amber-100";
  }
  if (normalized.includes("wallet") || normalized.includes("transfer")) {
    return "border-slate-300/15 bg-white/[0.06] text-slate-100";
  }
  return "border-white/10 bg-white/[0.05] text-slate-200";
}

export function humanizeProtocolLabel(protocol: string) {
  return protocol
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

export function shortenExplorerValue(value: string, prefix = 6, suffix = 5) {
  if (!value || value.length <= prefix + suffix + 3) {
    return value;
  }
  return `${value.slice(0, prefix)}...${value.slice(-suffix)}`;
}
