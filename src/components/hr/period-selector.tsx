"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { formatPeriodLabel } from "@/lib/hr/framework-reference";
import { Input } from "@/components/ui/input";

type PeriodSelectorProps = {
  period: string;
};

export function PeriodSelector({ period }: PeriodSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    <div className="space-y-1">
      <label className="sr-only" htmlFor="overview-period">
        Performance period
      </label>
      <Input
        id="overview-period"
        type="month"
        value={period}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-[11.5rem]"
        title={formatPeriodLabel(period)}
      />
    </div>
  );
}
