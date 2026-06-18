"use client";

import { useRef } from "react";

import {
  ProgressiveInputStack,
  type StepData,
} from "@/components/ui/progressive-input-stack";
import type { HREmployeeOption } from "@/lib/hr/shared";
import type { HRTrainingModuleOption } from "@/lib/hr/training";
import { humanizeLabel } from "@/lib/labels";
import { HR_TRAINING_STATUSES } from "@/lib/types";

type AssignTrainingStackProps = {
  employees: HREmployeeOption[];
  moduleOptions: HRTrainingModuleOption[];
  createAssignmentAction: (formData: FormData) => void | Promise<void>;
};

export function AssignTrainingStack({
  employees,
  moduleOptions,
  createAssignmentAction,
}: AssignTrainingStackProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const steps: StepData[] = [
    {
      id: "employeeId",
      label: "Employee",
      type: "select",
      required: true,
      options: [
        { value: "", label: "Select employee" },
        ...employees.map((employee) => ({
          value: String(employee.id),
          label: employee.full_name,
        })),
      ],
    },
    {
      id: "moduleId",
      label: "Training module",
      type: "select",
      required: true,
      options: [
        { value: "", label: "Select module" },
        ...moduleOptions.map((module) => ({
          value: String(module.id),
          label: `${module.code} - ${module.title}`,
        })),
      ],
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: HR_TRAINING_STATUSES.map((status) => ({
        value: status,
        label: humanizeLabel(status),
      })),
    },
    {
      id: "assignedAt",
      label: "Assigned date (optional)",
      type: "date",
    },
  ];

  const initialData: Record<string, string | boolean> = {
    employeeId: "",
    moduleId: "",
    status: "assigned",
    assignedAt: "",
  };

  const handleSubmit = (data: Record<string, string | boolean>) => {
    const form = formRef.current;
    if (!form) return;

    const fieldMap: Record<string, string> = {
      employeeId: String(data.employeeId ?? ""),
      moduleId: String(data.moduleId ?? ""),
      status: String(data.status ?? "assigned"),
      assignedAt: String(data.assignedAt ?? ""),
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
      <form ref={formRef} action={createAssignmentAction} className="hidden" aria-hidden>
        <input name="employeeId" type="hidden" />
        <input name="moduleId" type="hidden" />
        <input name="status" type="hidden" />
        <input name="assignedAt" type="hidden" />
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Create assignment"
      />
    </div>
  );
}
