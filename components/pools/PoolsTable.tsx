import type { Pool } from "@/types";

import { EmptyState, GlassCard, LoadingSkeleton, SearchBar, SectionHeader } from "@/components/shared";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { PoolRow } from "@/components/pools/PoolRow";

export function PoolsTable({
  pools,
  loading,
  onSelectPool,
  search,
  onSearch,
  sortBy,
  onSortBy,
}: {
  pools: Pool[];
  loading?: boolean;
  onSelectPool: (pool: Pool) => void;
  search: string;
  onSearch: (value: string) => void;
  sortBy: string;
  onSortBy: (value: string) => void;
}) {
  return (
    <GlassCard>
      <SectionHeader
        title="Pools Table"
        subtitle="Main table of available pools."
        action={
          <div className="flex flex-col gap-3 md:flex-row">
            <SearchBar value={search} onChange={onSearch} placeholder="Search pools" />
            <FilterTabs
              items={[
                { label: "Liquidity", value: "totalLiquidity" },
                { label: "APR", value: "apr" },
                { label: "Volume", value: "volume24h" },
              ]}
              active={sortBy}
              onChange={onSortBy}
            />
          </div>
        }
      />
      {loading ? (
        <LoadingSkeleton type="table" />
      ) : pools.length > 0 ? (
        <div className="space-y-3">
          {pools.map((pool) => (
            <PoolRow key={pool._id} pool={pool} onClick={() => onSelectPool(pool)} />
          ))}
        </div>
      ) : (
        <EmptyState title="No pools found" description="Try adjusting your search or filters." />
      )}
    </GlassCard>
  );
}
