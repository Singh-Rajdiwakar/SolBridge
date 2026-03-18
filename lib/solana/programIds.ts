import { PublicKey } from "@solana/web3.js";

export const STAKING_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_STAKING_PROGRAM_ID || "ALnc8ohCRM5WMD4yksGS9XuZDzGCH3vW2VHUzn9Rb762",
);
export const GOVERNANCE_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_GOVERNANCE_PROGRAM_ID || "7e4gvpizQZ12dGWHFXekKrrX8ByktwvV3t48HnG9xBNz",
);
export const LIQUIDITY_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_LIQUIDITY_PROGRAM_ID || "9bGvKgjuKiuXrr6C4yGyzn9yGn4GSoGUdBEmMjssUzCu",
);
export const LENDING_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_LENDING_PROGRAM_ID || "HPvxx9GvKzBqBPDSrxALtnwnEhY52mnV9aNM6XPisuCh",
);

export const PROGRAM_CONFIG_ADDRESSES = {
  staking: process.env.NEXT_PUBLIC_STAKING_CONFIG_ADDRESS,
  governance: process.env.NEXT_PUBLIC_GOVERNANCE_CONFIG_ADDRESS,
  liquidity: process.env.NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS,
  lending: process.env.NEXT_PUBLIC_LENDING_MARKET_ADDRESS,
} as const;

export const PROGRAM_IDS = {
  staking: STAKING_PROGRAM_ID,
  governance: GOVERNANCE_PROGRAM_ID,
  liquidity: LIQUIDITY_PROGRAM_ID,
  lending: LENDING_PROGRAM_ID,
} as const;
