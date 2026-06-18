"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { Calendar } from "lucide-react";

import { formatPeriodLabel } from "@/lib/hr/framework-reference";
import { Input } from "@/components/ui/input";

type PeriodSelectorProps = {
  period: string;
};

export function PeriodSelector({ period }: PeriodSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("period", value);
    } else {
      params.delete("period");
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="relative">
      <label className="sr-only" htmlFor="overview-period">
        Performance period
      </label>
      <button
        type="button"
        onClick={() => inputRef.current?.showPicker()}
        className="flex h-9 min-w-[11rem] items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 text-xs font-medium text-[var(--color-ink-2)]"
      >
        <span className="whitespace-nowrap">{formatPeriodLabel(period)}</span>
        <Calendar className="h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
      </button>
      <Input
        ref={inputRef}
        id="overview-period"
        type="month"
        value={period}
        onChange={(event) => onChange(event.target.value)}
        className="pointer-events-none absolute inset-0 h-9 w-full opacity-0"
        title={formatPeriodLabel(period)}
      />
    </div>
  );
}
