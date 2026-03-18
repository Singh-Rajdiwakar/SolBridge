import type { AdminLog } from "@/types";

import { EmptyState, GlassCard, LoadingSkeleton, SectionHeader } from "@/components/shared";
import { formatDate } from "@/utils/format";

export function AdminActivityTimeline({
  logs,
  loading,
}: {
  logs: AdminLog[];
  loading?: boolean;
}) {
  return (
    <GlassCard>
      <SectionHeader title="Admin Actions History" subtitle="Audit timeline of admin actions." />
      {loading ? (
        <LoadingSkeleton type="list" />
      ) : logs.length > 0 ? (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log._id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-medium text-white">{log.action}</div>
                  <div className="mt-1 text-sm text-slate-400">
                    {log.adminId?.name || "System"} · {log.entityType}
                  </div>
                </div>
                <div className="text-sm text-slate-500">{formatDate(log.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No admin logs" description="Critical actions will appear here." />
      )}
    </GlassCard>
  );
}
