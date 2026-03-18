# Backend API Notes

## Source of Truth

- Solana programs and on-chain accounts remain the protocol source of truth.
- MongoDB stores mirrored history, cached analytics, user preferences, watchlists, alerts, admin audit logs, and governance metadata.
- Backend responses that summarize protocol state should be treated as cache or mirror layers, not authoritative chain state.

## Main Route Groups

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### User

- `GET /api/user/profile`
- `GET /api/user/watchlist`
- `POST /api/user/watchlist`
- `DELETE /api/user/watchlist/:symbol`
- `GET /api/user/preferences`
- `PUT /api/user/preferences`
- `POST /api/user/linked-wallets`

### Transactions Mirror

- `GET /api/transactions`
- `GET /api/transactions/:signature`
- `POST /api/transactions/sync`

### Governance Metadata

- `GET /api/governance/metadata/:proposalPubkey`
- `POST /api/governance/metadata`
- `PUT /api/governance/metadata/:proposalPubkey`

### Alerts

- `GET /api/alerts`
- `POST /api/alerts`
- `PUT /api/alerts/:id`
- `DELETE /api/alerts/:id`

### Portfolio Snapshots

- `GET /api/portfolio/snapshots/:walletAddress`
- `POST /api/portfolio/snapshot/rebuild`

### Analytics

- `GET /api/analytics/wallet/:walletAddress`
- `GET /api/analytics/staking/:walletAddress`
- `GET /api/analytics/liquidity/:walletAddress`
- `GET /api/analytics/lending/:walletAddress`
- `GET /api/analytics/governance/:walletAddress`
- `GET /api/analytics/protocol`

### Dashboard Cache

- `GET /api/dashboard/summary/:walletAddress`
- `GET /api/dashboard/admin-summary`

### Admin Monitoring

- `GET /api/admin/overview`
- `GET /api/admin/logs`
- `POST /api/admin/logs`
- `GET /api/admin/jobs`
- `GET /api/admin/protocol-health`

## Jobs

Manual sync scripts:

- `npm --prefix server run sync:markets`
- `npm --prefix server run sync:transactions`
- `npm --prefix server run sync:governance`
- `npm --prefix server run analytics:rebuild`

Tracked jobs:

- `sync-market-prices`
- `sync-transactions`
- `sync-governance`
- `snapshot-portfolio`
- `compute-protocol-analytics`
