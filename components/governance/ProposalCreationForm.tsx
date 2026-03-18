"use client";

import { useEffect, useState } from "react";

import { EmptyState, GlassCard, GradientButton, SectionHeader } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreateProposalInput } from "@/types";

export function ProposalCreationForm({
  onSubmit,
  loading,
  enabled = true,
}: {
  onSubmit: (data: CreateProposalInput) => void;
  loading?: boolean;
  enabled?: boolean;
}) {
  const [form, setForm] = useState<CreateProposalInput>({
    title: "",
    category: "",
    description: "",
    startDate: "",
    endDate: "",
    quorum: 60,
  });

  useEffect(() => {
    const start = new Date();
    const end = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
    setForm((current) => ({
      ...current,
      startDate: current.startDate || start.toISOString().slice(0, 16),
      endDate: current.endDate || end.toISOString().slice(0, 16),
    }));
  }, []);

  if (!enabled) {
    return (
      <GlassCard>
        <SectionHeader title="Proposal Creation Form" subtitle="Only eligible proposers can publish governance actions." />
        <EmptyState title="Proposer access required" description="Increase voting power or use an admin account to publish a new proposal." />
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <SectionHeader
        title="Proposal Creation Form"
        subtitle="Allows eligible users or admins to create a proposal with title, category, markdown description, dates, and quorum."
      />

      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="proposal-title">Proposal title</Label>
          <Input
            id="proposal-title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="proposal-category">Category</Label>
          <Input
            id="proposal-category"
            value={form.category}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="proposal-description">Markdown description</Label>
          <Textarea
            id="proposal-description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="proposal-start">Start date</Label>
          <Input
            id="proposal-start"
            type="datetime-local"
            value={form.startDate}
            onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="proposal-end">End date</Label>
          <Input
            id="proposal-end"
            type="datetime-local"
            value={form.endDate}
            onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="proposal-quorum">Minimum quorum</Label>
          <Input
            id="proposal-quorum"
            type="number"
            min="1"
            value={form.quorum}
            onChange={(event) => setForm((current) => ({ ...current, quorum: Number(event.target.value) }))}
          />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <GradientButton type="submit" loading={loading}>
            Publish Proposal
          </GradientButton>
        </div>
      </form>
    </GlassCard>
  );
}
