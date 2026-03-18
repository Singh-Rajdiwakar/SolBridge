"use client";

import type { ComponentProps } from "react";

import { SecurityHudPanel } from "@/components/wallet/SecurityHudPanel";

export function SecurityHudCard(props: ComponentProps<typeof SecurityHudPanel>) {
  return <SecurityHudPanel {...props} />;
}
