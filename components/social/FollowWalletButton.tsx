"use client";

import { UserPlus, UserRoundCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useFollowWallet } from "@/hooks/useFollowWallet";

export function FollowWalletButton({
  walletAddress,
  isFollowing,
  disabled,
}: {
  walletAddress: string;
  isFollowing?: boolean;
  disabled?: boolean;
}) {
  const follow = useFollowWallet(walletAddress);

  return (
    <Button
      variant={isFollowing ? "secondary" : "default"}
      onClick={() => (isFollowing ? follow.unfollow() : follow.follow())}
      disabled={disabled || follow.isPending}
    >
      {isFollowing ? <UserRoundCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
