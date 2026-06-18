"use client";

import { useRef } from "react";

import {
  ProgressiveInputStack,
  type StepData,
} from "@/components/ui/progressive-input-stack";
import type { HREmployeeOption } from "@/lib/hr/shared";
import { humanizeLabel } from "@/lib/labels";
import { HR_ACCOUNTABILITY_STAGES } from "@/lib/types";

type AccountabilityActionStackProps = {
  employeeOptions: HREmployeeOption[];
  createActionAction: (formData: FormData) => void | Promise<void>;
};

const fieldNames = ["employeeId", "stage", "issuedOn", "reason", "notes"] as const;

export function AccountabilityActionStack({
  employeeOptions,
  createActionAction,
}: AccountabilityActionStackProps) {
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
      id: "stage",
      label: "Stage",
      type: "select",
      options: HR_ACCOUNTABILITY_STAGES.map((stage) => ({
        value: stage,
        label: humanizeLabel(stage),
      })),
    },
    {
      id: "issuedOn",
      label: "Issued on",
      type: "date",
    },
    {
      id: "reason",
      label: "Reason",
      type: "text",
      placeholder: "Why is this action being recorded?",
      required: true,
    },
    {
      id: "notes",
      label: "Notes",
      type: "textarea",
      placeholder: "Additional context (optional)",
    },
  ];

  const initialData: Record<string, string | boolean> = {
    employeeId: "",
    stage: "coaching",
    issuedOn: "",
    reason: "",
    notes: "",
  };

  const handleSubmit = (data: Record<string, string | boolean>) => {
    const form = formRef.current;
    if (!form) return;

    for (const name of fieldNames) {
      const input = form.elements.namedItem(name) as HTMLInputElement | null;
      if (input) {
        input.value = String(data[name] ?? "");
      }
    }

    form.requestSubmit();
  };

  return (
    <div className="space-y-3">
      <form ref={formRef} action={createActionAction} className="hidden" aria-hidden>
        {fieldNames.map((name) => (
          <input key={name} name={name} type="hidden" />
        ))}
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Save action"
      />
    </div>
  );
}
