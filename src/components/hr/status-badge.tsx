import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { humanizeLabel } from "@/lib/labels";

type StatusBadgeProps = {
  status: string | null | undefined;
};

function statusTone(status: string): string {
  const normalized = status.trim().toLowerCase();

  if (
    [
      "completed",
      "processed",
      "approved",
      "resolved",
      "active",
      "hired",
      "on_time",
      "done",
      "on_track",
    ].includes(normalized)
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    ["pending", "in_progress", "screened", "interviewed", "assigned", "open", "at_risk"].includes(
      normalized
    )
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    ["rejected", "escalated", "issues_flagged", "failed", "late", "terminated", "warning_issued", "delayed"].includes(
      normalized
    )
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-300 bg-slate-50 text-slate-700";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const value = status?.trim() || "unknown";
  return (
    <Badge
      variant="outline"
      className={cn("h-5 min-w-[88px] justify-center rounded-[5px] px-2 text-[11px] font-semibold capitalize leading-none", statusTone(value))}
    >
      {humanizeLabel(value)}
    </Badge>
  );
}
