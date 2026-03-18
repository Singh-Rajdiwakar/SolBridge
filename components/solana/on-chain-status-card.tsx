"use client";

import { Blocks, ExternalLink, ShieldCheck } from "lucide-react";

import type { OnChainProgramStatus } from "@/types";
import { Button } from "@/components/ui/button";

type OnChainStatusCardProps = {
  status: OnChainProgramStatus;
  heading: string;
  body: string;
};

export function OnChainStatusCard({ status, heading, body }: OnChainStatusCardProps) {
  return (
    <div className="rounded-lg border border-cyan-400/15 bg-[rgba(14,22,40,0.82)] p-5 shadow-[0_20px_50px_rgba(12,34,80,0.18)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-cyan-200">
            <Blocks className="h-4 w-4" />
            On-chain module
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{heading}</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">{body}</p>
          </div>
          <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Program ID</div>
              <div className="mt-2 truncate font-medium text-white">{status.programId}</div>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Config</div>
              <div className="mt-2 truncate font-medium text-white">{status.configAddress || "Pending deploy"}</div>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Status</div>
              <div className={`mt-2 font-medium ${status.deployed ? "text-emerald-300" : "text-amber-300"}`}>
                {status.deployed ? "Deployed on Devnet" : "Scaffolded, waiting for deploy"}
              </div>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Source</div>
              <div className="mt-2 font-medium text-white">{status.source === "on-chain" ? "Verified on-chain" : "Fallback metadata"}</div>
            </div>
          </div>
          {status.notes?.length ? (
            <div className="rounded-md border border-cyan-400/10 bg-cyan-400/5 px-4 py-3 text-sm text-slate-300">
              <div className="mb-2 flex items-center gap-2 text-cyan-200">
                <ShieldCheck className="h-4 w-4" />
                Why this matters
              </div>
              <ul className="space-y-1">
                {status.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open(status.explorerUrl, "_blank", "noopener,noreferrer")}
          >
            View Program
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
          {status.configExplorerUrl ? (
            <Button
              size="sm"
              onClick={() => window.open(status.configExplorerUrl, "_blank", "noopener,noreferrer")}
            >
              View Account
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
