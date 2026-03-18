"use client";

import QRCode from "react-qr-code";
import { Copy, Share2 } from "lucide-react";

import { ModalDialog } from "@/components/dashboard/modal-dialog";
import { Button } from "@/components/ui/button";

export function ReceiveModal({
  open,
  onClose,
  address,
  onCopy,
}: {
  open: boolean;
  onClose: () => void;
  address: string | null;
  onCopy: () => void;
}) {
  return (
    <ModalDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      title="Receive SOL"
      description="Scan to send SOL on Devnet, or copy the wallet address directly."
      contentClassName="left-auto right-0 top-0 h-screen w-[min(100vw,28rem)] translate-x-0 translate-y-0 rounded-none border-l border-cyan-400/14 border-t-0 bg-[rgba(7,12,24,0.98)] p-6"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Network Note</div>
          <div className="mt-2 text-sm text-slate-300">Only send Solana assets on Devnet to this address.</div>
        </div>

        <div className="mx-auto flex w-fit items-center justify-center rounded-lg border border-white/10 bg-white p-4">
          {address ? <QRCode size={184} value={address} /> : <div className="text-sm text-slate-800">No address</div>}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300 break-all">
          {address || "Connect a wallet to receive SOL."}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              if (!address || !navigator.share) {
                return;
              }
              await navigator.share({
                title: "Retix Wallet Address",
                text: address,
              });
            }}
            disabled={!address || typeof navigator === "undefined" || !navigator.share}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button onClick={onCopy} disabled={!address}>
            <Copy className="h-4 w-4" />
            Copy Address
          </Button>
        </div>
      </div>
    </ModalDialog>
  );
}
