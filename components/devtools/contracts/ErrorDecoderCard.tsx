"use client";

export function ErrorDecoderCard({ error }: { error: string | null }) {
  if (!error) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
        Friendly error decoding appears here after failed simulation or execution.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-rose-400/16 bg-rose-400/6 p-4">
      <div className="text-sm font-semibold text-rose-200">Readable Error Summary</div>
      <div className="mt-2 text-sm leading-6 text-rose-100/90">{error}</div>
      <div className="mt-3 text-xs text-rose-200/70">
        Check account resolution, admin authority, wallet token accounts, and current on-chain protocol state.
      </div>
    </div>
  );
}
