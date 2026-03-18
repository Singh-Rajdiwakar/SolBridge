import { redirect } from "next/navigation";

export default function SocialTrendingPage() {
  redirect("/dashboard/social?tab=trending");
}
