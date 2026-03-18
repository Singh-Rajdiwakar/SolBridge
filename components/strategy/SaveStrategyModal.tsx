"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function SaveStrategyModal({
  open,
  onOpenChange,
  defaultName,
  defaultNotes,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName: string;
  defaultNotes: string;
  saving: boolean;
  onSave: (payload: { name: string; notes: string }) => void;
}) {
  const [name, setName] = useState(defaultName);
  const [notes, setNotes] = useState(defaultNotes);

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setNotes(defaultNotes);
    }
  }, [defaultName, defaultNotes, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Strategy Plan</DialogTitle>
          <DialogDescription>
            Persist this strategy configuration so it can be reloaded, compared, and reused later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">Strategy Name</div>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Balanced Growth" />
          </div>
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">Notes</div>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Why this mix exists, what assumptions it relies on, and when to use it."
              className="min-h-[140px]"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => onSave({ name: name.trim(), notes: notes.trim() })} disabled={!name.trim() || saving}>
              {saving ? "Saving..." : "Save Strategy"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
