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
    return "border-[var(--color-rule)] bg-[var(--color-signature-mint)]/40 text-[var(--color-success)]";
  }

  if (
    ["pending", "in_progress", "screened", "interviewed", "assigned", "open", "at_risk"].includes(
      normalized
    )
  ) {
    return "border-[var(--color-rule)] bg-[var(--color-signature-yellow)]/35 text-[var(--color-ink)]";
  }

  if (
    ["rejected", "escalated", "issues_flagged", "failed", "late", "terminated", "warning_issued", "delayed"].includes(
      normalized
    )
  ) {
    return "border-[var(--color-rule)] bg-[var(--color-signature-cream)] text-[var(--color-destructive)]";
  }

  return "border-border bg-muted text-muted-foreground";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const value = status?.trim() || "unknown";
  return (
    <Badge
      variant="outline"
      className={cn("h-5 min-w-[88px] justify-center rounded-[var(--radius-sm)] px-2 text-[11px] font-medium capitalize leading-none", statusTone(value))}
    >
      {humanizeLabel(value)}
    </Badge>
  );
}
