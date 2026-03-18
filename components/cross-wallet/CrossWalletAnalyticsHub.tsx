"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Layers3, Shield, Sparkles, Wallet } from "lucide-react";
import { toast } from "sonner";

import { AddTrackedWalletModal } from "@/components/cross-wallet/AddTrackedWalletModal";
import { CrossWalletActivityHeatmap } from "@/components/cross-wallet/CrossWalletActivityHeatmap";
import { CrossWalletHeader } from "@/components/cross-wallet/CrossWalletHeader";
import { CrossWalletPnLChart } from "@/components/cross-wallet/CrossWalletPnLChart";
import { CrossWalletRiskCard } from "@/components/cross-wallet/CrossWalletRiskCard";
import { DiversityIndexCard } from "@/components/cross-wallet/DiversityIndexCard";
import { TrackedWalletCard } from "@/components/cross-wallet/TrackedWalletCard";
import { WalletComparisonTable } from "@/components/cross-wallet/WalletComparisonTable";
import { WalletExposureChart } from "@/components/cross-wallet/WalletExposureChart";
import { WhaleActivityPanel } from "@/components/cross-wallet/WhaleActivityPanel";
import { SectionCard } from "@/components/dashboard/section-card";
import { crossWalletApi } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { formatCompactCurrency } from "@/utils/format";

