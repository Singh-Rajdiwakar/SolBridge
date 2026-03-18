import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
      <div className="mb-4 rounded-md border border-cyan-400/10 bg-cyan-400/10 p-4">
        <Inbox className="h-6 w-6 text-cyan-300" />
      </div>
      <div className="text-lg font-semibold text-white">{title}</div>
      <p className="mt-2 max-w-sm text-sm text-slate-400">{description}</p>
    </div>
  );
}
