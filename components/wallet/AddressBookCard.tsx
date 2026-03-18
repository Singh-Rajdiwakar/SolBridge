"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Plus, SendHorizontal, Trash2, UserRound } from "lucide-react";

import { FormField, GlassCard, SectionHeader } from "@/components/shared";
import { EmptyStateBlock } from "@/components/wallet/EmptyStateBlock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AddressBookEntry } from "@/types";
import { formatDate } from "@/utils/format";

export function AddressBookCard({
  entries,
  onAdd,
  onEdit,
  onDelete,
  onQuickSend,
}: {
  entries: AddressBookEntry[];
  onAdd: (payload: { name: string; address: string; network?: string }) => void;
  onEdit: (id: string, payload: { name: string; address: string; network?: string }) => void;
  onDelete: (id: string) => void;
  onQuickSend: (entry: AddressBookEntry) => void;
}) {
  const [draft, setDraft] = useState({ name: "", address: "", network: "Devnet" });
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <GlassCard>
      <SectionHeader
        title="Address Book"
        subtitle="Trusted contacts with quick-send actions, recent usage, and inline editing."
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditingId("new");
              setDraft({ name: "", address: "", network: "Devnet" });
            }}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        }
      />

      {editingId ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl border border-cyan-400/14 bg-[linear-gradient(180deg,rgba(34,211,238,0.08),rgba(255,255,255,0.02))] p-4"
        >
          <div className="grid gap-3">
            <FormField label="Contact name" htmlFor="address-book-name">
              <Input
                id="address-book-name"
                value={draft.name}
                onChange={(event) => setDraft((state) => ({ ...state, name: event.target.value }))}
                className="border-white/10 bg-[#0b1324]/90 focus-visible:border-cyan-300/30 focus-visible:ring-cyan-400/20"
              />
            </FormField>
            <FormField label="Wallet address" htmlFor="address-book-address">
              <Input
                id="address-book-address"
                value={draft.address}
                onChange={(event) => setDraft((state) => ({ ...state, address: event.target.value }))}
                className="border-white/10 bg-[#0b1324]/90 focus-visible:border-cyan-300/30 focus-visible:ring-cyan-400/20"
              />
            </FormField>
            <FormField label="Network" htmlFor="address-book-network">
              <Input
                id="address-book-network"
                value={draft.network}
                onChange={(event) => setDraft((state) => ({ ...state, network: event.target.value }))}
                className="border-white/10 bg-[#0b1324]/90 focus-visible:border-cyan-300/30 focus-visible:ring-cyan-400/20"
              />
            </FormField>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  if (editingId === "new") {
                    onAdd(draft);
                  } else {
                    onEdit(editingId, draft);
                  }
                  setEditingId(null);
                  setDraft({ name: "", address: "", network: "Devnet" });
                }}
              >
                Save Contact
              </Button>
              <Button variant="secondary" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}

      {entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              whileHover={{ y: -2 }}
              className="rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-cyan-400/16 bg-cyan-400/10 text-sm font-semibold text-cyan-100">
                    {(entry.name || entry.address).slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">{entry.name}</div>
                    <div className="mt-1 truncate text-sm text-slate-400">{entry.address}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                      <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1">
                        {entry.network || "Devnet"}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-slate-600" />
                      <span>{entry.lastUsedAt ? `Used ${formatDate(entry.lastUsedAt)}` : "Not used yet"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => onQuickSend(entry)}>
                    <SendHorizontal className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingId(entry.id);
                      setDraft({
                        name: entry.name,
                        address: entry.address,
                        network: entry.network || "Devnet",
                      });
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => onDelete(entry.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyStateBlock
          title="No contacts saved"
          description="Trusted wallets, counterparties, and frequently used destinations will appear here for faster and safer sends."
          icon={<UserRound className="h-5 w-5" />}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditingId("new");
                setDraft({ name: "", address: "", network: "Devnet" });
              }}
            >
              <Plus className="h-4 w-4" />
              Add first contact
            </Button>
          }
        />
      )}
    </GlassCard>
  );
}
