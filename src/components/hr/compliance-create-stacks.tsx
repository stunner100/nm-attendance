"use client";

import { useRef } from "react";

import {
  ProgressiveInputStack,
  type StepData,
} from "@/components/ui/progressive-input-stack";
import type { HREmployeeOption } from "@/lib/hr/shared";
import { humanizeLabel } from "@/lib/labels";
import { HR_DISCIPLINARY_STATUSES } from "@/lib/types";

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

type EmployeeStackProps = {
  employeeOptions: HREmployeeOption[];
};

type AddDisciplinaryCaseStackProps = EmployeeStackProps & {
  createCaseAction: (formData: FormData) => void | Promise<void>;
};

export function AddDisciplinaryCaseStack({
  employeeOptions,
  createCaseAction,
}: AddDisciplinaryCaseStackProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const steps: StepData[] = [
    {
      id: "employeeId",
      label: "Employee (optional)",
      type: "select",
      options: [
        { value: "", label: "No employee" },
        ...employeeOptions.map((employee) => ({
          value: String(employee.id),
          label: employee.full_name,
        })),
      ],
    },
    {
      id: "category",
      label: "Category",
      type: "text",
      placeholder: "Category",
      required: true,
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: HR_DISCIPLINARY_STATUSES.map((status) => ({
        value: status,
        label: humanizeLabel(status),
      })),
    },
    {
      id: "summary",
      label: "Summary",
      type: "text",
      placeholder: "Summary",
      required: true,
    },
    {
      id: "caseDates",
      label: "Dates (optional)",
      type: "compound",
      fields: [
        { id: "openedAt", label: "Opened on", type: "date" },
        { id: "dueDate", label: "Due date", type: "date" },
      ],
    },
  ];

  const initialData: Record<string, string | boolean> = {
    employeeId: "",
    category: "",
    status: "warning_issued",
    summary: "",
    openedAt: "",
    dueDate: "",
  };

  return (
    <div className="space-y-3">
      <form ref={formRef} action={createCaseAction} className="hidden" aria-hidden>
        <input name="employeeId" type="hidden" />
        <input name="category" type="hidden" />
        <input name="status" type="hidden" />
        <input name="summary" type="hidden" />
        <input name="openedAt" type="hidden" />
        <input name="dueDate" type="hidden" />
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        submitLabel="Create case"
        onSubmit={(data) =>
          submitHiddenForm(formRef, {
            employeeId: String(data.employeeId ?? ""),
            category: String(data.category ?? ""),
            status: String(data.status ?? ""),
            summary: String(data.summary ?? ""),
            openedAt: String(data.openedAt ?? ""),
            dueDate: String(data.dueDate ?? ""),
          })
        }
      />
    </div>
  );
}

type AddPolicyViolationStackProps = EmployeeStackProps & {
  createViolationAction: (formData: FormData) => void | Promise<void>;
};

export function AddPolicyViolationStack({
  employeeOptions,
  createViolationAction,
}: AddPolicyViolationStackProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const steps: StepData[] = [
    {
      id: "employeeId",
      label: "Employee (optional)",
      type: "select",
      options: [
        { value: "", label: "No employee" },
        ...employeeOptions.map((employee) => ({
          value: String(employee.id),
          label: employee.full_name,
        })),
      ],
    },
    {
      id: "category",
      label: "Violation category",
      type: "text",
      placeholder: "Violation category",
      required: true,
    },
    {
      id: "severity",
      label: "Severity",
      type: "select",
      options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
      ],
    },
    {
      id: "occurredOn",
      label: "Occurred on",
      type: "date",
    },
    {
      id: "notes",
      label: "Notes (optional)",
      type: "text",
      placeholder: "Notes",
    },
  ];

  const initialData: Record<string, string | boolean> = {
    employeeId: "",
    category: "",
    severity: "medium",
    occurredOn: "",
    notes: "",
  };

  return (
    <div className="space-y-3">
      <form ref={formRef} action={createViolationAction} className="hidden" aria-hidden>
        <input name="employeeId" type="hidden" />
        <input name="category" type="hidden" />
        <input name="severity" type="hidden" />
        <input name="occurredOn" type="hidden" />
        <input name="notes" type="hidden" />
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        submitLabel="Add violation"
        onSubmit={(data) =>
          submitHiddenForm(formRef, {
            employeeId: String(data.employeeId ?? ""),
            category: String(data.category ?? ""),
            severity: String(data.severity ?? ""),
            occurredOn: String(data.occurredOn ?? ""),
            notes: String(data.notes ?? ""),
          })
        }
      />
    </div>
  );
}

type AddFollowupActionStackProps = EmployeeStackProps & {
  createFollowupActionAction: (formData: FormData) => void | Promise<void>;
};

export function AddFollowupActionStack({
  employeeOptions,
  createFollowupActionAction,
}: AddFollowupActionStackProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const steps: StepData[] = [
    {
      id: "employeeId",
      label: "Employee (optional)",
      type: "select",
      options: [
        { value: "", label: "No employee" },
        ...employeeOptions.map((employee) => ({
          value: String(employee.id),
          label: employee.full_name,
        })),
      ],
    },
    {
      id: "actionType",
      label: "Action type",
      type: "text",
      placeholder: "Action type",
      required: true,
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "pending", label: humanizeLabel("pending") },
        { value: "in_progress", label: humanizeLabel("in_progress") },
        { value: "done", label: humanizeLabel("done") },
      ],
    },
    {
      id: "dueDate",
      label: "Due date",
      type: "date",
    },
    {
      id: "notes",
      label: "Notes (optional)",
      type: "text",
      placeholder: "Notes",
    },
  ];

  const initialData: Record<string, string | boolean> = {
    employeeId: "",
    actionType: "",
    status: "pending",
    dueDate: "",
    notes: "",
  };

  return (
    <div className="space-y-3">
      <form ref={formRef} action={createFollowupActionAction} className="hidden" aria-hidden>
        <input name="employeeId" type="hidden" />
        <input name="actionType" type="hidden" />
        <input name="status" type="hidden" />
        <input name="dueDate" type="hidden" />
        <input name="notes" type="hidden" />
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        submitLabel="Create action"
        onSubmit={(data) =>
          submitHiddenForm(formRef, {
            employeeId: String(data.employeeId ?? ""),
            actionType: String(data.actionType ?? ""),
            status: String(data.status ?? ""),
            dueDate: String(data.dueDate ?? ""),
            notes: String(data.notes ?? ""),
          })
        }
      />
    </div>
  );
}
