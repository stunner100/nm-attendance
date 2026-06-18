"use client";

import { useRef } from "react";

import {
  ProgressiveInputStack,
  type StepData,
} from "@/components/ui/progressive-input-stack";
import type { HREmployeeOption } from "@/lib/hr/shared";
import { humanizeLabel } from "@/lib/labels";
import { HR_PIP_STATUSES } from "@/lib/types";

type CreatePipStackProps = {
  employeeOptions: HREmployeeOption[];
  createPipAction: (formData: FormData) => void | Promise<void>;
};

export function CreatePipStack({
  employeeOptions,
  createPipAction,
}: CreatePipStackProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const steps: StepData[] = [
    {
      id: "employeeId",
      label: "Employee",
      type: "select",
      required: true,
      options: [
        { value: "", label: "Select employee" },
        ...employeeOptions.map((employee) => ({
          value: String(employee.id),
          label: employee.full_name,
        })),
      ],
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: HR_PIP_STATUSES.map((status) => ({
        value: status,
        label: humanizeLabel(status),
      })),
    },
    {
      id: "startDate",
      label: "Start date",
      type: "date",
      required: true,
    },
    {
      id: "endDate",
      label: "End date (optional)",
      type: "date",
    },
    {
      id: "progressNote",
      label: "Progress note (optional)",
      type: "text",
      placeholder: "Initial note",
    },
  ];

  const initialData: Record<string, string | boolean> = {
    employeeId: "",
    status: "active",
    startDate: "",
    endDate: "",
    progressNote: "",
  };

  const handleSubmit = (data: Record<string, string | boolean>) => {
    const form = formRef.current;
    if (!form) return;

    const fieldMap: Record<string, string> = {
      employeeId: String(data.employeeId ?? ""),
      status: String(data.status ?? "active"),
      startDate: String(data.startDate ?? ""),
      endDate: String(data.endDate ?? ""),
      progressNote: String(data.progressNote ?? ""),
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
      <form ref={formRef} action={createPipAction} className="hidden" aria-hidden>
        <input name="employeeId" type="hidden" />
        <input name="status" type="hidden" />
        <input name="startDate" type="hidden" />
        <input name="endDate" type="hidden" />
        <input name="progressNote" type="hidden" />
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Create improvement plan"
      />
    </div>
  );
}
