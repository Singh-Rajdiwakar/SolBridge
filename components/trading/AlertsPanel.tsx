"use client";

import { useState } from "react";
import { Bell, Trash2 } from "lucide-react";

import type { TradingAlert, TradingSymbol } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SYMBOL_LABELS, TRADING_SYMBOLS } from "@/components/trading/constants";

export function AlertsPanel({
  alerts,
  selectedSymbol,
  loading,
  onCreate,
  onDelete,
}: {
  alerts: TradingAlert[];
  selectedSymbol: TradingSymbol;
  loading?: boolean;
  onCreate: (payload: {
    symbol: TradingSymbol;
    conditionType: "above" | "below" | "smaCross" | "percentDrop";
    targetValue: number;
    indicator?: string;
  }) => void;
  onDelete: (id: string) => void;
}) {
  const [symbol, setSymbol] = useState<TradingSymbol>(selectedSymbol);
  const [conditionType, setConditionType] = useState<"above" | "below" | "smaCross" | "percentDrop">("above");
  const [targetValue, setTargetValue] = useState("0");

  return (
    <div className="glass-panel space-y-4 border-white/8 p-4">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Alerts</div>
        <div className="mt-2 text-lg font-semibold text-white">Price and signal triggers</div>
      </div>

      <div className="grid gap-3">
        <select value={symbol} onChange={(event) => setSymbol(event.target.value as TradingSymbol)} className="h-10 rounded-md border border-white/10 bg-[rgba(17,27,49,0.88)] px-3 text-sm text-slate-100 outline-none">
          {TRADING_SYMBOLS.map((item) => (
            <option key={item} value={item}>
              {SYMBOL_LABELS[item]}
            </option>
          ))}
        </select>
        <select value={conditionType} onChange={(event) => setConditionType(event.target.value as "above" | "below" | "smaCross" | "percentDrop")} className="h-10 rounded-md border border-white/10 bg-[rgba(17,27,49,0.88)] px-3 text-sm text-slate-100 outline-none">
          <option value="above">Price Above</option>
          <option value="below">Price Below</option>
          <option value="smaCross">Crosses SMA</option>
          <option value="percentDrop">Drops %</option>
        </select>
        <Input value={targetValue} onChange={(event) => setTargetValue(event.target.value)} placeholder="Target value" />
      </div>

      <Button className="w-full" disabled={loading} onClick={() => onCreate({ symbol, conditionType, targetValue: Number(targetValue), indicator: conditionType === "smaCross" ? "SMA" : undefined })}>
        <Bell className="h-4 w-4" />
        {loading ? "Creating..." : "Create Alert"}
      </Button>

      <div className="space-y-2">
        {alerts.map((alert) => (
          <div key={alert._id} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-3 text-sm">
            <div>
              <div className="font-medium text-white">
                {alert.symbol} {alert.conditionType} {alert.targetValue}
              </div>
              <div className="text-xs text-slate-500">
                {alert.status} • {new Date(alert.createdAt).toLocaleString()}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onDelete(alert._id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
