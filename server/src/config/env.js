import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "super-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  solanaRpcUrl: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  walletEncryptionSecret:
    process.env.WALLET_ENCRYPTION_SECRET || "retix-wallet-encryption-secret-change-me",
  stakingProgramId:
    process.env.STAKING_PROGRAM_ID || "ALnc8ohCRM5WMD4yksGS9XuZDzGCH3vW2VHUzn9Rb762",
  governanceProgramId:
    process.env.GOVERNANCE_PROGRAM_ID || "7e4gvpizQZ12dGWHFXekKrrX8ByktwvV3t48HnG9xBNz",
  liquidityProgramId:
    process.env.LIQUIDITY_PROGRAM_ID || "9bGvKgjuKiuXrr6C4yGyzn9yGn4GSoGUdBEmMjssUzCu",
  lendingProgramId:
    process.env.LENDING_PROGRAM_ID || "HPvxx9GvKzBqBPDSrxALtnwnEhY52mnV9aNM6XPisuCh",
  nodeEnv: process.env.NODE_ENV || "development",
};
