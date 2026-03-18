"use client";

import type { ComponentPropsWithoutRef } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/utils/cn";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("inline-flex rounded-xl border border-[rgba(224,185,75,0.14)] bg-[rgba(255,255,255,0.03)] p-1.5", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "rounded-lg px-4 py-2 text-sm font-medium text-[#c9c4bb] transition data-[state=active]:border data-[state=active]:border-[rgba(224,185,75,0.22)] data-[state=active]:bg-[rgba(224,185,75,0.12)] data-[state=active]:text-white",
        className,
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;
