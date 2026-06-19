import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: LucideIcon;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon: Icon = Inbox,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-dashed border-[var(--color-rule)] bg-[var(--color-paper-2)] p-6 text-center",
        className
      )}
    >
      <Icon
        className="mx-auto mb-3 h-8 w-8 text-[var(--color-ink-muted)]"
        aria-hidden
      />
      <p className="text-sm font-medium text-[var(--color-ink)]">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{description}</p>
      ) : null}
      {actionLabel && actionHref ? (
        <Button asChild className="mt-4" size="sm" variant="outline">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
