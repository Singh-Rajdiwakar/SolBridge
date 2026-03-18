import type { WalletContextState } from "@solana/wallet-adapter-react";
import type { PublicKey, Transaction } from "@solana/web3.js";

export type AnchorWalletLike = {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
};

export function isAnchorWalletLike(wallet?: Partial<AnchorWalletLike> | null): wallet is AnchorWalletLike {
  return Boolean(wallet?.publicKey && wallet?.signTransaction && wallet?.signAllTransactions);
}

export function createReadonlyWallet(publicKey: PublicKey): AnchorWalletLike {
  return {
    publicKey,
    signTransaction: async (transaction) => transaction,
    signAllTransactions: async (transactions) => transactions,
  };
}

export function fromWalletAdapter(wallet: WalletContextState): AnchorWalletLike | null {
  if (!wallet.publicKey || !wallet.signTransaction) {
    return null;
  }

  return {
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction,
    signAllTransactions:
      wallet.signAllTransactions ||
      (async (transactions) => Promise.all(transactions.map((transaction) => wallet.signTransaction!(transaction)))),
  };
}

