"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  createRetixWalletPair,
  exportRetixPrivateKey,
  importRetixWalletPair,
} from "@/lib/retix-wallet";

type PreferredWallet = "retix" | "external" | null;

interface WalletState {
  retixPublicKey: string | null;
  encryptedSecretKey: string | null;
  preferredWallet: PreferredWallet;
  connectModalOpen: boolean;
  setConnectModalOpen: (open: boolean) => void;
  createRetixWallet: () => string;
  importRetixWallet: (privateKey: string) => string;
  connectRetixWallet: () => void;
  disconnectRetixWallet: () => void;
  selectExternalWallet: () => void;
  exportPrivateKey: () => string | null;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      retixPublicKey: null,
      encryptedSecretKey: null,
      preferredWallet: null,
      connectModalOpen: false,
      setConnectModalOpen: (open) => set({ connectModalOpen: open }),
      createRetixWallet: () => {
        const wallet = createRetixWalletPair();
        set({
          retixPublicKey: wallet.publicKey,
          encryptedSecretKey: wallet.encryptedSecretKey,
          preferredWallet: "retix",
          connectModalOpen: false,
        });
        return wallet.publicKey;
      },
      importRetixWallet: (privateKey) => {
        const wallet = importRetixWalletPair(privateKey);
        set({
          retixPublicKey: wallet.publicKey,
          encryptedSecretKey: wallet.encryptedSecretKey,
          preferredWallet: "retix",
          connectModalOpen: false,
        });
        return wallet.publicKey;
      },
      connectRetixWallet: () =>
        set((state) => ({
          preferredWallet: state.retixPublicKey ? "retix" : state.preferredWallet,
          connectModalOpen: false,
        })),
      disconnectRetixWallet: () =>
        set((state) => ({
          preferredWallet: state.preferredWallet === "retix" ? null : state.preferredWallet,
        })),
      selectExternalWallet: () => set({ preferredWallet: "external", connectModalOpen: false }),
      exportPrivateKey: () => {
        const encryptedSecretKey = get().encryptedSecretKey;
        if (!encryptedSecretKey) {
          return null;
        }

        return exportRetixPrivateKey(encryptedSecretKey);
      },
    }),
    {
      name: "solanablocks-wallet",
      partialize: (state) => ({
        retixPublicKey: state.retixPublicKey,
        encryptedSecretKey: state.encryptedSecretKey,
        preferredWallet: state.preferredWallet,
      }),
    },
  ),
);
