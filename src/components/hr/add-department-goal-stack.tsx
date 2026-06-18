"use client";

import { useRef } from "react";

import {
  ProgressiveInputStack,
  type StepData,
} from "@/components/ui/progressive-input-stack";
import { HR_DEPARTMENTS } from "@/lib/types";

function submitHiddenForm(
  formRef: React.RefObject<HTMLFormElement | null>,
  fieldMap: Record<string, string>,
) {
  const form = formRef.current;
  if (!form) return;

  for (const [name, value] of Object.entries(fieldMap)) {
    const input = form.elements.namedItem(name) as HTMLInputElement | null;
    if (input) {
      input.value = value;
    }
  }

  form.requestSubmit();
}

type CompanyGoalOption = {
  id: number;
  title: string;
  period: string;
};

type AddDepartmentGoalStackProps = {
  defaultPeriod: string;
  companyGoals: CompanyGoalOption[];
  createDeptGoalAction: (formData: FormData) => void | Promise<void>;
};

export function AddDepartmentGoalStack({
  defaultPeriod,
  companyGoals,
  createDeptGoalAction,
}: AddDepartmentGoalStackProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const steps: StepData[] = [
    {
      id: "department",
      label: "Department",
      type: "select",
      required: true,
      options: [
        { value: "", label: "Select department" },
        ...HR_DEPARTMENTS.map((department) => ({
          value: department,
          label: department,
        })),
      ],
    },
    {
      id: "companyGoalId",
      label: "Link company goal (optional)",
      type: "select",
      options: [
        { value: "", label: "No linked company goal" },
        ...companyGoals.map((goal) => ({
          value: String(goal.id),
          label: `${goal.title} (${goal.period})`,
        })),
      ],
    },
    {
      id: "title",
      label: "Department goal title",
      type: "text",
      placeholder: "Department goal title",
      required: true,
    },
    {
      id: "period",
      label: "Period",
      type: "text",
      placeholder: "2026-06",
      required: true,
    },
    {
      id: "owner",
      label: "Owner / HOD (optional)",
      type: "text",
      placeholder: "Owner / HOD",
    },
    {
      id: "description",
      label: "Description (optional)",
      type: "textarea",
      placeholder: "Description",
      rows: 2,
    },
  ];

  const initialData: Record<string, string | boolean> = {
    department: "",
    companyGoalId: "",
    title: "",
    period: defaultPeriod,
    owner: "",
    description: "",
  };

  return (
    <div className="space-y-3">
      <form ref={formRef} action={createDeptGoalAction} className="hidden" aria-hidden>
        <input name="department" type="hidden" />
        <input name="companyGoalId" type="hidden" />
        <input name="title" type="hidden" />
        <input name="period" type="hidden" />
        <input name="owner" type="hidden" />
        <input name="description" type="hidden" />
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        submitLabel="Save department goal"
        onSubmit={(data) =>
          submitHiddenForm(formRef, {
            department: String(data.department ?? ""),
            companyGoalId: String(data.companyGoalId ?? ""),
            title: String(data.title ?? ""),
            period: String(data.period ?? ""),
            owner: String(data.owner ?? ""),
            description: String(data.description ?? ""),
          })
        }
      />
    </div>
  );
}
