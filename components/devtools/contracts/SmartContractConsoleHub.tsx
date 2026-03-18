"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, TerminalSquare } from "lucide-react";

import { GlassCard, SectionHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useContractConsole } from "@/hooks/useContractConsole";
import { AccountsResolverPanel } from "./AccountsResolverPanel";
import { ContractConsoleHeader } from "./ContractConsoleHeader";
import { ContractOutputPanel } from "./ContractOutputPanel";
import { DynamicInstructionForm } from "./DynamicInstructionForm";
import { ErrorDecoderCard } from "./ErrorDecoderCard";
import { ExecutionResultCard } from "./ExecutionResultCard";
import { IDLInspectorPanel } from "./IDLInspectorPanel";
import { InstructionHistoryPanel } from "./InstructionHistoryPanel";
import { InstructionSelector } from "./InstructionSelector";
import { ProgramLogsViewer } from "./ProgramLogsViewer";
import { ProgramSelector } from "./ProgramSelector";
import { SavedCallsPanel } from "./SavedCallsPanel";
import { StateReaderPanel } from "./StateReaderPanel";
import { TransactionPreviewCard } from "./TransactionPreviewCard";

type PendingAction = "simulate" | "execute" | null;

export function SmartContractConsoleHub() {
  const consoleState = useContractConsole();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const needsConfirmation = Boolean(
    consoleState.selectedInstruction &&
      (consoleState.mode === "raw" ||
        consoleState.selectedInstruction.adminOnly ||
        consoleState.selectedInstruction.cautionLevel === "danger"),
  );

  const activeLogs = useMemo(
    () => consoleState.lastExecution?.logs || consoleState.lastSimulation?.logs || [],
    [consoleState.lastExecution, consoleState.lastSimulation],
  );

  function requestAction(action: PendingAction) {
    if (!action) {
      return;
    }
    if (needsConfirmation) {
      setPendingAction(action);
      return;
    }
    if (action === "simulate") {
      consoleState.simulateMutation.mutate();
    } else {
      consoleState.executeMutation.mutate();
    }
  }

  function confirmAction() {
    if (!pendingAction) {
      return;
    }
    if (pendingAction === "simulate") {
      consoleState.simulateMutation.mutate();
    } else {
      consoleState.executeMutation.mutate();
    }
    setPendingAction(null);
  }

  return (
    <div className="space-y-6">
      <ContractConsoleHeader
        mode={consoleState.mode}
        onModeChange={consoleState.setMode}
        connected={consoleState.wallet.connected}
        walletAddress={consoleState.wallet.address}
        providerName={consoleState.wallet.providerName}
        selectedProgramLabel={consoleState.selectedProgram.label}
      />

      <div className="grid gap-6 xl:grid-cols-[22rem_1fr_26rem]">
        <div className="space-y-6">
          <GlassCard>
            <SectionHeader title="Program Selector" subtitle="Choose the deployed Anchor program to inspect and call." />
            <ProgramSelector
              programs={consoleState.programs}
              selectedProgramKey={consoleState.selectedProgramKey}
              onSelect={consoleState.setSelectedProgramKey}
            />
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Instruction Selector" subtitle="Load instruction metadata directly from the current IDL." />
            <InstructionSelector
              instructions={consoleState.instructions}
              selectedInstructionName={consoleState.selectedInstructionName}
              onSelect={consoleState.setSelectedInstructionName}
              programKey={consoleState.selectedProgramKey}
              pinnedInstructionKeys={consoleState.pinnedInstructionKeys}
              onTogglePin={consoleState.togglePinnedInstruction}
            />
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Saved Contract Calls" subtitle="Pin reusable presets for demos, testing, and repetitive admin flows." />
            <SavedCallsPanel
              savedCalls={consoleState.savedCalls}
              onSave={consoleState.saveCurrentCall}
              onLoad={consoleState.loadSavedCall}
              onDelete={consoleState.deleteSavedCall}
              onExport={consoleState.exportSavedCallPreset}
            />
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard>
            <SectionHeader
              title="Dynamic Instruction Form"
              subtitle="Generated from Anchor IDL argument types with friendly and raw interaction modes."
              action={<TerminalSquare className="h-4 w-4 text-cyan-300" />}
            />
            <DynamicInstructionForm
              instruction={consoleState.selectedInstruction}
              argValues={consoleState.argValues}
              onChange={consoleState.updateArgValue}
            />
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Accounts Resolver" subtitle="Derived PDA preview, wallet signers, vaults, token accounts, and manual overrides." />
            <AccountsResolverPanel
              accounts={consoleState.resolvedAccountsQuery.data || []}
              mode={consoleState.mode}
              overrides={consoleState.accountOverrides}
              onOverrideChange={consoleState.updateAccountOverride}
            />
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Transaction Preview" subtitle="Review payload readiness, signer context, fee estimate, and simulation controls." />
            <TransactionPreviewCard
              programLabel={consoleState.selectedProgram.label}
              instruction={consoleState.selectedInstruction}
              preview={consoleState.previewQuery.data}
              simulation={consoleState.lastSimulation}
              walletAddress={consoleState.wallet.address}
              onSimulate={() => requestAction("simulate")}
              onExecute={() => requestAction("execute")}
              onReset={consoleState.resetCurrentInstruction}
              simulating={consoleState.simulateMutation.isPending}
              executing={consoleState.executeMutation.isPending}
            />
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Execution Result" subtitle="Transaction signature, confirmation status, and explorer verification." />
            <ExecutionResultCard result={consoleState.lastExecution} />
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Outputs" subtitle="Readable output summary for created PDAs and relevant account addresses." />
            <ContractOutputPanel outputs={consoleState.lastExecution?.outputs || []} />
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Error Decoder" subtitle="Readable interpretation of Anchor and Solana execution errors." />
            <ErrorDecoderCard error={consoleState.lastError} />
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard>
            <SectionHeader title="Program Logs" subtitle="Simulation and execution logs with runtime visibility." />
            <ProgramLogsViewer logs={activeLogs} />
          </GlassCard>

          <GlassCard>
            <SectionHeader title="IDL Inspector" subtitle="Metadata, instruction counts, and IDL-defined accounts for the selected program." />
            <IDLInspectorPanel data={consoleState.idlInspector} />
          </GlassCard>

          <GlassCard>
            <SectionHeader title="State Reader" subtitle="Fetch and decode selected account state using the current program IDL." />
            <StateReaderPanel
              accountTypes={consoleState.selectedProgram.accountTypes}
              accountType={consoleState.stateReaderAccountType}
              onAccountTypeChange={consoleState.setStateReaderAccountType}
              address={consoleState.stateReaderAddress}
              onAddressChange={consoleState.setStateReaderAddress}
              state={consoleState.stateReaderQuery.data}
              loading={consoleState.stateReaderQuery.isLoading}
            />
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Instruction History" subtitle="Recent executed calls with replay support for iterative testing." />
            <InstructionHistoryPanel history={consoleState.instructionHistory} onReplay={consoleState.replayHistory} />
          </GlassCard>
        </div>
      </div>

      <Dialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-300" />
              Confirm {pendingAction === "simulate" ? "simulation" : "execution"}
            </DialogTitle>
            <DialogDescription>
              {consoleState.mode === "raw"
                ? "You are in raw mode with manual account control."
                : "This instruction may modify protocol state or require admin authority."}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <div className="font-medium text-white">
              {consoleState.selectedProgram.label} / {consoleState.selectedInstruction?.label}
            </div>
            <div className="mt-2 text-slate-400">
              Always review accounts, signer wallet, and simulation output before sending a real Devnet transaction.
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setPendingAction(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmAction}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
