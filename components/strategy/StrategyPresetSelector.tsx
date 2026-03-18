"use client";

import { Sparkles } from "lucide-react";

import { STRATEGY_PRESETS } from "@/components/strategy/strategy-config";
import { GlassCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

export function StrategyPresetSelector({
  selectedKey,
  onSelect,
}: {
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <GlassCard>
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-md border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-200">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Strategy Presets</h3>
          <p className="text-sm text-slate-400">Start from a portfolio profile and then refine allocation sliders manually.</p>
        </div>
      </div>
      <div className="grid gap-3 xl:grid-cols-5">
        {STRATEGY_PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => onSelect(preset.key)}
            className={cn(
              "rounded-lg border p-4 text-left transition",
              selectedKey === preset.key
                ? "border-cyan-400/30 bg-cyan-500/[0.08] shadow-[0_16px_40px_rgba(34,211,238,0.08)]"
                : "border-white/10 bg-white/[0.03] hover:border-cyan-400/20 hover:bg-white/[0.05]",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white">{preset.label}</div>
              <Button
                type="button"
                variant={selectedKey === preset.key ? "default" : "secondary"}
                size="sm"
                className="pointer-events-none h-7 px-2"
              >
                {selectedKey === preset.key ? "Active" : "Apply"}
              </Button>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">{preset.description}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <span>{preset.timeframe}</span>
              <span>{preset.scenario}</span>
            </div>
          </button>
        ))}
      </div>
    </GlassCard>
  );
}
