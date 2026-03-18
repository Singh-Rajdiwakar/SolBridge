import { FilterTabs } from "@/components/shared";

const proposalStatusItems = [
  { label: "Active", value: "active" },
  { label: "Passed", value: "passed" },
  { label: "Rejected", value: "rejected" },
  { label: "Pending", value: "pending" },
  { label: "Archived", value: "archived" },
];

export function ProposalFilters({
  activeFilter,
  onChange,
}: {
  activeFilter: string;
  onChange: (value: string) => void;
}) {
  return <FilterTabs items={proposalStatusItems} active={activeFilter} onChange={onChange} />;
}
