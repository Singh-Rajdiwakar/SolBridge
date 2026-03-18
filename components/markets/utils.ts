import { formatCompactCurrency, formatCurrency, formatNumber, formatPercent } from "@/utils/format";

export function marketCurrencyCode(currency: string) {
  return currency.toUpperCase();
}

export function formatMarketCurrency(value: number, currency: string) {
  return formatCurrency(value, marketCurrencyCode(currency));
}

export function formatMarketCompactCurrency(value: number, currency: string) {
  return formatCompactCurrency(value, marketCurrencyCode(currency));
}

export function formatMarketNumber(value: number, digits = 2) {
  return formatNumber(value, digits);
}

export function formatMarketPercent(value: number, digits = 2) {
  return formatPercent(value, digits);
}

export function changeTone(value: number) {
  if (value > 0) {
    return "text-emerald-300";
  }
  if (value < 0) {
    return "text-rose-300";
  }
  return "text-slate-300";
}

export function badgeTone(value: number) {
  if (value > 0) {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  }
  if (value < 0) {
    return "border-rose-400/20 bg-rose-500/10 text-rose-300";
  }
  return "border-white/10 bg-white/[0.04] text-slate-300";
}

export function sentimentTone(sentiment?: string) {
  switch (sentiment?.toLowerCase()) {
    case "bullish":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
    case "bearish":
      return "border-rose-400/20 bg-rose-500/10 text-rose-300";
    default:
      return "border-cyan-400/20 bg-cyan-500/10 text-cyan-300";
  }
}

export const MARKET_RANGE_OPTIONS = ["1H", "24H", "7D", "1M", "3M", "1Y", "MAX"] as const;
export const MARKET_CURRENCY_OPTIONS = ["usd", "inr", "krw"] as const;
