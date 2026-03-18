import type { LiquidityPosition, RemoveLiquidityInput } from "@/types";

import { ConfirmActionModal } from "@/components/shared";

export function RemoveLiquidityModal({
  open,
  onClose,
  position,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  position: LiquidityPosition | null;
  onSubmit: (data: RemoveLiquidityInput) => void;
  loading?: boolean;
}) {
  return (
    <ConfirmActionModal
      open={open}
      onClose={onClose}
      title="Remove Liquidity"
      description={`Remove a portion of ${position?.pair || "this position"}.`}
      loading={loading}
      onConfirm={() => {
        if (position) {
          onSubmit({ positionId: position._id, percent: 50 });
        }
      }}
    />
  );
}
