"use client";

import { useRef } from "react";

import {
  ProgressiveInputStack,
  type StepData,
} from "@/components/ui/progressive-input-stack";
import type { HREmployeeOption } from "@/lib/hr/shared";
import { humanizeLabel } from "@/lib/labels";
import {
  HR_CONTRACT_TYPES,
  HR_DEPARTMENTS,
  HR_EMPLOYMENT_STATUSES,
  HR_WORK_MODES,
} from "@/lib/types";

type AddEmployeeStackProps = {
  employeeOptions: HREmployeeOption[];
  createEmployeeAction: (formData: FormData) => void | Promise<void>;
};

export function AddEmployeeStack({
  employeeOptions,
  createEmployeeAction,
}: AddEmployeeStackProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const steps: StepData[] = [
    {
      id: "fullName",
      label: "Full name",
      type: "text",
      placeholder: "e.g. Ama Mensah",
      required: true,
    },
    {
      id: "workEmail",
      label: "Work email",
      type: "email",
      placeholder: "name@company.com",
    },
    {
      id: "department",
      label: "Department",
      type: "select",
      options: HR_DEPARTMENTS.map((department) => ({
        value: department,
        label: department,
      })),
    },
    {
      id: "contractType",
      label: "Contract type",
      type: "select",
      options: HR_CONTRACT_TYPES.map((contractType) => ({
        value: contractType,
        label: humanizeLabel(contractType),
      })),
    },
    {
      id: "workMode",
      label: "Work mode",
      type: "select",
      options: HR_WORK_MODES.map((workMode) => ({
        value: workMode,
        label: humanizeLabel(workMode),
      })),
    },
    {
      id: "employmentStatus",
      label: "Employment status",
      type: "select",
      options: HR_EMPLOYMENT_STATUSES.map((status) => ({
        value: status,
        label: humanizeLabel(status),
      })),
    },
    {
      id: "managerEmployeeId",
      label: "Manager (optional)",
      type: "select",
      options: [
        { value: "", label: "No manager" },
        ...employeeOptions.map((employee) => ({
          value: String(employee.id),
          label: `${employee.full_name} (${employee.employee_code})`,
        })),
      ],
    },
    {
      id: "jobTitle",
      label: "Job title",
      type: "text",
      placeholder: "e.g. HR Operations Lead",
    },
    {
      id: "contractDates",
      label: "Contract dates (optional)",
      type: "compound",
      fields: [
        { id: "contractStartDate", label: "Start date", type: "date" },
        { id: "contractEndDate", label: "End date", type: "date" },
      ],
    },
  ];

  const initialData: Record<string, string | boolean> = {
    fullName: "",
    workEmail: "",
    department: "Tech",
    contractType: "full_time",
    workMode: "onsite",
    employmentStatus: "active",
    managerEmployeeId: "",
    jobTitle: "",
    contractStartDate: "",
    contractEndDate: "",
  };

  const handleSubmit = (data: Record<string, string | boolean>) => {
    const form = formRef.current;
    if (!form) return;

    const fieldMap: Record<string, string> = {
      fullName: String(data.fullName ?? ""),
      workEmail: String(data.workEmail ?? ""),
      department: String(data.department ?? ""),
      contractType: String(data.contractType ?? ""),
      workMode: String(data.workMode ?? ""),
      employmentStatus: String(data.employmentStatus ?? ""),
      managerEmployeeId: String(data.managerEmployeeId ?? ""),
      jobTitle: String(data.jobTitle ?? ""),
      contractStartDate: String(data.contractStartDate ?? ""),
      contractEndDate: String(data.contractEndDate ?? ""),
    };

    for (const [name, value] of Object.entries(fieldMap)) {
      const input = form.elements.namedItem(name) as HTMLInputElement | null;
      if (input) {
        input.value = value;
      }
    }

    form.requestSubmit();
  };

  return (
    <div className="space-y-3">
      <form ref={formRef} action={createEmployeeAction} className="hidden" aria-hidden>
        <input name="fullName" type="hidden" />
        <input name="workEmail" type="hidden" />
        <input name="department" type="hidden" />
        <input name="contractType" type="hidden" />
        <input name="workMode" type="hidden" />
        <input name="employmentStatus" type="hidden" />
        <input name="managerEmployeeId" type="hidden" />
        <input name="jobTitle" type="hidden" />
        <input name="contractStartDate" type="hidden" />
        <input name="contractEndDate" type="hidden" />
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Add employee"
      />

      <p className="text-xs text-muted-foreground">
        Contract end date is optional for permanent (full-time) employees.
      </p>
    </div>
  );
}
