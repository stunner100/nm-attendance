"use client";

import { StatusBadge } from "@/components/hr/status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/animated-accordion";
import { Button } from "@/components/ui/button";
import type { HREmployeeOption } from "@/lib/hr/shared";
import type { HRTrainingModuleOption } from "@/lib/hr/training";
import { humanizeLabel } from "@/lib/labels";
import type { HRTrainingAssignment } from "@/lib/types";
import { HR_TRAINING_STATUSES } from "@/lib/types";

const selectClass =
  "h-8 w-full rounded-[var(--radius-input)] border border-input bg-card px-2 text-xs text-foreground outline-none focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/30";

const accordionEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

type TrainingAssignmentAccordionProps = {
  assignments: HRTrainingAssignment[];
  employees: HREmployeeOption[];
  moduleOptions: HRTrainingModuleOption[];
  updateAssignmentStatusAction: (formData: FormData) => void | Promise<void>;
};

function employeeName(
  employeeId: number,
  employees: HREmployeeOption[]
): string {
  return (
    employees.find((employee) => employee.id === employeeId)?.full_name ??
    `Employee #${employeeId}`
  );
}

function moduleLabel(
  moduleId: number,
  moduleOptions: HRTrainingModuleOption[]
): string {
  const trainingModule = moduleOptions.find((item) => item.id === moduleId);
  return trainingModule
    ? `${trainingModule.code} - ${trainingModule.title}`
    : `Module #${moduleId}`;
}

export function TrainingAssignmentAccordion({
  assignments,
  employees,
  moduleOptions,
  updateAssignmentStatusAction,
}: TrainingAssignmentAccordionProps) {
  if (assignments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Assign a training module to an employee to get started.
      </p>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]"
    >
      {assignments.map((assignment) => (
        <AccordionItem
          key={assignment.id}
          value={String(assignment.id)}
          className="border-[var(--color-rule)] px-3 last:border-b-0"
        >
          <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[var(--color-rule)]">
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 pr-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                {employeeName(assignment.employee_id, employees)}
              </span>
              <span className="text-xs text-muted-foreground">
                {moduleLabel(assignment.module_id, moduleOptions)}
              </span>
              <StatusBadge status={assignment.status} />
            </div>
          </AccordionTrigger>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            <p className="mb-3 text-xs text-muted-foreground">
              Assigned {assignment.assigned_at}
              {assignment.completed_at
                ? ` · Completed ${assignment.completed_at}`
                : ""}
            </p>
            <form
              action={updateAssignmentStatusAction}
              className="flex flex-wrap items-center gap-2"
            >
              <input name="assignmentId" type="hidden" value={assignment.id} />
              <select
                className={selectClass}
                defaultValue={assignment.status}
                name="status"
              >
                {HR_TRAINING_STATUSES.map((status) => (
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
