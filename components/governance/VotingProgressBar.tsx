import { formatNumber, formatPercent } from "@/utils/format";

export function VotingProgressBar({
  yes,
  no,
  abstain,
  quorum,
  totalVotes,
}: {
  yes: number;
  no: number;
  abstain: number;
  quorum: number;
  totalVotes: number;
}) {
  const safeTotal = totalVotes || yes + no + abstain || 1;
  const yesPercent = (yes / safeTotal) * 100;
  const noPercent = (no / safeTotal) * 100;
  const abstainPercent = (abstain / safeTotal) * 100;
  const quorumProgress = Math.min(100, totalVotes > 0 ? (totalVotes / quorum) * 100 : 0);

  return (
    <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>Voting distribution</span>
        <span>{formatNumber(totalVotes)} total votes</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div className="flex h-full">
          <div className="bg-emerald-400" style={{ width: `${yesPercent}%` }} />
          <div className="bg-rose-400" style={{ width: `${noPercent}%` }} />
          <div className="bg-slate-400" style={{ width: `${abstainPercent}%` }} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Yes</div>
          <div className="mt-2 text-lg font-semibold text-white">{formatPercent(yesPercent)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">No</div>
          <div className="mt-2 text-lg font-semibold text-white">{formatPercent(noPercent)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Abstain</div>
          <div className="mt-2 text-lg font-semibold text-white">{formatPercent(abstainPercent)}</div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
          <span>Quorum progress</span>
          <span>{formatPercent(quorumProgress)}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${quorumProgress}%` }} />
        </div>
      </div>
    </div>
  );
}
