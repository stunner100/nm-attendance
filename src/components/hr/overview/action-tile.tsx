import Link from "next/link";

type OverviewActionTileProps = {
  label: string;
  count: number;
  href: string;
};

export function OverviewActionTile({ label, count, href }: OverviewActionTileProps) {
  return (
    <article className="flex min-h-[104px] flex-col justify-between rounded-[var(--radius-card)] border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-4">
      <div className="min-w-0">
        <p className="text-2xl font-medium leading-none tabular-nums text-[var(--color-ink)]">
          {count}
        </p>
        <p className="mt-2 text-xs font-medium leading-tight text-[var(--color-ink-2)]">{label}</p>
      </div>
      <div>
        <Link href={href} className="text-link text-xs font-medium whitespace-nowrap">
          View all
        </Link>
      </div>
    </article>
  );
}
