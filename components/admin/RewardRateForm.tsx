"use client";

import { useForm } from "react-hook-form";

import type { RewardRateSettings } from "@/types";
import { GradientButton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function RewardRateForm({
  defaultValues,
  onSubmit,
}: {
  defaultValues: RewardRateSettings;
  onSubmit: (data: RewardRateSettings) => void;
}) {
  const form = useForm<RewardRateSettings>({ values: defaultValues });

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label>Reward Rate %</Label>
        <Input type="number" step="0.01" {...form.register("rewardRate", { valueAsNumber: true })} />
      </div>
      <div className="space-y-2">
        <Label>APY Type</Label>
        <Input {...form.register("apyType")} />
      </div>
      <div className="space-y-2">
        <Label>Max Stake Limit</Label>
        <Input type="number" {...form.register("maxStakeLimit", { valueAsNumber: true })} />
      </div>
      <div className="space-y-2">
        <Label>Pool Capacity</Label>
        <Input type="number" {...form.register("poolCapacity", { valueAsNumber: true })} />
      </div>
      <div className="space-y-2">
        <Label>Early Withdrawal Fee</Label>
        <Input type="number" step="0.1" {...form.register("earlyWithdrawalFee", { valueAsNumber: true })} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 text-sm text-slate-300">Pool Activation</div>
          <Switch checked={form.watch("poolActive")} onCheckedChange={(value) => form.setValue("poolActive", value)} />
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 text-sm text-slate-300">Auto Compounding</div>
          <Switch checked={form.watch("autoCompounding")} onCheckedChange={(value) => form.setValue("autoCompounding", value)} />
        </div>
      </div>
      <div className="md:col-span-2 flex flex-wrap justify-end gap-3">
        <Button
          variant="secondary"
          type="button"
          onClick={() => form.reset(defaultValues)}
        >
          Reset defaults
        </Button>
        <GradientButton type="submit">Save settings</GradientButton>
      </div>
    </form>
  );
}
