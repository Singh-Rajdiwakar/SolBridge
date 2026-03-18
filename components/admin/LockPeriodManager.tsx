import type { LockPeriod, LockPeriodInput } from "@/types";

import { GlassCard, GradientButton, LoadingSkeleton, SectionHeader } from "@/components/shared";
import { LockPeriodAdminRow } from "@/components/admin/LockPeriodAdminRow";

export function LockPeriodManager({
  periods,
  onCreate,
  onUpdate,
  onDelete,
  loading,
}: {
  periods: LockPeriod[];
  onCreate: (data: LockPeriodInput) => void;
  onUpdate: (id: string, data: LockPeriodInput) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}) {
  const first = periods[0];

  return (
    <GlassCard>
      <SectionHeader
        title="Lock Period Management"
        subtitle="CRUD interface for lock periods."
        action={
          <GradientButton
            onClick={() =>
              onCreate(
                first
                  ? {
                      label: `Custom ${first.durationDays + 15} Days`,
                      durationDays: first.durationDays + 15,
                      apy: first.apy,
                      minAmount: first.minAmount,
                      penaltyFee: first.penaltyFee,
                      enabled: true,
                    }
                  : {
                      label: "Custom 45 Days",
                      durationDays: 45,
                      apy: 15,
                      minAmount: 50,
                      penaltyFee: 1.5,
                      enabled: true,
                    },
              )
            }
          >
            Create custom lock
          </GradientButton>
        }
      />
      {loading ? (
        <LoadingSkeleton type="list" />
      ) : (
        <div className="space-y-3">
          {periods.map((period) => (
            <LockPeriodAdminRow
              key={period._id}
              period={period}
              onEdit={() => onUpdate(period._id, { ...period })}
              onDelete={() => onDelete(period._id)}
              onToggle={() => onUpdate(period._id, { ...period, enabled: !period.enabled })}
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}
