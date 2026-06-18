"use client";

import { StatusBadge } from "@/components/hr/status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/animated-accordion";
import { Button } from "@/components/ui/button";
import { humanizeLabel } from "@/lib/labels";
import type { HRLeaveRequest, HRPayrollAnomaly, HRPayrollCycle } from "@/lib/types";
import { HR_LEAVE_REQUEST_STATUSES, HR_PAYROLL_STATUSES } from "@/lib/types";

const selectClass =
  "h-8 w-full rounded-[var(--radius-input)] border border-input bg-card px-2 text-xs text-foreground outline-none focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/30";

const accordionEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

type PayrollCyclesAccordionProps = {
  payrollCycles: HRPayrollCycle[];
  updateCycleStatusAction: (formData: FormData) => void | Promise<void>;
};

export function PayrollCyclesAccordion({
  payrollCycles,
  updateCycleStatusAction,
}: PayrollCyclesAccordionProps) {
  if (payrollCycles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No payroll cycles yet. Create one above.</p>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]"
    >
      {payrollCycles.map((cycle) => (
        <AccordionItem
          key={cycle.id}
          value={String(cycle.id)}
          className="border-[var(--color-rule)] px-3 last:border-b-0"
        >
          <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[var(--color-rule)]">
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 pr-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                {cycle.cycle_month}
              </span>
              <span className="text-xs text-muted-foreground">
                Processed {cycle.processed_at ?? "n/a"}
              </span>
              <StatusBadge status={cycle.status} />
            </div>
          </AccordionTrigger>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            {cycle.notes ? (
              <p className="mb-3 text-xs text-muted-foreground">{cycle.notes}</p>
            ) : null}
            <form action={updateCycleStatusAction} className="flex flex-wrap items-center gap-2">
              <input name="cycleId" type="hidden" value={cycle.id} />
              <select
                className={selectClass}
                defaultValue={cycle.status}
                name="status"
              >
                {HR_PAYROLL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanizeLabel(status)}
                  </option>
                ))}
              </select>
              <Button size="sm" type="submit" variant="outline">
                Save status
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

type LeaveRequestsAccordionProps = {
  leaveRequests: HRLeaveRequest[];
  updateLeaveStatusAction: (formData: FormData) => void | Promise<void>;
};

export function LeaveRequestsAccordion({
  leaveRequests,
  updateLeaveStatusAction,
}: LeaveRequestsAccordionProps) {
  if (leaveRequests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No leave requests yet. Create one above.</p>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]"
    >
      {leaveRequests.map((leaveRequest) => (
        <AccordionItem
          key={leaveRequest.id}
          value={String(leaveRequest.id)}
          className="border-[var(--color-rule)] px-3 last:border-b-0"
        >
          <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[var(--color-rule)]">
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 pr-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                {leaveRequest.leave_type}
              </span>
              <span className="text-xs text-muted-foreground">
                {leaveRequest.start_date} to {leaveRequest.end_date} · {leaveRequest.days} day(s)
              </span>
              <StatusBadge status={leaveRequest.status} />
            </div>
          </AccordionTrigger>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            <form action={updateLeaveStatusAction} className="flex flex-wrap items-center gap-2">
              <input name="leaveRequestId" type="hidden" value={leaveRequest.id} />
              <select
                className={selectClass}
                defaultValue={leaveRequest.status}
                name="status"
              >
                {HR_LEAVE_REQUEST_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanizeLabel(status)}
                  </option>
                ))}
              </select>
              <Button size="sm" type="submit" variant="outline">
                Save status
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

type PayrollAnomaliesAccordionProps = {
  payrollAnomalies: HRPayrollAnomaly[];
  updateAnomalyStatusAction: (formData: FormData) => void | Promise<void>;
};

export function PayrollAnomaliesAccordion({
  payrollAnomalies,
  updateAnomalyStatusAction,
}: PayrollAnomaliesAccordionProps) {
  if (payrollAnomalies.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No payroll issues yet. Report one above.</p>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]"
    >
      {payrollAnomalies.map((anomaly) => (
        <AccordionItem
          key={anomaly.id}
          value={String(anomaly.id)}
          className="border-[var(--color-rule)] px-3 last:border-b-0"
        >
          <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[var(--color-rule)]">
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 pr-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                {anomaly.anomaly_type}
              </span>
              <StatusBadge status={anomaly.status} />
            </div>
          </AccordionTrigger>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            <p className="mb-3 text-xs text-muted-foreground">
              {anomaly.details ?? "No details"}
            </p>
            <form action={updateAnomalyStatusAction} className="flex flex-wrap items-center gap-2">
              <input name="anomalyId" type="hidden" value={anomaly.id} />
              <select
                className={selectClass}
                defaultValue={anomaly.status}
                name="status"
              >
                <option value="open">{humanizeLabel("open")}</option>
                <option value="resolved">{humanizeLabel("resolved")}</option>
              </select>
              <Button size="sm" type="submit" variant="outline">
                Save status
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
