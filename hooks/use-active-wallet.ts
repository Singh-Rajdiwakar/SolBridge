"use client";

import { useMemo } from "react";
import type { Signer } from "@solana/web3.js";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { getRetixKeypair } from "@/lib/retix-wallet";
import { useWalletStore } from "@/store/wallet-store";

export function useActiveWallet() {
  const { connection } = useConnection();
  const externalWallet = useWallet();
  const {
    retixPublicKey,
    encryptedSecretKey,
    preferredWallet,
    setConnectModalOpen,
    createRetixWallet,
    importRetixWallet,
    connectRetixWallet,
    disconnectRetixWallet,
    selectExternalWallet,
    exportPrivateKey,
  } = useWalletStore();

  const hasExternalWallet = Boolean(externalWallet.publicKey && externalWallet.connected);
  const useRetix = Boolean(retixPublicKey) && (preferredWallet === "retix" || !hasExternalWallet);
  const address = useRetix
    ? retixPublicKey
    : externalWallet.publicKey?.toBase58() || (preferredWallet === "retix" ? retixPublicKey : null);
  const publicKey = useMemo(() => (address ? new PublicKey(address) : null), [address]);

  async function signTransactionOnly(transaction: Transaction) {
    if (!publicKey) {
      throw new Error("Connect a wallet first.");
    }

    if (useRetix) {
      if (!encryptedSecretKey) {
        throw new Error("Retix Wallet is not available.");
      }

      const retixKeypair = getRetixKeypair(encryptedSecretKey);
      transaction.partialSign(retixKeypair);
      return transaction;
    }

    if (!externalWallet.signTransaction) {
      throw new Error("Connected wallet cannot sign transactions.");
    }

    return externalWallet.signTransaction(transaction);
  }

  async function signAllTransactionsOnly(transactions: Transaction[]) {
    if (useRetix) {
      if (!encryptedSecretKey) {
        throw new Error("Retix Wallet is not available.");
      }

      const retixKeypair = getRetixKeypair(encryptedSecretKey);
      transactions.forEach((transaction) => transaction.partialSign(retixKeypair));
      return transactions;
    }

    if (externalWallet.signAllTransactions) {
      return externalWallet.signAllTransactions(transactions);
    }

    if (!externalWallet.signTransaction) {
      throw new Error("Connected wallet cannot sign transactions.");
    }

    return Promise.all(transactions.map((transaction) => externalWallet.signTransaction!(transaction)));
  }

  async function signAndSendTransaction(transaction: Transaction, extraSigners: Signer[] = []) {
    if (!publicKey) {
      throw new Error("Connect a wallet first.");
    }

    const latestBlockhash = await connection.getLatestBlockhash("confirmed");
    transaction.feePayer = transaction.feePayer || publicKey;
    transaction.recentBlockhash = transaction.recentBlockhash || latestBlockhash.blockhash;

    extraSigners.forEach((signer) => transaction.partialSign(signer));
    const signature = useRetix
      ? await connection.sendRawTransaction((await signTransactionOnly(transaction)).serialize(), {
          skipPreflight: false,
        })
      : await (async () => {
          if (!externalWallet.sendTransaction) {
            throw new Error("Connected wallet cannot send transactions.");
          }

          return externalWallet.sendTransaction(transaction, connection, {
            skipPreflight: false,
            signers: extraSigners,
          });
        })();

    await connection.confirmTransaction(
      {
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      "confirmed",
    );

    return signature;
  }

  return {
    connection,
    address,
    publicKey,
    connected: Boolean(publicKey),
    providerName: useRetix ? "Retix Wallet" : externalWallet.wallet?.adapter.name || null,
    isRetixWallet: useRetix,
    anchorWallet:
      publicKey
        ? {
            publicKey,
            signTransaction: signTransactionOnly,
            signAllTransactions: signAllTransactionsOnly,
          }
        : null,
    availableWallets: externalWallet.wallets,
    externalWallet,
    openConnectModal: () => setConnectModalOpen(true),
    closeConnectModal: () => setConnectModalOpen(false),
    createRetixWallet,
    importRetixWallet,
    connectRetixWallet,
    disconnectRetixWallet,
    selectExternalWallet,
    exportPrivateKey,
    signAndSendTransaction,
  };
}
