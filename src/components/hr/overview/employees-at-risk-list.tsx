import Link from "next/link";
import { MoreVertical } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AtRiskEmployee } from "@/lib/types";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type EmployeesAtRiskListProps = {
  employees: AtRiskEmployee[];
};

export function EmployeesAtRiskList({ employees }: EmployeesAtRiskListProps) {
  return (
    <Card className="h-full min-h-[274px]">
      <CardHeader className="grid-cols-[1fr_auto] items-center">
        <CardTitle>Employees at Risk</CardTitle>
        <Link href="/admin/scores" className="text-xs font-medium text-[#006ce5] hover:text-[#0057b8]">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {employees.length === 0 ? (
          <p className="text-sm text-[#64748b]">No employees below 70 for this period.</p>
        ) : (
          employees.slice(0, 5).map((employee, index) => (
            <Link
              key={employee.id}
              href={employee.href}
              className="grid h-[44px] grid-cols-[36px_1fr_112px_20px] items-center gap-2 border-b border-[#eef2f7] text-xs transition-[background-color] last:border-b-0 hover:bg-[#f8fafc]"
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,#9a5c38,#2a1208)] text-[10px] font-semibold text-white ring-1 ring-white shadow-sm"
                style={{ filter: `hue-rotate(${index * 18}deg)` }}
              >
                {initials(employee.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#1f3a69]">{employee.full_name}</p>
                <p className="truncate text-[11px] text-[#64748b]">
                  {employee.job_title || employee.department}
                </p>
              </div>
              <div className="text-left">
                <p className="flex items-center gap-2 text-xs font-semibold tabular-nums text-[#0f172a]">
                  <span className={employee.latest_score < 65 ? "h-1.5 w-1.5 rounded-full bg-[#ff3045]" : "h-1.5 w-1.5 rounded-full bg-[#f59e0b]"} />
                  Score: {employee.latest_score.toFixed(0)}
                </p>
                <p className="pl-3.5 text-[11px] text-[#64748b]">
                  {employee.months_below_threshold} month
                  {employee.months_below_threshold === 1 ? "" : "s"} low
                </p>
              </div>
              <MoreVertical className="h-4 w-4 text-[#1f3a69]" />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
