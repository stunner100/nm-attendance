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
        className="flex h-8 w-[184px] items-center justify-between rounded-[6px] border border-[#d7dde7] bg-white px-3 text-xs font-medium text-[#1e293b] shadow-none"
      >
        <span>{formatPeriodLabel(period)}</span>
        <Calendar className="h-3.5 w-3.5 text-[#334155]" />
      </button>
      <Input
        ref={inputRef}
        id="overview-period"
        type="month"
        value={period}
        onChange={(event) => onChange(event.target.value)}
        className="pointer-events-none absolute inset-0 h-8 w-[184px] opacity-0"
        title={formatPeriodLabel(period)}
      />
    </div>
  );
}
