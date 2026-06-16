import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type OverviewActionTileProps = {
  icon: ReactNode;
  label: string;
  count: number;
  href: string;
  iconClassName?: string;
};

export function OverviewActionTile({
  icon,
  label,
  count,
  href,
  iconClassName,
}: OverviewActionTileProps) {
  return (
    <article className="flex h-[104px] flex-col justify-between rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-5 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
            iconClassName
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-2xl leading-none font-semibold tracking-tight text-[#0f172a] tabular-nums">{count}</p>
          <p className="mt-2 whitespace-nowrap text-[11px] font-medium leading-tight text-[#1e293b]">{label}</p>
        </div>
      </div>
      <div className="ml-[55px]">
        <Link
          href={href}
          className="text-xs font-medium text-[#006ce5] transition-colors hover:text-[#0057b8]"
        >
          View all
        </Link>
      </div>
    </article>
  );
}
