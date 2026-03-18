import type { AdminSettings, RewardRateSettings } from "@/types";

import { GlassCard, SectionHeader } from "@/components/shared";
import { RewardRateForm } from "@/components/admin/RewardRateForm";

export function AdminSettingsPanel({
  settings,
  onSave,
  loading,
}: {
  settings: AdminSettings;
  onSave: (data: RewardRateSettings) => void;
  loading?: boolean;
}) {
  void loading;
  return (
    <GlassCard>
      <SectionHeader
        title="Reward Rate & Pool Settings"
        subtitle="Main admin configuration form for reward and pool settings."
      />
      <RewardRateForm
        defaultValues={{
          rewardRate: settings.rewardRate,
          apyType: settings.apyType,
          maxStakeLimit: settings.maxStakeLimit,
          poolCapacity: settings.poolCapacity,
          earlyWithdrawalFee: settings.earlyWithdrawalFee,
          poolActive: settings.poolActive,
          autoCompounding: settings.autoCompounding,
        }}
        onSubmit={onSave}
      />
    </GlassCard>
  );
}
