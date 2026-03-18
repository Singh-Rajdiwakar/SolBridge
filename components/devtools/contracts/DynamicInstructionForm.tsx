"use client";

import { FormField } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ContractInstructionSummary } from "@/services/contractConsoleService";

export function DynamicInstructionForm({
  instruction,
  argValues,
  onChange,
}: {
  instruction: ContractInstructionSummary | null;
  argValues: Record<string, string>;
  onChange: (name: string, value: string) => void;
}) {
  if (!instruction) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
        Select a program instruction to generate dynamic form inputs from the Anchor IDL.
      </div>
    );
  }

  if (!instruction.args.length) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
        This instruction does not require argument inputs. Review the account panel before simulation or execution.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {instruction.args.map((field) => (
        <div key={field.name} className="space-y-2">
          <FormField label={field.label} htmlFor={`contract-arg-${field.name}`}>
            {field.kind === "boolean" ? (
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-sm text-slate-300">{field.helperText || "Boolean flag"}</div>
                <Switch checked={argValues[field.name] === "true"} onCheckedChange={(checked) => onChange(field.name, checked ? "true" : "false")} />
              </div>
            ) : field.kind === "enum" ? (
              <Select value={argValues[field.name] || field.enumValues?.[0] || ""} onValueChange={(value) => onChange(field.name, value)}>
                <SelectTrigger id={`contract-arg-${field.name}`}>
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {(field.enumValues || []).map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={`contract-arg-${field.name}`}
                type={field.kind === "number" ? "number" : "text"}
                value={argValues[field.name] || ""}
                onChange={(event) => onChange(field.name, event.target.value)}
                placeholder={field.placeholder}
              />
            )}
          </FormField>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{field.rawType}</div>
        </div>
      ))}
    </div>
  );
}
