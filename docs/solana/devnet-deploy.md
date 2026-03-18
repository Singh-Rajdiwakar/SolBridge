# Solana Devnet Deploy Guide

This workspace now contains an Anchor scaffold for the protocol modules below:

- `programs/staking_program`
- `programs/governance_program`
- `programs/liquidity_program`
- `programs/lending_program`

## Prerequisites

- Rust toolchain
- Solana CLI
- Anchor CLI
- A funded Devnet deployer wallet at `~/.config/solana/id.json`

## Commands

Install frontend dependencies:

```bash
npm install
```

Build programs:

```bash
npm run anchor:build
```

Run Anchor tests:

```bash
npm run anchor:test
```

Deploy to Devnet:

```bash
npm run anchor:deploy
```

## Frontend Wiring

After deployment, copy the resulting config PDA addresses into `.env.local`:

```env
NEXT_PUBLIC_STAKING_CONFIG_ADDRESS=
NEXT_PUBLIC_GOVERNANCE_CONFIG_ADDRESS=
NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=
NEXT_PUBLIC_LENDING_MARKET_ADDRESS=
```

The dashboard pages read these values to decide whether the protocol is fully deployed or still running in scaffold/fallback mode.

## Explorer Verification

Use Solana Explorer with the `devnet` cluster for:

- program IDs
- config PDAs
- stake position PDAs
- pool accounts
- lending positions
- proposal and vote accounts

Every page now surfaces these links directly in the UI.
