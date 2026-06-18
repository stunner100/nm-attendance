"use client";

import { useRef } from "react";

import {
  ProgressiveInputStack,
  type StepData,
} from "@/components/ui/progressive-input-stack";
import { HR_DEPARTMENTS } from "@/lib/types";

type AddRoleStackProps = {
  createRoleAction: (formData: FormData) => void | Promise<void>;
};

export function AddRoleStack({ createRoleAction }: AddRoleStackProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const steps: StepData[] = [
    {
      id: "title",
      label: "Role title",
      type: "text",
      placeholder: "e.g. Senior Engineer",
      required: true,
    },
    {
      id: "department",
      label: "Department",
      type: "select",
      required: true,
      options: HR_DEPARTMENTS.map((department) => ({
        value: department,
        label: department,
      })),
    },
    {
      id: "roleDetails",
      label: "Role details",
      type: "compound",
      fields: [
        { id: "vacancies", label: "Vacancies", type: "text", placeholder: "1" },
        { id: "openedAt", label: "Opened date", type: "date" },
      ],
    },
  ];

  const initialData: Record<string, string | boolean> = {
    title: "",
    department: "Tech",
    vacancies: "1",
    openedAt: "",
  };

  const handleSubmit = (data: Record<string, string | boolean>) => {
    const form = formRef.current;
    if (!form) return;

    const fieldMap: Record<string, string> = {
      title: String(data.title ?? ""),
      department: String(data.department ?? ""),
      vacancies: String(data.vacancies ?? "1"),
      openedAt: String(data.openedAt ?? ""),
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
      <form ref={formRef} action={createRoleAction} className="hidden" aria-hidden>
        <input name="title" type="hidden" />
        <input name="department" type="hidden" />
        <input name="vacancies" type="hidden" />
        <input name="openedAt" type="hidden" />
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Create role"
      />
    </div>
  );
}
