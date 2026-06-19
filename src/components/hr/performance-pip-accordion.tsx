"use client";

import { StatusBadge } from "@/components/hr/status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/animated-accordion";
import { Button } from "@/components/ui/button";
import { DeleteRecordForm } from "@/components/hr/delete-record-form";
import { Input } from "@/components/ui/input";
import type { HREmployeeOption } from "@/lib/hr/shared";
import { humanizeLabel } from "@/lib/labels";
import type { HRPip } from "@/lib/types";
import { HR_PIP_STATUSES } from "@/lib/types";

const selectClass =
  "h-8 w-full rounded-[var(--radius-input)] border border-input bg-card px-2 text-xs text-foreground outline-none focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/30";

const accordionEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

type PerformancePipAccordionProps = {
  pips: HRPip[];
  employeeOptions: HREmployeeOption[];
  updatePipStatusAction: (formData: FormData) => void | Promise<void>;
  deletePipAction: (formData: FormData) => void | Promise<void>;
};

function employeeName(
  employeeId: number,
  employeeOptions: HREmployeeOption[]
): string {
  return (
    employeeOptions.find((employee) => employee.id === employeeId)?.full_name ??
    `Employee #${employeeId}`
  );
}

export function PerformancePipAccordion({
  pips,
  employeeOptions,
  updatePipStatusAction,
  deletePipAction,
}: PerformancePipAccordionProps) {
  if (pips.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No improvement plans active.</p>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]"
    >
      {pips.map((pip) => (
        <AccordionItem
          key={pip.id}
          value={String(pip.id)}
          className="border-[var(--color-rule)] px-3 last:border-b-0"
        >
          <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[var(--color-rule)]">
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 pr-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                {employeeName(pip.employee_id, employeeOptions)}
              </span>
              <span className="text-xs text-muted-foreground">
                Started {pip.start_date}
                {pip.end_date ? ` → ${pip.end_date}` : ""}
              </span>
              <StatusBadge status={pip.status} />
            </div>
          </AccordionTrigger>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            {pip.progress_note ? (
              <p className="mb-3 text-xs text-muted-foreground">{pip.progress_note}</p>
            ) : null}
            <form
              action={updatePipStatusAction}
              className="flex flex-wrap items-center gap-2"
            >
              <input name="pipId" type="hidden" value={pip.id} />
              <select
                className={selectClass}
                defaultValue={pip.status}
                name="status"
              >
                {HR_PIP_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanizeLabel(status)}
                  </option>
                ))}
              </select>
              <Input
                className="h-8 w-40 text-xs"
                name="progressNote"
                placeholder="Progress note"
                defaultValue={pip.progress_note ?? ""}
              />
              <Button size="sm" type="submit" variant="outline">
                Save status
              </Button>
            </form>
            <div className="mt-3">
              <DeleteRecordForm
                action={deletePipAction}
                confirmMessage="Delete this improvement plan?"
                recordId={pip.id}
                recordIdFieldName="pipId"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
