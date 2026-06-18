"use client";

import { useRef } from "react";

import {
  ProgressiveInputStack,
  type StepData,
} from "@/components/ui/progressive-input-stack";
import type { HREmployeeOption } from "@/lib/hr/shared";

type GrowthPlanStackProps = {
  employeeOptions: HREmployeeOption[];
  createPlanAction: (formData: FormData) => void | Promise<void>;
};

const fieldNames = [
  "employeeId",
  "currentRole",
  "currentResponsibilities",
  "requiredKpis",
  "skillsToImprove",
  "possibleNextRole",
  "promotionRequirements",
  "trainingNeeded",
  "reviewTimeline",
  "nextReviewDate",
] as const;

export function GrowthPlanStack({
  employeeOptions,
  createPlanAction,
}: GrowthPlanStackProps) {
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
      id: "currentRole",
      label: "Current role",
      type: "text",
      placeholder: "e.g. Senior Engineer",
    },
    {
      id: "currentResponsibilities",
      label: "Current responsibilities",
      type: "textarea",
      placeholder: "What does this person own today?",
    },
    {
      id: "requiredKpis",
      label: "Required KPIs",
      type: "textarea",
      placeholder: "Measurable outcomes for this role",
    },
    {
      id: "skillsToImprove",
      label: "Skills to improve",
      type: "textarea",
      placeholder: "Skills or behaviours to develop",
    },
    {
      id: "possibleNextRole",
      label: "Possible next role",
      type: "text",
      placeholder: "Target role in 6–12 months",
    },
    {
      id: "promotionRequirements",
      label: "Promotion requirements",
      type: "textarea",
      placeholder: "Performance level needed for promotion / salary review",
    },
    {
      id: "trainingNeeded",
      label: "Training needed",
      type: "textarea",
      placeholder: "Training or support required",
    },
    {
      id: "reviewTimeline",
      label: "Review timeline",
      type: "text",
      placeholder: "e.g. every 6 months",
    },
    {
      id: "nextReviewDate",
      label: "Next review date",
      type: "date",
    },
  ];

  const initialData: Record<string, string | boolean> = {
    employeeId: "",
    currentRole: "",
    currentResponsibilities: "",
    requiredKpis: "",
    skillsToImprove: "",
    possibleNextRole: "",
    promotionRequirements: "",
    trainingNeeded: "",
    reviewTimeline: "",
    nextReviewDate: "",
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
      <form ref={formRef} action={createPlanAction} className="hidden" aria-hidden>
        {fieldNames.map((name) => (
          <input key={name} name={name} type="hidden" />
        ))}
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Create growth plan"
      />
    </div>
  );
}
