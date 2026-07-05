"use client";

import { DeleteRecordForm } from "@/components/hr/delete-record-form";
import { EmptyState } from "@/components/hr/empty-state";
import {
  PayrollLeaveFilterInputs,
  type PayrollLeaveFilterProps,
} from "@/components/hr/payroll-leave-filter-inputs";
import { StatusBadge } from "@/components/hr/status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/animated-accordion";
import { Button } from "@/components/ui/button";
import type { HRPayrollCycleOption } from "@/lib/hr/payroll-leave";
import type { HREmployeeOption } from "@/lib/hr/shared";
import { humanizeLabel } from "@/lib/labels";
import type { HRLeaveRequest, HRPayrollAnomaly, HRPayrollCycle } from "@/lib/types";
import { HR_LEAVE_REQUEST_STATUSES, HR_PAYROLL_STATUSES } from "@/lib/types";
import { AlertTriangle, Calendar, Palmtree } from "lucide-react";

const selectClass =
  "h-8 w-full rounded-[var(--radius-input)] border border-input bg-card px-2 text-xs text-foreground outline-none focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/30";

const accordionEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

type PayrollCyclesAccordionProps = PayrollLeaveFilterProps & {
  payrollCycles: HRPayrollCycle[];
  updateCycleStatusAction: (formData: FormData) => void | Promise<void>;
};

