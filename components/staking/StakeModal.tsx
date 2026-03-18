"use client";

import { useForm } from "react-hook-form";

import type { CreateStakeInput, LockPeriod, TokenOption } from "@/types";
import { GradientButton } from "@/components/shared";
import { ModalDialog } from "@/components/dashboard/modal-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function StakeModal({
  open,
  onClose,
  tokens,
  lockPeriods,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  tokens: TokenOption[];
  lockPeriods: LockPeriod[];
  onSubmit: (data: CreateStakeInput) => void;
  loading?: boolean;
}) {
  const form = useForm<CreateStakeInput>({
    defaultValues: {
      tokenSymbol: tokens[0]?.value || "SOL",
      amount: 50,
      durationDays: lockPeriods[0]?.durationDays || 30,
    },
  });

  return (
    <ModalDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      title="Stake Tokens"
      description="Select token, amount, and lock period to create a new stake."
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label>Token</Label>
          <Select value={form.watch("tokenSymbol")} onValueChange={(value) => form.setValue("tokenSymbol", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tokens.map((token) => (
                <SelectItem key={token.value} value={token.value}>
                  {token.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stakeModalAmount">Amount</Label>
          <Input id="stakeModalAmount" type="number" step="0.01" {...form.register("amount", { valueAsNumber: true })} />
        </div>

        <div className="space-y-2">
          <Label>Lock period</Label>
          <Select
            value={String(form.watch("durationDays"))}
            onValueChange={(value) => form.setValue("durationDays", Number(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {lockPeriods.map((period) => (
                <SelectItem key={period._id} value={String(period.durationDays)}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <GradientButton type="submit" loading={loading}>
            Confirm Stake
          </GradientButton>
        </div>
      </form>
    </ModalDialog>
  );
}
