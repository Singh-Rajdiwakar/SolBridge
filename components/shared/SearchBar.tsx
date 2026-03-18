import { SearchInput } from "@/components/dashboard/search-input";

export function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return <SearchInput value={value} onChange={onChange} placeholder={placeholder} />;
}
