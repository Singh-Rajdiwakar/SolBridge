import { GradientButton } from "@/components/shared";

export function VoteActionButtons({
  disabled,
  onYes,
  onNo,
  onAbstain,
}: {
  disabled?: boolean;
  onYes: () => void;
  onNo: () => void;
  onAbstain: () => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <GradientButton disabled={disabled} onClick={onYes}>
        Vote Yes
      </GradientButton>
      <GradientButton disabled={disabled} variant="secondary" onClick={onNo}>
        Vote No
      </GradientButton>
      <GradientButton disabled={disabled} variant="secondary" onClick={onAbstain}>
        Abstain
      </GradientButton>
    </div>
  );
}
