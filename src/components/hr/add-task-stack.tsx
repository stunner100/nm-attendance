"use client";

import { useRef } from "react";

import {
  ProgressiveInputStack,
  type StepData,
} from "@/components/ui/progressive-input-stack";
import type { HRKpiCardWithEmployee } from "@/lib/hr/kpi-cards";
import type { HREmployeeOption } from "@/lib/hr/shared";
import { humanizeLabel } from "@/lib/labels";
import { HR_TASK_PRIORITIES } from "@/lib/types";

type AddTaskStackProps = {
  employeeOptions: HREmployeeOption[];
  kpiCards: HRKpiCardWithEmployee[];
  createTaskAction: (formData: FormData) => void | Promise<void>;
};

export function AddTaskStack({
  employeeOptions,
  kpiCards,
  createTaskAction,
}: AddTaskStackProps) {
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
      id: "cardId",
      label: "KPI card",
      type: "select",
      options: [
        { value: "", label: "Link KPI card (optional)" },
        ...kpiCards.map((card) => ({
          value: String(card.id),
          label: `${card.employee_name} · ${card.period}`,
        })),
      ],
    },
    {
      id: "title",
      label: "Task title",
      type: "text",
      placeholder: "What needs to be done?",
      required: true,
    },
    {
      id: "dueDate",
      label: "Due date",
      type: "date",
    },
    {
      id: "priority",
      label: "Priority",
      type: "select",
      options: HR_TASK_PRIORITIES.map((priority) => ({
        value: priority,
        label: humanizeLabel(priority),
      })),
    },
    {
      id: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Optional details",
      rows: 2,
    },
  ];

  const initialData: Record<string, string | boolean> = {
    employeeId: "",
    cardId: "",
    title: "",
    dueDate: "",
    priority: "medium",
    description: "",
  };

  const handleSubmit = (data: Record<string, string | boolean>) => {
    const form = formRef.current;
    if (!form) return;

    const fieldMap: Record<string, string> = {
      employeeId: String(data.employeeId ?? ""),
      cardId: String(data.cardId ?? ""),
      title: String(data.title ?? ""),
      dueDate: String(data.dueDate ?? ""),
      priority: String(data.priority ?? "medium"),
      description: String(data.description ?? ""),
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
      <form ref={formRef} action={createTaskAction} className="hidden" aria-hidden>
        <input name="employeeId" type="hidden" />
        <input name="cardId" type="hidden" />
        <input name="title" type="hidden" />
        <input name="dueDate" type="hidden" />
        <input name="priority" type="hidden" />
        <input name="description" type="hidden" />
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Create task"
      />
    </div>
  );
}