export function PayrollCyclesAccordion({
  payrollCycles,
  updateCycleStatusAction,
  cycleStatus,
  leaveStatus,
}: PayrollCyclesAccordionProps) {
  if (payrollCycles.length === 0) {
    return (
      <EmptyState
        description="Create a payroll cycle using the form above."
        icon={Calendar}
        title="No payroll cycles yet"
      />
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
              <PayrollLeaveFilterInputs cycleStatus={cycleStatus} leaveStatus={leaveStatus} />
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

type LeaveRequestsAccordionProps = PayrollLeaveFilterProps & {
  employeeOptions: HREmployeeOption[];
  leaveRequests: HRLeaveRequest[];
  updateLeaveStatusAction: (formData: FormData) => void | Promise<void>;
  deleteLeaveRequestAction: (formData: FormData) => void | Promise<void>;
};

export function LeaveRequestsAccordion({
  employeeOptions,
  leaveRequests,
  updateLeaveStatusAction,
  deleteLeaveRequestAction,
  cycleStatus,
  leaveStatus,
}: LeaveRequestsAccordionProps) {
  if (leaveRequests.length === 0) {
    return (
      <EmptyState
        description="Submit a leave request using the form above."
        icon={Palmtree}
        title="No leave requests yet"
      />
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
                {employeeOptions.find((employee) => employee.id === leaveRequest.employee_id)
                  ?.full_name ?? `Employee #${leaveRequest.employee_id}`}
              </span>
              <span className="text-xs text-muted-foreground">
                {leaveRequest.leave_type} · {leaveRequest.start_date} to {leaveRequest.end_date}
                {leaveRequest.request_category === "late_arrival" && leaveRequest.late_arrival_time
                  ? ` · arriving ${leaveRequest.late_arrival_time.slice(0, 5)}`
                  : ` · ${leaveRequest.days} day(s)`}
              </span>
              <StatusBadge status={leaveRequest.status} />
            </div>
          </AccordionTrigger>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            <div className="mb-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <p>
                <span className="font-medium text-foreground">Reason:</span>{" "}
                {leaveRequest.reason ?? "No reason provided"}
              </p>
              <p>
                <span className="font-medium text-foreground">Coverage:</span>{" "}
                {leaveRequest.coverage_plan ?? "No coverage note"}
              </p>
              <p>
                <span className="font-medium text-foreground">Source:</span>{" "}
                {humanizeLabel(leaveRequest.source)}
              </p>
              <p>
                <span className="font-medium text-foreground">Contact:</span>{" "}
                {leaveRequest.contact_number ?? "n/a"}
              </p>
              {leaveRequest.reviewer_note ? (
                <p className="sm:col-span-2">
                  <span className="font-medium text-foreground">Reviewer note:</span>{" "}
                  {leaveRequest.reviewer_note}
                </p>
              ) : null}
            </div>
            <div className="space-y-3">
              <form
                action={updateLeaveStatusAction}
                className="grid gap-2 sm:grid-cols-[minmax(140px,180px)_1fr_auto_auto]"
              >
                <input name="leaveRequestId" type="hidden" value={leaveRequest.id} />
                <PayrollLeaveFilterInputs cycleStatus={cycleStatus} leaveStatus={leaveStatus} />
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
                <input
                  className="h-8 rounded-[var(--radius-input)] border border-input bg-card px-2 text-xs text-foreground outline-none focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/30"
                  defaultValue={leaveRequest.reviewer_note ?? ""}
                  name="reviewerNote"
                  placeholder="Reviewer note"
                />
                <Button size="sm" type="submit" variant="outline">
                  Save status
                </Button>
                <Button
                  name="intent"
                  size="sm"
                  type="submit"
                  value={leaveRequest.status === "approved" ? "reopen" : "approve"}
                >
                  {leaveRequest.status === "approved" ? "Reopen" : "Approve"}
                </Button>
              </form>
              <DeleteRecordForm
                action={deleteLeaveRequestAction}
                confirmMessage={`Delete leave request for ${employeeOptions.find((employee) => employee.id === leaveRequest.employee_id)?.full_name ?? `employee #${leaveRequest.employee_id}`} (${leaveRequest.start_date} to ${leaveRequest.end_date})?`}
                extraFields={
                  <PayrollLeaveFilterInputs cycleStatus={cycleStatus} leaveStatus={leaveStatus} />
                }
                recordId={leaveRequest.id}
                recordIdFieldName="leaveRequestId"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

type PayrollAnomaliesAccordionProps = PayrollLeaveFilterProps & {
  employeeOptions: HREmployeeOption[];
  payrollCycleOptions: HRPayrollCycleOption[];
  payrollAnomalies: HRPayrollAnomaly[];
  updateAnomalyStatusAction: (formData: FormData) => void | Promise<void>;
};

export function PayrollAnomaliesAccordion({
  employeeOptions,
  payrollCycleOptions,
  payrollAnomalies,
  updateAnomalyStatusAction,
  cycleStatus,
  leaveStatus,
}: PayrollAnomaliesAccordionProps) {
  if (payrollAnomalies.length === 0) {
    return (
      <EmptyState
        description="Report a payroll issue using the form above."
        icon={AlertTriangle}
        title="No payroll issues yet"
      />
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]"
    >
      {payrollAnomalies.map((anomaly) => {
        const employeeName =
          anomaly.employee_id != null
            ? (employeeOptions.find((employee) => employee.id === anomaly.employee_id)
                ?.full_name ?? `Employee #${anomaly.employee_id}`)
            : null;
        const cycleMonth =
          payrollCycleOptions.find((cycle) => cycle.id === anomaly.payroll_cycle_id)
            ?.cycle_month ?? `Cycle #${anomaly.payroll_cycle_id}`;

        return (
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
                {employeeName ? (
                  <span className="text-xs text-muted-foreground">{employeeName}</span>
                ) : null}
                <span className="text-xs text-muted-foreground">{cycleMonth}</span>
                <StatusBadge status={anomaly.status} />
              </div>
            </AccordionTrigger>
            <AccordionContent transition={accordionEase} className="pb-4 pt-1">
              <p className="mb-3 text-xs text-muted-foreground">
                {anomaly.details ?? "No details"}
              </p>
              <form action={updateAnomalyStatusAction} className="flex flex-wrap items-center gap-2">
                <input name="anomalyId" type="hidden" value={anomaly.id} />
                <PayrollLeaveFilterInputs cycleStatus={cycleStatus} leaveStatus={leaveStatus} />
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
        );
      })}
    </Accordion>
  );
}
