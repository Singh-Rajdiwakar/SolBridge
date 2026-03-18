"use client";

import { useMemo } from "react";
import { ArrowUpRight, QrCode, SendHorizontal, Wallet } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TOKEN_OPTIONS } from "@/lib/constants";
import { buildExplorerAddressUrl } from "@/lib/solana";
import type { WalletBalanceHistoryPoint, WalletTokenBalance } from "@/types";
import { cn } from "@/utils/cn";
import { formatCurrency, formatNumber } from "@/utils/format";

const tokenAddresses: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  RTX: "F4t4dJhj3M4N9LoP4Q7s9U2x8v3W6yZ1AaBbCcDdEeF",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6qE3oJb7qPnyYWoB",
  MSOL: "mSoLzYCxHdYgdzUeESejRJe4cR7k3H1eYVj9Ywq7x2w",
};

export function TokenDetailDrawer({
  token,
  open,
  onOpenChange,
  history,
  onSend,
  onReceive,
  onSwap,
}: {
  token: WalletTokenBalance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: WalletBalanceHistoryPoint[];
  onSend: () => void;
  onReceive: () => void;
  onSwap: () => void;
}) {
  const meta = TOKEN_OPTIONS.find((entry) => entry.value === token?.symbol);
  const tokenHistory = useMemo(
    () =>
      history.map((point, index) => ({
        label: point.label,
        value: Number((((token?.usdValue || 0) * (0.88 + index * 0.03))).toFixed(2)),
      })),
    [history, token],
  );

  if (!token) {
    return null;
  }

  const tokenAddress = tokenAddresses[token.symbol] || `${token.symbol}11111111111111111111111111111111111111`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-auto right-0 top-0 h-screen w-[min(100vw,32rem)] translate-x-0 translate-y-0 rounded-none border-l border-cyan-400/14 border-t-0 bg-[rgba(7,12,24,0.98)] p-0">
        <div className="h-full overflow-y-auto p-6">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br text-base font-semibold text-white shadow-glow", meta?.color || "from-cyan-300 to-blue-500")}>
                {token.symbol.slice(0, 2)}
              </div>
              <div>
                <DialogTitle>{meta?.name || token.symbol}</DialogTitle>
                <DialogDescription>{token.symbol}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Balance</div>
              <div className="mt-3 text-3xl font-semibold text-white">{formatNumber(token.balance, token.symbol === "BONK" ? 0 : 4)}</div>
              <div className="mt-1 text-sm text-slate-400">{formatCurrency(token.usdValue)}</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">24h Change</div>
                <div className={cn("mt-3 text-2xl font-semibold", token.change >= 0 ? "text-emerald-300" : "text-rose-300")}>
                  {token.change >= 0 ? "+" : ""}
                  {formatNumber(token.change, 2)}%
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Implied Price</div>
                <div className="mt-3 text-2xl font-semibold text-white">
                  {formatCurrency(token.balance > 0 ? token.usdValue / token.balance : 0)}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Token History</div>
                  <div className="mt-1 text-sm text-slate-400">Recent synthetic value trend</div>
                </div>
                <Wallet className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="mt-4 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tokenHistory}>
                    <defs>
                      <linearGradient id="token-history-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#22D3EE" strokeWidth={2.2} fill="url(#token-history-fill)" />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid rgba(120,170,255,0.14)",
                        background: "rgba(10,16,32,0.96)",
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Token Address</div>
              <div className="mt-2 break-all text-sm text-slate-200">{tokenAddress}</div>
              <a
                href={buildExplorerAddressUrl(tokenAddress)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm text-cyan-300 transition hover:text-cyan-200"
              >
                Open on Explorer
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Button onClick={onSend}>
                <SendHorizontal className="h-4 w-4" />
                Send
              </Button>
              <Button variant="secondary" onClick={onReceive}>
                <QrCode className="h-4 w-4" />
                Receive
              </Button>
              <Button variant="secondary" onClick={onSwap}>
                <ArrowUpRight className="h-4 w-4" />
                Swap
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
