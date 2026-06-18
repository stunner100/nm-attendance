"use client";

import Link from "next/link";

import { StatusBadge } from "@/components/hr/status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/animated-accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { HREmployeeOption } from "@/lib/hr/shared";
import { humanizeLabel } from "@/lib/labels";
import type { HREmployee } from "@/lib/types";
import {
  HR_CONTRACT_TYPES,
  HR_DEPARTMENTS,
  HR_EMPLOYMENT_STATUSES,
  HR_EXIT_TYPES,
  HR_WORK_MODES,
} from "@/lib/types";

const selectClass =
  "h-8 w-full rounded-[var(--radius-input)] border border-input bg-card px-2 text-xs text-foreground outline-none focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/30";

const accordionEase = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

type EmployeeListAccordionProps = {
  employees: HREmployee[];
  employeeOptions: HREmployeeOption[];
  updateEmployeeAction: (formData: FormData) => void | Promise<void>;
};

export function EmployeeListAccordion({
  employees,
  employeeOptions,
  updateEmployeeAction,
}: EmployeeListAccordionProps) {
  if (employees.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No employees found. Add your first employee above.
      </p>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]"
    >
      {employees.map((employee) => (
        <AccordionItem
          key={employee.id}
          value={String(employee.id)}
          className="border-[var(--color-rule)] px-3 last:border-b-0"
        >
          <div className="flex items-start gap-2">
            <AccordionTrigger className="min-w-0 flex-1 py-3 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[var(--color-rule)]">
              <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 pr-2">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  {employee.full_name}
                </span>
                <span className="text-xs text-muted-foreground">{employee.department}</span>
                <StatusBadge status={employee.employment_status} />
              </div>
            </AccordionTrigger>
            <Link
              href={`/admin/headcount/${employee.id}`}
              className="shrink-0 pt-3 text-xs text-[var(--color-link)] hover:text-[var(--color-link-active)] hover:underline"
            >
              View profile
            </Link>
          </div>
          <AccordionContent transition={accordionEase} className="pb-4 pt-1">
            <form action={updateEmployeeAction} className="grid gap-2 sm:grid-cols-4">
              <input name="employeeId" type="hidden" value={employee.id} />
              <Input
                className="h-8 text-xs"
                defaultValue={employee.employee_code}
                name="employeeCode"
                placeholder="Employee code"
              />
              <Input
                className="h-8 text-xs"
                defaultValue={employee.full_name}
                name="fullName"
                placeholder="Full name"
                required
              />
              <Input
                className="h-8 text-xs"
                defaultValue={employee.work_email ?? ""}
                name="workEmail"
                placeholder="Work email"
                type="email"
              />
              <select
                className={selectClass}
                defaultValue={employee.department}
                name="department"
              >
                {HR_DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
              <select
                className={selectClass}
                defaultValue={employee.contract_type}
                name="contractType"
              >
                {HR_CONTRACT_TYPES.map((contractType) => (
                  <option key={contractType} value={contractType}>
                    {humanizeLabel(contractType)}
                  </option>
                ))}
              </select>
              <select
                className={selectClass}
                defaultValue={employee.work_mode}
                name="workMode"
              >
                {HR_WORK_MODES.map((workMode) => (
                  <option key={workMode} value={workMode}>
                    {humanizeLabel(workMode)}
                  </option>
                ))}
              </select>
              <select
                className={selectClass}
                defaultValue={employee.employment_status}
                name="employmentStatus"
              >
                {HR_EMPLOYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanizeLabel(status)}
                  </option>
                ))}
              </select>
              <select
                className={selectClass}
                defaultValue={employee.manager_employee_id ?? ""}
                name="managerEmployeeId"
              >
                <option value="">No manager</option>
                {employeeOptions
                  .filter((managerOption) => managerOption.id !== employee.id)
                  .map((managerOption) => (
                    <option key={managerOption.id} value={managerOption.id}>
                      {managerOption.full_name} ({managerOption.employee_code})
                    </option>
                  ))}
              </select>
              <label className="space-y-1 text-xs">
                <span className="text-muted-foreground">Contract start</span>
                <Input
                  className="h-8 text-xs"
                  defaultValue={employee.hire_date}
                  name="contractStartDate"
                  type="date"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-muted-foreground">Contract end</span>
                <Input
                  className="h-8 text-xs"
                  defaultValue={employee.contract_end_date ?? ""}
                  name="contractEndDate"
                  type="date"
                />
              </label>
              <select
                className={selectClass}
                defaultValue={employee.exit_type ?? ""}
                name="exitType"
              >
                <option value="">No exit type</option>
                {HR_EXIT_TYPES.map((exitType) => (
                  <option key={exitType} value={exitType}>
                    {humanizeLabel(exitType)}
                  </option>
                ))}
              </select>
              <Input
                className="h-8 text-xs"
                defaultValue={employee.exit_date ?? ""}
                name="exitDate"
                type="date"
              />
              <div className="flex flex-wrap items-center gap-2 sm:col-span-4">
                <Button size="sm" type="submit" variant="outline">
                  Save details
                </Button>
              </div>
            </form>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