export function CrossWalletAnalyticsHub() {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const linkedWallets = authUser?.linkedWallets || [];

  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [timeframe, setTimeframe] = useState("7D");
  const [modalMode, setModalMode] = useState<"wallet" | "group">("wallet");
  const [modalOpen, setModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");

  const groupsQuery = useQuery({
    queryKey: ["cross-wallet", "groups"],
    queryFn: crossWalletApi.groups,
  });

  useEffect(() => {
    const firstGroupId = groupsQuery.data?.[0]?._id;
    if (firstGroupId && (!selectedGroupId || !groupsQuery.data?.some((group) => group._id === selectedGroupId))) {
      setSelectedGroupId(firstGroupId);
    }
  }, [groupsQuery.data, selectedGroupId]);

  const summaryQuery = useQuery({
    queryKey: ["cross-wallet", "summary", selectedGroupId],
    queryFn: () => crossWalletApi.summary(selectedGroupId),
    enabled: Boolean(selectedGroupId),
  });

  const pnlQuery = useQuery({
    queryKey: ["cross-wallet", "pnl", selectedGroupId],
    queryFn: () => crossWalletApi.pnl(selectedGroupId),
    enabled: Boolean(selectedGroupId),
  });

  const riskQuery = useQuery({
    queryKey: ["cross-wallet", "risk", selectedGroupId],
    queryFn: () => crossWalletApi.risk(selectedGroupId),
    enabled: Boolean(selectedGroupId),
  });

  const diversityQuery = useQuery({
    queryKey: ["cross-wallet", "diversity", selectedGroupId],
    queryFn: () => crossWalletApi.diversity(selectedGroupId),
    enabled: Boolean(selectedGroupId),
  });

  const activityQuery = useQuery({
    queryKey: ["cross-wallet", "activity", selectedGroupId],
    queryFn: () => crossWalletApi.activity(selectedGroupId),
    enabled: Boolean(selectedGroupId),
  });

  const whaleQuery = useQuery({
    queryKey: ["cross-wallet", "whale", selectedGroupId],
    queryFn: () => crossWalletApi.whaleSignals(selectedGroupId),
    enabled: Boolean(selectedGroupId),
  });

  const createGroupMutation = useMutation({
    mutationFn: crossWalletApi.createGroup,
    onSuccess: async (group) => {
      await queryClient.invalidateQueries({ queryKey: ["cross-wallet"] });
      setSelectedGroupId(group._id);
      toast.success("Wallet group created");
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Failed to create group"),
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ groupId, payload }: { groupId: string; payload: Parameters<typeof crossWalletApi.updateGroup>[1] }) =>
      crossWalletApi.updateGroup(groupId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cross-wallet"] });
      toast.success("Tracked wallet updated");
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Failed to update tracked wallet group"),
  });

  const exportMutation = useMutation({
    mutationFn: ({ groupId, format }: { groupId: string; format: "csv" | "json" }) => crossWalletApi.exportGroup(groupId, format),
    onSuccess: (result) => {
      const blob = new Blob([result.content], { type: result.format === "csv" ? "text/csv;charset=utf-8" : "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Cross-wallet analytics exported");
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Export failed"),
  });

  const selectedGroup = groupsQuery.data?.find((group) => group._id === selectedGroupId);

  const filteredPnl = useMemo(() => {
    if (!pnlQuery.data) {
      return undefined;
    }

    const count = timeframe === "24H" ? 2 : timeframe === "7D" ? 7 : 30;
    return {
      ...pnlQuery.data,
      trend: pnlQuery.data.trend.slice(-count),
    };
  }, [pnlQuery.data, timeframe]);

  const summaryCards = useMemo(
    () =>
      summaryQuery.data
        ? [
            { label: "Wallets Tracked", value: String(summaryQuery.data.walletsTracked), icon: Wallet },
            { label: "Aggregated Value", value: formatCompactCurrency(summaryQuery.data.aggregatedValue), icon: Layers3 },
            { label: "Total PnL", value: formatCompactCurrency(summaryQuery.data.totalPnl), icon: Activity, tone: summaryQuery.data.totalPnl >= 0 ? "text-emerald-300" : "text-rose-300" },
            { label: "Average Risk", value: `${summaryQuery.data.averageRiskScore}/100`, icon: Shield },
            { label: "Diversity", value: `${summaryQuery.data.diversityIndex}/100`, icon: Sparkles },
            { label: "Whale Flags", value: String(summaryQuery.data.whaleFlagCount), icon: Activity, tone: summaryQuery.data.whaleFlagCount > 0 ? "text-amber-300" : "text-cyan-200" },
          ]
        : [],
    [summaryQuery.data],
  );

  return (
    <div className="space-y-6">
      <CrossWalletHeader
        groups={groupsQuery.data || []}
        selectedGroupId={selectedGroupId}
        timeframe={timeframe}
        exportFormat={exportFormat}
        onExportFormatChange={setExportFormat}
        onSelectGroup={setSelectedGroupId}
        onTimeframeChange={setTimeframe}
        onOpenAddWallet={() => {
          setModalMode("wallet");
          setModalOpen(true);
        }}
        onOpenCreateGroup={() => {
          setModalMode("group");
          setModalOpen(true);
        }}
        onExport={() => {
          if (!selectedGroupId) {
            toast.error("Select a wallet group first");
            return;
          }
          exportMutation.mutate({ groupId: selectedGroupId, format: exportFormat });
        }}
        exportLoading={exportMutation.isPending}
      />

      {summaryQuery.data ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {summaryCards.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </div>
                <div className={`mt-3 text-2xl font-semibold ${item.tone || "text-white"}`}>{item.value}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <SectionCard title="Cross-Wallet Summary" description="Select or create a wallet group to begin aggregate analysis.">
          <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
            No cross-wallet group selected yet. Create a group or add a wallet to start comparing portfolio intelligence across addresses.
          </div>
        </SectionCard>
      )}

      {summaryQuery.data ? (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            {summaryQuery.data.wallets.map((wallet) => (
              <TrackedWalletCard key={wallet.walletAddress} wallet={wallet} />
            ))}
          </div>

          <SectionCard title="Wallet Comparison Panel" description="Compare current value, PnL, risk, diversity, exposure, and recent activity across each tracked wallet.">
            <WalletComparisonTable wallets={summaryQuery.data.wallets} />
          </SectionCard>

          <CrossWalletPnLChart data={filteredPnl} />

          <div className="grid gap-6 xl:grid-cols-2">
            <CrossWalletRiskCard data={riskQuery.data} />
            <DiversityIndexCard data={diversityQuery.data} />
          </div>

          <WalletExposureChart data={summaryQuery.data} />
          <CrossWalletActivityHeatmap data={activityQuery.data} />
          <WhaleActivityPanel data={whaleQuery.data} />

          <SectionCard
            title="Best / Worst Wallet Signals"
            description="Quick highlights for recruiter-friendly portfolio intelligence storytelling."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-emerald-200">Best Performer</div>
                <div className="mt-3 text-lg font-semibold text-white">{summaryQuery.data.bestPerformer?.walletLabel || "No signal"}</div>
                <div className="mt-1 text-sm text-emerald-200">
                  {summaryQuery.data.bestPerformer ? formatCompactCurrency(summaryQuery.data.bestPerformer.pnl) : "Waiting for PnL history"}
                </div>
              </div>
              <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-rose-200">Highest Drawdown</div>
                <div className="mt-3 text-lg font-semibold text-white">{summaryQuery.data.worstPerformer?.walletLabel || "No signal"}</div>
                <div className="mt-1 text-sm text-rose-200">
                  {summaryQuery.data.worstPerformer ? formatCompactCurrency(summaryQuery.data.worstPerformer.pnl) : "Waiting for PnL history"}
                </div>
              </div>
            </div>
          </SectionCard>
        </>
      ) : null}

      <AddTrackedWalletModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        linkedWallets={linkedWallets}
        existingAddresses={selectedGroup?.wallets.map((wallet) => wallet.address) || []}
        onCreateGroup={async (payload) => {
          await createGroupMutation.mutateAsync(payload);
        }}
        onAddWallet={async (payload) => {
          if (!selectedGroupId || !selectedGroup) {
            toast.error("Create or select a group first");
            return;
          }

          await updateGroupMutation.mutateAsync({
            groupId: selectedGroupId,
            payload: {
              wallets: [
                ...selectedGroup.wallets,
                payload,
              ],
            },
          });
        }}
      />
    </div>
  );
}
