# SolanaBlocks Component Architecture

This document tracks the production-style React component surface used by the SolanaBlocks dashboard.

## Global Shared Components

- `AppShell`
- `TopNavbar`
- `MobileNavSheet`
- `PageHeader`
- `StatCard`
- `GlassCard`
- `GlassPanel`
- `SectionHeader`
- `GradientButton`
- `StatusBadge`
- `RoleBadge`
- `TokenBadge`
- `SearchBar`
- `FilterTabs`
- `DataTable`
- `EmptyState`
- `LoadingSkeleton`
- `ConfirmActionModal`
- `ConfirmModal`
- `ChartCard`
- `FormField`
- `MetricStrip`
- `ActivityList`

## Staking Components

- `StakeStatsGrid`
- `StakeMetricCard`
- `PortfolioOverviewCard`
- `RewardsCalculatorCard`
- `LockPeriodGrid`
- `LockPeriodCard`
- `TransactionHistoryCard`
- `StakeModal`
- `ClaimRewardsButton`

## Admin Components

- `AdminSettingsPanel`
- `RewardRateForm`
- `LockPeriodManager`
- `LockPeriodAdminRow`
- `EmergencyControlsPanel`
- `EmergencyActionButton`
- `AdminActivityTimeline`
- `SystemHealthCards`
- `AdminUsersTable`

## Pools Components

- `PoolsStatsGrid`
- `PoolsTable`
- `PoolRow`
- `PoolSimulationCard`
- `MyPositionsCard`
- `FeeEarningsChart`
- `AddLiquidityModal`
- `RemoveLiquidityModal`

## Lending Components

- `LendingStatsGrid`
- `SupportedAssetsTable`
- `SupplyBorrowPanel`
- `PositionSummaryCard`
- `HealthFactorGauge`
- `LiquidationRiskCard`
- `BorrowSimulationCard`
- `LendingActivityTable`
- `LendingActionModal`

## Governance Components

- `GovernanceStatsGrid`
- `ProposalFilters`
- `ProposalList`
- `ProposalCard`
- `ProposalDetailPanel`
- `VotingProgressBar`
- `VestingDetailsCard`
- `ProposalCreationForm`
- `MyVotesHistoryTable`
- `VoteActionButtons`

## Build Order

1. `AppShell`
2. shared UI primitives
3. staking page
4. pools page
5. borrow page
6. governance page
7. admin page
8. backend API integration
9. charts and motion polish
10. responsive QA

## Component Generation Prompt

Create a production-ready React component for a premium dark Web3 dashboard using Next.js, TypeScript, Tailwind CSS, Shadcn UI, and subtle motion. The component should use glassmorphism styling, deep navy backgrounds, electric blue glow highlights, rounded 2xl corners, thin borders, responsive layout, and clean reusable typing. Include realistic placeholder handling, loading states, empty states where relevant, and spacing suitable for a Solana-style DeFi dashboard.
