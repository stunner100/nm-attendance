"use client";

import { useRef } from "react";

import {
  ProgressiveInputStack,
  type StepData,
} from "@/components/ui/progressive-input-stack";
import { humanizeLabel } from "@/lib/labels";
import { HR_GOAL_PRIORITIES, HR_GOAL_STATUSES } from "@/lib/types";

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

type AddCompanyGoalStackProps = {
  defaultPeriod: string;
  createGoalAction: (formData: FormData) => void | Promise<void>;
};

export function AddCompanyGoalStack({
  defaultPeriod,
  createGoalAction,
}: AddCompanyGoalStackProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const steps: StepData[] = [
    {
      id: "title",
      label: "Goal title",
      type: "text",
      placeholder: "Goal title",
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
      id: "priority",
      label: "Priority",
      type: "select",
      options: HR_GOAL_PRIORITIES.map((priority) => ({
        value: priority,
        label: humanizeLabel(priority),
      })),
    },
    {
      id: "owner",
      label: "Owner (optional)",
      type: "text",
      placeholder: "Owner",
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: HR_GOAL_STATUSES.map((status) => ({
        value: status,
        label: humanizeLabel(status),
      })),
    },
    {
      id: "description",
      label: "Description (optional)",
      type: "textarea",
      placeholder: "Description",
      rows: 3,
    },
  ];

  const initialData: Record<string, string | boolean> = {
    title: "",
    period: defaultPeriod,
    priority: "medium",
    owner: "",
    status: "draft",
    description: "",
  };

  return (
    <div className="space-y-3">
      <form ref={formRef} action={createGoalAction} className="hidden" aria-hidden>
        <input name="title" type="hidden" />
        <input name="period" type="hidden" />
        <input name="priority" type="hidden" />
        <input name="owner" type="hidden" />
        <input name="status" type="hidden" />
        <input name="description" type="hidden" />
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        submitLabel="Save goal"
        onSubmit={(data) =>
          submitHiddenForm(formRef, {
            title: String(data.title ?? ""),
            period: String(data.period ?? ""),
            priority: String(data.priority ?? ""),
            owner: String(data.owner ?? ""),
            status: String(data.status ?? ""),
            description: String(data.description ?? ""),
          })
        }
      />
    </div>
  );
}
