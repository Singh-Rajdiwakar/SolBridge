import type { EmergencyActionType, SystemState } from "@/types";

import { GlassCard, SectionHeader } from "@/components/shared";
import { EmergencyActionButton } from "@/components/admin/EmergencyActionButton";

const actions: { label: string; value: EmergencyActionType; variant: "danger" | "warning" | "secondary" }[] = [
  { label: "Pause staking", value: "pause_staking", variant: "warning" },
  { label: "Resume staking", value: "resume_staking", variant: "secondary" },
  { label: "Freeze claims", value: "freeze_claims", variant: "danger" },
  { label: "Freeze withdrawals", value: "freeze_withdrawals", variant: "danger" },
  { label: "Maintenance mode", value: "maintenance_mode", variant: "warning" },
  { label: "Disable pool", value: "disable_pool", variant: "danger" },
];

export function EmergencyControlsPanel({
  systemState,
  onAction,
  loading,
}: {
  systemState: SystemState;
  onAction: (action: EmergencyActionType) => void;
  loading?: boolean;
}) {
  void systemState;
  return (
    <GlassCard>
      <SectionHeader title="Emergency Controls" subtitle="Critical emergency controls like pause staking or freeze withdrawals." />
      <div className="grid gap-3 md:grid-cols-2">
        {actions.map((action) => (
          <EmergencyActionButton
            key={action.value}
            label={action.label}
            variant={action.variant}
            onClick={() => onAction(action.value)}
            disabled={loading}
          />
        ))}
      </div>
    </GlassCard>
  );
}
