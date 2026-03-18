# SolanaBlocks

SolanaBlocks is a full-stack Web3 DeFi dashboard with a premium sharp dark interface for staking, liquidity pools, lending, borrowing, governance voting, and admin controls.

## Stack

- Frontend: Next.js 15 App Router, TypeScript, Tailwind CSS, Shadcn-style UI primitives, Recharts, TanStack Query, Zustand, React Hook Form, Zod
- Backend: Node.js, Express, MongoDB, Mongoose, JWT auth
- Data/UI: TanStack Table, Sonner toasts, Lucide icons

## Pages

- `/dashboard/stake`
- `/dashboard/wallet`
- `/dashboard/pools`
- `/dashboard/borrow`
- `/dashboard/governance`
- `/dashboard/admin`
- `/dashboard/trading`
- `/dashboard/markets`
- `/login`
- `/register`

## Features

- JWT authentication with persisted session
- Retix Wallet Pro backend with wallet account records, portfolio, NFT metadata, swap simulation, address book, wallet insights, AI fraud detection, gas optimization, wallet risk scoring, and portfolio advice
- Backend mirror and analytics layer for transaction indexing, admin observability, governance metadata, alerts, portfolio snapshots, watchlists, and cached dashboard summaries
- Protected dashboard routes and admin-only access
- Staking create, calculate, claim, and unstake flows
- Pool search, sort, simulation, add/remove liquidity, and fee history
- Lending supply, withdraw, borrow, repay, risk analysis, and simulation
- Governance proposal listing, voting, vesting view, reward claim, and proposal creation
- Admin settings management, lock-period CRUD, emergency actions, audit logs, and system health
- Seeded realistic mock financial data
- Responsive sharp rectangular dashboard shell

## Project Structure

### Frontend

```text
app/
components/
  admin/
  governance/
  layout/
  lending/
  pools/
  shared/
  staking/
lib/
services/
store/
types/
utils/
```

### Backend

```text
server/src/
  config/
  controllers/
  jobs/
  lib/
  middlewares/
  models/
  routes/
  scripts/
  services/
  utils/
  validators/
```

## Environment

Create these files from the examples:

- `.env.local`
- `server/.env`

Frontend example:

```env
NEXT_PUBLIC_API_URL=/api/proxy
API_PROXY_TARGET=http://127.0.0.1:4000
```

Backend example:

```env
PORT=4000
JWT_SECRET=super-secret-change-me
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
MONGODB_URI=
SOLANA_RPC_URL=https://api.devnet.solana.com
WALLET_ENCRYPTION_SECRET=change-me
```

If `MONGODB_URI` is blank, the backend falls back to an in-memory MongoDB instance for local development.

## Install

```bash
npm install
npm --prefix server install
```

## Run

Start frontend and backend together:

```bash
npm run dev
```

Frontend only:

```bash
npm run dev:web
```

Backend only:

```bash
npm run dev:server
```

## Seed Data

Seed the backend:

```bash
npm run server:seed
```

Seeded accounts:

- User: `demo@solanablocks.io` / `Demo123!`
- Admin: `admin@solanablocks.io` / `Admin123!`

Seed now also includes:

- linked wallets and user preferences
- mirrored wallet transactions
- governance metadata records
- alerts and watchlist entries
- cached market snapshots
- portfolio snapshots
- protocol health + job run records
- sample admin audit logs

## Backend API Surface

Primary backend groups:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/user/profile`
- `GET /api/user/watchlist`
- `PUT /api/user/preferences`
- `GET /api/transactions`
- `POST /api/transactions/sync`
- `GET /api/governance/metadata/:proposalPubkey`
- `POST /api/governance/metadata`
- `GET /api/alerts`
- `GET /api/analytics/wallet/:walletAddress`
- `GET /api/analytics/protocol`
- `GET /api/dashboard/summary/:walletAddress`
- `GET /api/dashboard/admin-summary`
- `GET /api/admin/overview`
- `GET /api/admin/jobs`
- `GET /api/admin/protocol-health`

Architecture rule:

- Solana on-chain state remains the source of truth for protocol actions
- Backend records are mirrored, cached, or metadata-oriented and should be treated as such

## Build

```bash
npm run build
```

## Backend Jobs

Manual backend cache/indexer tasks:

```bash
npm run server:sync:markets
npm run server:sync:transactions
npm run server:sync:governance
npm run server:analytics:rebuild
```

Direct server equivalents:

```bash
npm --prefix server run sync:markets
npm --prefix server run sync:transactions
npm --prefix server run sync:governance
npm --prefix server run analytics:rebuild
```

## Notes

- Frontend API requests go through the Next.js proxy at `/api/proxy`
- The dashboard uses the premium rectangular design system defined in `app/globals.css`
- Extra component architecture notes are in `docs/component-architecture.md`
- Wallet/backend API notes are in `docs/wallet-api.md`
- Backend mirror/analytics notes are in `docs/backend-api.md`
- Solana program deployment notes are in `docs/solana/devnet-deploy.md`

## Solana Programs

Anchor workspace paths:

```text
programs/
  staking_program/
  governance_program/
  liquidity_program/
  lending_program/
tests/
migrations/
```

Root scripts:

```bash
npm run anchor:build
npm run anchor:test
npm run anchor:deploy
npm run idl:copy
```

The frontend uses `lib/solana/*` plus `services/*ProgramService.ts` to surface program IDs, config PDAs, explorer links, and on-chain-ready transaction builders alongside the existing REST fallback flows.

Current workspace scope:

- `staking_program`: SPL-token staking with lock periods, reward claims, pause controls, and PDA stake positions
- `governance_program`: token-weighted proposals, vote records, quorum-based finalization, and config updates
- `liquidity_program`: simplified AMM pools with LP minting, removals, swaps, fee controls, and pause state
- `lending_program`: collateral deposits, borrowing, repayments, withdrawals, liquidation, and market controls

Anchor build note:

- `cargo check --workspace` currently passes
- full `anchor build` may still require local Solana platform-tools permissions on Windows before SBF artifacts can be produced
