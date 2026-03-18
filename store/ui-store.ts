"use client";

import { create } from "zustand";

interface UiState {
  activePoolId: string | null;
  activeProposalId: string | null;
  setActivePoolId: (value: string | null) => void;
  setActiveProposalId: (value: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activePoolId: null,
  activeProposalId: null,
  setActivePoolId: (value) => set({ activePoolId: value }),
  setActiveProposalId: (value) => set({ activeProposalId: value }),
}));
