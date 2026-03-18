"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { SocialHub } from "@/components/social";

export default function SocialPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = useMemo(() => {
    const tab = searchParams.get("tab");
    return ["trending", "leaderboards", "following", "discover"].includes(tab || "") ? (tab as string) : "trending";
  }, [searchParams]);

  return (
    <SocialHub
      activeTab={activeTab}
      onTabChange={(value) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", value);
        router.replace(`/dashboard/social?${params.toString()}`);
      }}
    />
  );
}
