import { formatCompactCurrency, formatNumber, formatPercent } from "@/utils/format";
import type { Pool } from "@/types";
import { Button } from "@/components/ui/button";

export function PoolRow({
  pool,
  onClick,
}: {
  pool: Pool;
  onClick: () => void;
}) {
  return (
    <div className="grid grid-cols-[1.2fr_repeat(5,0.8fr)_auto] items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm">
      <div>
        <div className="font-medium text-white">{pool.pair}</div>
        <div className="text-xs text-slate-500">
          {pool.tokenA} / {pool.tokenB}
        </div>
      </div>
      <div>{formatCompactCurrency(pool.totalLiquidity)}</div>
      <div>{formatPercent(pool.apr)}</div>
      <div>{formatCompactCurrency(pool.volume24h)}</div>
      <div>{pool.feePercent}%</div>
      <div>{formatNumber(pool.yourShare, 3)}%</div>
      <Button size="sm" onClick={onClick}>
        Manage
      </Button>
    </div>
  );
}
