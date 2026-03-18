"use client";

import { TopNavbar as BaseTopNavbar } from "@/components/layout/top-navbar";
import type { User } from "@/types";

export function TopNavbar({
  activeTab,
  user,
  onNavigate,
}: {
  activeTab: string;
  user: User;
  onNavigate: (tab: string) => void;
}) {
  void activeTab;
  void user;
  void onNavigate;
  return <BaseTopNavbar />;
}
