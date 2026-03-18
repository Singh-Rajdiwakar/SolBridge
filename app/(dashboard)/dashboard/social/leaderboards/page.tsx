import { redirect } from "next/navigation";

export default function SocialLeaderboardsPage() {
  redirect("/dashboard/social?tab=leaderboards");
}
