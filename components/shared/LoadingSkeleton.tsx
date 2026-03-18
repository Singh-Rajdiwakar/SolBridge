import { LoadingSkeleton as BaseLoadingSkeleton } from "@/components/dashboard/loading-skeleton";

export function LoadingSkeleton({
  type = "list",
}: {
  type?: "card" | "table" | "chart" | "list";
}) {
  const lines = type === "card" ? 2 : type === "chart" ? 3 : type === "table" ? 5 : 4;
  return <BaseLoadingSkeleton lines={lines} />;
}
