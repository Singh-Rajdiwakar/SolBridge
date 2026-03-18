"use client";

import { useEffect, useState } from "react";

import { GradientButton, TokenBadge } from "@/components/shared";
import { ModalDialog } from "@/components/dashboard/modal-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LendingActionInput, LendingMarket } from "@/types";

function toTitleCase(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function LendingActionModal({
  open,
  mode,
  asset,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  mode: "supply" | "borrow" | "withdraw" | "repay";
  asset: LendingMarket | null;
  onClose: () => void;
  onSubmit: (data: LendingActionInput) => void;
  loading?: boolean;
}) {
  const [amount, setAmount] = useState(100);

  useEffect(() => {
    setAmount(100);
  }, [asset?._id, mode]);

  return (
    <ModalDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      title={`${toTitleCase(mode)} ${asset?.token || "Asset"}`}
      description="Unified modal for lending actions including supply, borrow, withdraw, and repay."
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!asset) {
            return;
          }
          onSubmit({
            token: asset.token,
            amount,
          });
        }}
      >
        {asset ? <TokenBadge symbol={asset.token} /> : null}

        <div className="space-y-2">
          <Label htmlFor="lending-modal-amount">Amount</Label>
          <Input
            id="lending-modal-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <GradientButton type="submit" loading={loading} disabled={!asset}>
            Confirm {toTitleCase(mode)}
          </GradientButton>
        </div>
      </form>
    </ModalDialog>
  );
}
