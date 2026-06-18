"use client";

import { useRef } from "react";

import {
  ProgressiveInputStack,
  type StepData,
} from "@/components/ui/progressive-input-stack";
import type { HREmployeeOption } from "@/lib/hr/shared";

type CreateReviewStackProps = {
  employeeOptions: HREmployeeOption[];
  createReviewAction: (formData: FormData) => void | Promise<void>;
};

export function CreateReviewStack({
  employeeOptions,
  createReviewAction,
}: CreateReviewStackProps) {
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
      id: "reviewPeriod",
      label: "Review period",
      type: "text",
      placeholder: "e.g. Q2 2026",
      required: true,
    },
    {
      id: "dueDate",
      label: "Due date",
      type: "date",
      required: true,
    },
    {
      id: "reviewerEmployeeId",
      label: "Reviewer (optional)",
      type: "select",
      options: [
        { value: "", label: "No reviewer" },
        ...employeeOptions.map((employee) => ({
          value: String(employee.id),
          label: employee.full_name,
        })),
      ],
    },
    {
      id: "notes",
      label: "Notes (optional)",
      type: "text",
      placeholder: "Additional context",
    },
  ];

  const initialData: Record<string, string | boolean> = {
    employeeId: "",
    reviewPeriod: "",
    dueDate: "",
    reviewerEmployeeId: "",
    notes: "",
  };

  const handleSubmit = (data: Record<string, string | boolean>) => {
    const form = formRef.current;
    if (!form) return;

    const fieldMap: Record<string, string> = {
      employeeId: String(data.employeeId ?? ""),
      reviewPeriod: String(data.reviewPeriod ?? ""),
      dueDate: String(data.dueDate ?? ""),
      reviewerEmployeeId: String(data.reviewerEmployeeId ?? ""),
      notes: String(data.notes ?? ""),
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
      <form ref={formRef} action={createReviewAction} className="hidden" aria-hidden>
        <input name="employeeId" type="hidden" />
        <input name="reviewPeriod" type="hidden" />
        <input name="dueDate" type="hidden" />
        <input name="reviewerEmployeeId" type="hidden" />
        <input name="notes" type="hidden" />
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Create review"
      />
    </div>
  );
}
