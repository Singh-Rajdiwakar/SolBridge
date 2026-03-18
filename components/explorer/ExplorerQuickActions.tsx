"use client";

import { Copy, ExternalLink, Pin, UserPlus, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard, SectionHeader } from "@/components/shared";
import { cn } from "@/utils/cn";

export function ExplorerQuickActions({
  title,
  identifier,
  explorerUrl,
  verified = true,
  tags = [],
  onSaveWallet,
  onSaveContact,
  className,
}: {
  title: string;
  identifier: string;
  explorerUrl?: string;
  verified?: boolean;
  tags?: string[];
  onSaveWallet?: () => Promise<void> | void;
  onSaveContact?: () => Promise<void> | void;
  className?: string;
}) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(identifier);
    toast.success("Copied to clipboard");
  };

  return (
    <GlassCard className={cn("space-y-4", className)}>
      <SectionHeader
        title="Explorer Quick Actions"
        subtitle="Copy, verify, and attach this on-chain entity to your product workspace."
      />

      <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-center gap-2">
          {verified ? <Badge variant="success">Verified On-Chain</Badge> : null}
          {tags.map((tag) => (
            <Badge key={tag} variant="muted">
              {tag}
            </Badge>
          ))}
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{title}</div>
          <div className="mt-2 break-all font-mono text-sm text-white">{identifier}</div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="secondary" onClick={handleCopy}>
          <Copy className="h-4 w-4" />
          Copy
        </Button>
        <a
          href={explorerUrl || "#"}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 px-4 text-sm font-medium text-slate-100 transition hover:border-cyan-300/30 hover:text-white",
            !explorerUrl && "pointer-events-none opacity-50",
          )}
        >
          <ExternalLink className="h-4 w-4" />
          Open Explorer
        </a>
        {onSaveWallet ? (
          <Button variant="secondary" onClick={() => void onSaveWallet()}>
            <Wallet className="h-4 w-4" />
            Save Wallet
          </Button>
        ) : null}
        {onSaveContact ? (
          <Button variant="secondary" onClick={() => void onSaveContact()}>
            <UserPlus className="h-4 w-4" />
            Save Contact
          </Button>
        ) : null}
        <Button variant="secondary" disabled className="sm:col-span-2">
          <Pin className="h-4 w-4" />
          Pin to Dashboard
        </Button>
      </div>
    </GlassCard>
  );
}
