"use client";

import { useEffect, useState } from "react";

import { ModalDialog } from "@/components/dashboard/modal-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { LinkedWallet, TrackedWalletType } from "@/types";

const walletTypes: TrackedWalletType[] = ["personal", "trading", "staking", "treasury", "watch-only"];

export function AddTrackedWalletModal({
  open,
  onOpenChange,
  mode,
  linkedWallets,
  existingAddresses,
  onCreateGroup,
  onAddWallet,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "wallet" | "group";
  linkedWallets: LinkedWallet[];
  existingAddresses: string[];
  onCreateGroup: (payload: { name: string }) => Promise<void>;
  onAddWallet: (payload: {
    address: string;
    label?: string;
    type: TrackedWalletType;
    notes?: string;
    isFavorite?: boolean;
    isPrimary?: boolean;
  }) => Promise<void>;
}) {
  const [groupName, setGroupName] = useState("");
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState<TrackedWalletType>("personal");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setGroupName("");
      setAddress("");
      setLabel("");
      setType("personal");
      setNotes("");
    }
  }, [open]);

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "group" ? "Create Cross-Wallet Group" : "Add Tracked Wallet"}
      description={mode === "group" ? "Create a reusable wallet set for cross-wallet comparison and export." : "Add a wallet address to the selected group for aggregate analytics."}
    >
      {mode === "group" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Group name</Label>
            <Input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="My Wallets, Treasury, Research..." />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                setSaving(true);
                try {
                  await onCreateGroup({ name: groupName });
                  onOpenChange(false);
                } finally {
                  setSaving(false);
                }
              }}
              disabled={!groupName.trim() || saving}
            >
              {saving ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Quick add linked wallet</Label>
            <div className="flex flex-wrap gap-2">
              {linkedWallets.map((wallet) => (
                <button
                  key={wallet.address}
                  type="button"
                  className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
                  onClick={() => {
                    setAddress(wallet.address);
                    setLabel(wallet.label || "");
                    setNotes(wallet.notes || "");
                  }}
                >
                  {wallet.label || `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Wallet address</Label>
              <Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Enter Solana wallet address" />
            </div>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Treasury Alpha" />
            </div>
            <div className="space-y-2">
              <Label>Wallet type</Label>
              <Select value={type} onValueChange={(value: TrackedWalletType) => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {walletTypes.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ops wallet, staking-only, external treasury, watch-only research set..." />
            </div>
          </div>

          {existingAddresses.includes(address) ? (
            <div className="rounded-md border border-amber-400/20 bg-amber-500/10 px-3 py-3 text-sm text-amber-200">
              This wallet is already part of the selected group.
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                setSaving(true);
                try {
                  await onAddWallet({
                    address,
                    label,
                    type,
                    notes,
                  });
                  onOpenChange(false);
                } finally {
                  setSaving(false);
                }
              }}
              disabled={!address.trim() || existingAddresses.includes(address) || saving}
            >
              {saving ? "Saving..." : "Add Wallet"}
            </Button>
          </div>
        </div>
      )}
    </ModalDialog>
  );
}
