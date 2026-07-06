"use client";

import { PayrollLeaveFilterInputs, type PayrollLeaveFilterProps } from "@/components/hr/payroll-leave-filter-inputs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { humanizeLabel } from "@/lib/labels";
import {
  LEAVE_ENTITLEMENT_TIERS,
  type HREmployeeLeaveOverview,
} from "@/lib/hr/leave-entitlement";
import { CalendarDays, Users } from "lucide-react";

type LeaveBalanceOverviewProps = PayrollLeaveFilterProps & {
  rows: HREmployeeLeaveOverview[];
  applyAllTenureEntitlementsAction: (formData: FormData) => void | Promise<void>;
  applyTenureEntitlementAction: (formData: FormData) => void | Promise<void>;
};

function formatDays(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function remainingTone(remaining: number): string {
  if (remaining <= 0) {
    return "border-[var(--color-rule)] bg-[var(--color-signature-cream)] text-[var(--color-destructive)]";
  }
  if (remaining <= 3) {
    return "border-[var(--color-rule)] bg-[var(--color-signature-yellow)]/35 text-[var(--color-ink)]";
  }
  return "border-[var(--color-rule)] bg-[var(--color-signature-mint)]/40 text-[var(--color-success)]";
}

export function LeaveBalanceOverview({
  rows,
  applyAllTenureEntitlementsAction,
  applyTenureEntitlementAction,
  cycleStatus,
  leaveStatus,
}: LeaveBalanceOverviewProps) {
  const totalRemaining = rows.reduce((sum, row) => sum + row.remaining_days, 0);
  const unallocatedCount = rows.filter((row) => !row.is_allocated).length;
  const outOfSyncCount = rows.filter(
    (row) => row.is_allocated && !row.allocation_matches_tenure
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)] p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-4 w-4" />
            Active employees
          </div>
          <p className="mt-1 text-2xl font-medium text-foreground">{rows.length}</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)] p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            Total days remaining
          </div>
          <p className="mt-1 text-2xl font-medium text-foreground">
            {formatDays(totalRemaining)}
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)] p-4">
          <p className="text-xs text-muted-foreground">Needs allocation review</p>
          <p className="mt-1 text-2xl font-medium text-foreground">
            {unallocatedCount + outOfSyncCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {unallocatedCount} unallocated · {outOfSyncCount} tenure mismatch
          </p>
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)] p-4">
        <p className="text-sm font-medium text-foreground">Tenure-based annual entitlement</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Allocations follow time at company. First-year staff receive a pro-rated share of 15
          days. Used days reflect approved leave taken this calendar year.
        </p>
        <ul className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
          {LEAVE_ENTITLEMENT_TIERS.map((tier) => (
            <li key={tier.label}>
              <span className="font-medium text-foreground">{tier.label}:</span>{" "}
              {tier.minYears === 0 && tier.maxYears === 1
                ? "15 days (pro-rated by months served)"
                : `${tier.annualDays} days / year`}
            </li>
          ))}
        </ul>
        <form action={applyAllTenureEntitlementsAction} className="mt-4">
          <PayrollLeaveFilterInputs cycleStatus={cycleStatus} leaveStatus={leaveStatus} />
          <Button size="sm" type="submit">
            Apply tenure entitlements to all active staff
          </Button>
        </form>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active employees found.</p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-rule)]">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-[var(--color-paper)]">
              <tr className="border-b border-[var(--color-rule)] text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Employee</th>
                <th className="px-3 py-2 font-medium">Department</th>
                <th className="px-3 py-2 font-medium">Hire date</th>
                <th className="px-3 py-2 font-medium">Tenure</th>
                <th className="px-3 py-2 font-medium">Entitlement</th>
                <th className="px-3 py-2 font-medium">Allocated</th>
                <th className="px-3 py-2 font-medium">Used (YTD)</th>
                <th className="px-3 py-2 font-medium">Carry</th>
                <th className="px-3 py-2 font-medium">Remaining</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  className="border-b border-[var(--color-rule)] last:border-b-0"
                  key={row.employee_id}
                >
                  <td className="px-3 py-2 font-medium text-foreground">{row.full_name}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {humanizeLabel(row.department)}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{row.hire_date}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.tenure_label}</td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {formatDays(row.recommended_annual_days)} days
                      </p>
                      <p className="text-xs text-muted-foreground">{row.entitlement_tier}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {row.is_allocated ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{formatDays(row.annual_days)}</span>
                        {!row.allocation_matches_tenure ? (
                          <Badge
                            className="h-5 rounded-[var(--radius-sm)] px-2 text-[10px] font-medium"
                            variant="outline"
                          >
                            Review
                          </Badge>
                        ) : null}
                      </div>
                    ) : (
                      <Badge
                        className="h-5 rounded-[var(--radius-sm)] px-2 text-[10px] font-medium"
                        variant="outline"
                      >
                        Not set
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {formatDays(row.approved_used_ytd)}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {formatDays(row.carry_days)}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      className={`h-6 min-w-[52px] justify-center rounded-[var(--radius-sm)] px-2 text-xs font-medium ${remainingTone(row.remaining_days)}`}
                      variant="outline"
                    >
                      {formatDays(row.remaining_days)}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <form action={applyTenureEntitlementAction} className="inline">
                      <PayrollLeaveFilterInputs
                        cycleStatus={cycleStatus}
                        leaveStatus={leaveStatus}
                      />
                      <input name="employeeId" type="hidden" value={row.employee_id} />
                      <Button size="sm" type="submit" variant="outline">
                        Apply tenure
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
