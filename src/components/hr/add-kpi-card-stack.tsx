"use client";

import { useRef } from "react";

import {
  ProgressiveInputStack,
  type StepData,
} from "@/components/ui/progressive-input-stack";
import type { HREmployeeOption } from "@/lib/hr/shared";
import { humanizeLabel } from "@/lib/labels";
import { HR_KPI_CARD_STATUSES } from "@/lib/types";

type CompanyGoalOption = { id: number; title: string; period: string };
type DepartmentGoalOption = { id: number; title: string; department: string };

type AddKpiCardStackProps = {
  employeeOptions: HREmployeeOption[];
  companyGoals: CompanyGoalOption[];
  departmentGoals: DepartmentGoalOption[];
  defaultPeriod: string;
  createCardAction: (formData: FormData) => void | Promise<void>;
};

export function AddKpiCardStack({
  employeeOptions,
  companyGoals,
  departmentGoals,
  defaultPeriod,
  createCardAction,
}: AddKpiCardStackProps) {
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
      id: "period",
      label: "Period (YYYY-MM)",
      type: "text",
      placeholder: "2026-06",
      required: true,
    },
    {
      id: "roleTitle",
      label: "Role title",
      type: "text",
      placeholder: "e.g. Senior Engineer",
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: HR_KPI_CARD_STATUSES.map((status) => ({
        value: status,
        label: humanizeLabel(status),
      })),
    },
    {
      id: "companyGoalId",
      label: "Company goal",
      type: "select",
      options: [
        { value: "", label: "Link company goal (optional)" },
        ...companyGoals.map((goal) => ({
          value: String(goal.id),
          label: `${goal.title} (${goal.period})`,
        })),
      ],
    },
    {
      id: "departmentGoalId",
      label: "Department goal",
      type: "select",
      options: [
        { value: "", label: "Link department goal (optional)" },
        ...departmentGoals.map((goal) => ({
          value: String(goal.id),
          label: `${goal.department}: ${goal.title}`,
        })),
      ],
    },
    {
      id: "companyGoal",
      label: "Legacy goal text",
      type: "textarea",
      placeholder: "Optional if linked above",
      rows: 3,
    },
  ];

  const initialData: Record<string, string | boolean> = {
    employeeId: "",
    period: defaultPeriod,
    roleTitle: "",
    status: "draft",
    companyGoalId: "",
    departmentGoalId: "",
    companyGoal: "",
  };

  const handleSubmit = (data: Record<string, string | boolean>) => {
    const form = formRef.current;
    if (!form) return;

    const fieldMap: Record<string, string> = {
      employeeId: String(data.employeeId ?? ""),
      period: String(data.period ?? ""),
      roleTitle: String(data.roleTitle ?? ""),
      status: String(data.status ?? "draft"),
      companyGoalId: String(data.companyGoalId ?? ""),
      departmentGoalId: String(data.departmentGoalId ?? ""),
      companyGoal: String(data.companyGoal ?? ""),
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
      <form ref={formRef} action={createCardAction} className="hidden" aria-hidden>
        <input name="employeeId" type="hidden" />
        <input name="period" type="hidden" />
        <input name="roleTitle" type="hidden" />
        <input name="status" type="hidden" />
        <input name="companyGoalId" type="hidden" />
        <input name="departmentGoalId" type="hidden" />
        <input name="companyGoal" type="hidden" />
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Create card"
      />
    </div>
  );
}
