"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TrackedWalletGroupRecord } from "@/types";

export function WalletGroupSelector({
  groups,
  value,
  onChange,
}: {
  groups: TrackedWalletGroupRecord[];
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="min-w-[14rem]">
        <SelectValue placeholder="Select wallet group" />
      </SelectTrigger>
      <SelectContent>
        {groups.map((group) => (
          <SelectItem key={group._id} value={group._id}>
            {group.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
