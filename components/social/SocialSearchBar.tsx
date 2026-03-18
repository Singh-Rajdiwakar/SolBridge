"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SocialSearchBar({
  query,
  tag,
  sort,
  onQueryChange,
  onTagChange,
  onSortChange,
  onSubmit,
}: {
  query: string;
  tag: string;
  sort: "trending" | "followers" | "value";
  onQueryChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onSortChange: (value: "trending" | "followers" | "value") => void;
  onSubmit: () => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1.6fr_0.8fr_0.8fr_auto]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search wallet address, profile name, badge, or tag" className="pl-10" />
      </div>
      <Input value={tag} onChange={(event) => onTagChange(event.target.value)} placeholder="Filter tag" />
      <Select value={sort} onValueChange={onSortChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="trending">Trending</SelectItem>
          <SelectItem value="followers">Followers</SelectItem>
          <SelectItem value="value">Portfolio Value</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={onSubmit}>Search</Button>
    </div>
  );
}
