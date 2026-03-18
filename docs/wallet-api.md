# Retix Wallet Backend API

All wallet routes require `Authorization: Bearer <jwt>`.

## Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Success shape:

```json
{
  "success": true,
  "data": {}
}
```

Error shape:

```json
{
  "success": false,
  "message": "Validation failed"
}
```

## Wallet Accounts

- `GET /api/wallet/account`
  Returns the user wallet account summary. Creates a Retix wallet if one does not exist.
- `POST /api/wallet/account/create`
  Explicitly creates a Retix wallet account.
- `POST /api/wallet/account/import`
  Imports a wallet from a private key and stores the encrypted key server-side.

## Wallet Data

- `GET /api/wallet/balance`
  Query: `address?`, `provider?`
- `GET /api/wallet/portfolio`
  Query: `address?`, `provider?`
- `GET /api/wallet/transactions`
  Query: `address?`, `page?`, `limit?`
- `GET /api/wallet/nfts`
  Query: `address?`
- `GET /api/wallet/insights`
  Query: `address?`

## Security + AI

- `POST /api/security/check-transaction`
- `GET /api/security/wallet-score`
- `GET /api/security/alerts`
- `GET /api/gas/optimize`
- `POST /api/simulator/transaction`
- `POST /api/ai/portfolio-advice`

Example fraud-check payload:

```json
{
  "walletAddress": "senderPublicKey",
  "receiverAddress": "recipientPublicKey",
  "amount": 0.5,
  "token": "SOL"
}
```

Example simulator payload:

```json
{
  "kind": "send",
  "walletAddress": "senderPublicKey",
  "receiverAddress": "recipientPublicKey",
  "amount": 0.5,
  "token": "SOL"
}
```

Example AI advice payload:

```json
{
  "portfolio": [
    { "symbol": "SOL", "balance": 8.4, "value": 1280.16, "change24h": 4.2 },
    { "symbol": "USDC", "balance": 420, "value": 420, "change24h": 0.1 }
  ],
  "historicalData": [
    { "label": "Mon", "value": 1420.5 },
    { "label": "Tue", "value": 1455.1 }
  ]
}
```

## Wallet Actions

- `POST /api/wallet/send`
  Body:

```json
{
  "address": "senderPublicKey",
  "receiverAddress": "recipientPublicKey",
  "amount": 0.1,
  "signature": "optionalClientSignature",
  "provider": "Retix Wallet"
}
```

- `POST /api/wallet/airdrop`
  Body:

```json
{
  "address": "walletPublicKey",
  "amount": 1
}
```

- `POST /api/wallet/swap`
  Body:

```json
{
  "address": "walletPublicKey",
  "fromToken": "SOL",
  "toToken": "USDC",
  "amount": 0.5,
  "slippage": 0.5,
  "mode": "preview"
}
```

- `POST /api/wallet/create-token`
  Body:

```json
{
  "address": "walletPublicKey",
  "name": "Retix Token",
  "symbol": "RTX",
  "decimals": 9,
  "initialSupply": 1000000
}
```

## Address Book

- `GET /api/address-book`
- `POST /api/address-book`
- `PUT /api/address-book/:id`
- `DELETE /api/address-book/:id`

Example payload:

```json
{
  "name": "Treasury Vault",
  "walletAddress": "publicKey",
  "network": "Devnet",
  "notes": "Protocol treasury"
}
```

## Notes

- Devnet RPC defaults to `https://api.devnet.solana.com`
- Retix private keys are encrypted with `WALLET_ENCRYPTION_SECRET`
- Transaction explorer links are returned for non-simulated signatures
- Swap execution is simulated for Devnet and records a wallet transaction
- Wallet transactions now carry confidence score and risk metadata when available
