import type { AddLiquidityInput, Pool } from "@/types";

import { ConfirmActionModal } from "@/components/shared";

export function AddLiquidityModal({
  open,
  onClose,
  pool,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  pool: Pool | null;
  onSubmit: (data: AddLiquidityInput) => void;
  loading?: boolean;
}) {
  return (
    <ConfirmActionModal
      open={open}
      onClose={onClose}
      title="Add Liquidity"
      description={`Confirm liquidity for ${pool?.pair || "selected pool"}.`}
      loading={loading}
      onConfirm={() => {
        if (pool) {
          onSubmit({ poolId: pool._id, amountA: 5, amountB: 750 });
        }
      }}
    />
  );
}
