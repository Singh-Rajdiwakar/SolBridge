import { GradientButton } from "@/components/shared";

export function ClaimRewardsButton({
  stakeId,
  claimableAmount,
  onClaim,
  loading,
}: {
  stakeId: string;
  claimableAmount: number;
  onClaim: (stakeId: string) => void;
  loading?: boolean;
}) {
  return (
    <GradientButton onClick={() => onClaim(stakeId)} disabled={claimableAmount <= 0} loading={loading}>
      Claim {claimableAmount.toFixed(4)}
    </GradientButton>
  );
}
