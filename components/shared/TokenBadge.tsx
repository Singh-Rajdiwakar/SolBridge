import { TokenRow } from "@/components/dashboard/token-row";

export function TokenBadge({
  symbol,
  icon,
}: {
  symbol: string;
  icon?: string;
}) {
  void icon;
  return <TokenRow token={symbol} />;
}
