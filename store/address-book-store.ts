"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AddressBookEntry } from "@/types";

interface AddressBookState {
  entries: AddressBookEntry[];
  addEntry: (payload: Omit<AddressBookEntry, "id">) => void;
  updateEntry: (id: string, payload: Partial<Omit<AddressBookEntry, "id">>) => void;
  removeEntry: (id: string) => void;
  markUsed: (id: string) => void;
}

export const useAddressBookStore = create<AddressBookState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: ({ name, address, network, lastUsedAt }) =>
        set((state) => ({
          entries: [
            {
              id: `${Date.now()}-${address}`,
              name,
              address,
              network: network || "Devnet",
              lastUsedAt: lastUsedAt || new Date().toISOString(),
            },
            ...state.entries.filter((entry) => entry.address !== address),
          ],
        })),
      updateEntry: (id, payload) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, ...payload } : entry,
          ),
        })),
      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        })),
      markUsed: (id) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, lastUsedAt: new Date().toISOString() } : entry,
          ),
        })),
    }),
    {
      name: "solanablocks-address-book",
    },
  ),
);
