"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/utils/cn";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-xl border border-[rgba(224,185,75,0.12)] bg-[rgba(21,24,27,0.92)] px-3 text-sm text-[#f6f3ed] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition focus:border-[rgba(242,201,76,0.34)] focus:ring-2 focus:ring-[rgba(242,201,76,0.14)]",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown className="h-4 w-4 text-[#c9c4bb]" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          "z-50 overflow-hidden rounded-xl border border-[rgba(224,185,75,0.14)] bg-[rgba(14,15,16,0.98)] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex cursor-default select-none items-center rounded-lg py-2 pl-9 pr-3 text-sm text-[#f6f3ed] outline-none transition focus:bg-[rgba(255,255,255,0.06)]",
        className,
      )}
      {...props}
    >
      <span className="absolute left-3">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4 text-[#f2c94c]" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}
