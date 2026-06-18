"use client";

import { useRef } from "react";

import {
  ProgressiveInputStack,
  type StepData,
} from "@/components/ui/progressive-input-stack";
import type { HREmployeeOption } from "@/lib/hr/shared";
import type { HRPayrollCycleOption } from "@/lib/hr/payroll-leave";
import { humanizeLabel } from "@/lib/labels";
import { HR_LEAVE_REQUEST_STATUSES, HR_PAYROLL_STATUSES } from "@/lib/types";

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

type CreatePayrollCycleStackProps = {
  createCycleAction: (formData: FormData) => void | Promise<void>;
};

export function CreatePayrollCycleStack({ createCycleAction }: CreatePayrollCycleStackProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const steps: StepData[] = [
    {
      id: "cycleMonth",
      label: "Cycle month",
      type: "date",
      required: true,
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: HR_PAYROLL_STATUSES.map((status) => ({
        value: status,
        label: humanizeLabel(status),
      })),
    },
    {
      id: "processedAt",
      label: "Processed at (optional)",
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
    cycleMonth: "",
    status: "pending",
    processedAt: "",
    notes: "",
  };

  return (
    <div className="space-y-3">
      <form ref={formRef} action={createCycleAction} className="hidden" aria-hidden>
        <input name="cycleMonth" type="hidden" />
        <input name="status" type="hidden" />
        <input name="processedAt" type="hidden" />
        <input name="notes" type="hidden" />
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        submitLabel="Save cycle"
        onSubmit={(data) =>
          submitHiddenForm(formRef, {
            cycleMonth: String(data.cycleMonth ?? ""),
            status: String(data.status ?? ""),
            processedAt: String(data.processedAt ?? ""),
            notes: String(data.notes ?? ""),
          })
        }
      />
    </div>
  );
}

type CreatePayrollAnomalyStackProps = {
  employeeOptions: HREmployeeOption[];
  payrollCycleOptions: HRPayrollCycleOption[];
  createAnomalyAction: (formData: FormData) => void | Promise<void>;
};

export function CreatePayrollAnomalyStack({
  employeeOptions,
  payrollCycleOptions,
  createAnomalyAction,
}: CreatePayrollAnomalyStackProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const steps: StepData[] = [
    {
      id: "payrollCycleId",
      label: "Payroll cycle",
      type: "select",
      required: true,
      options: [
        { value: "", label: "Select payroll cycle" },
        ...payrollCycleOptions.map((cycle) => ({
          value: String(cycle.id),
          label: `${cycle.cycle_month} (${humanizeLabel(cycle.status)})`,
        })),
      ],
    },
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
      id: "anomalyType",
      label: "Anomaly type",
      type: "text",
      placeholder: "Anomaly type",
      required: true,
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "open", label: humanizeLabel("open") },
        { value: "resolved", label: humanizeLabel("resolved") },
      ],
    },
    {
      id: "details",
      label: "Details (optional)",
      type: "text",
      placeholder: "Details",
    },
  ];

  const initialData: Record<string, string | boolean> = {
    payrollCycleId: "",
    employeeId: "",
    anomalyType: "",
    status: "open",
    details: "",
  };

  return (
    <div className="space-y-3">
      <form ref={formRef} action={createAnomalyAction} className="hidden" aria-hidden>
        <input name="payrollCycleId" type="hidden" />
        <input name="employeeId" type="hidden" />
        <input name="anomalyType" type="hidden" />
        <input name="status" type="hidden" />
        <input name="details" type="hidden" />
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        submitLabel="Save anomaly"
        onSubmit={(data) =>
          submitHiddenForm(formRef, {
            payrollCycleId: String(data.payrollCycleId ?? ""),
            employeeId: String(data.employeeId ?? ""),
            anomalyType: String(data.anomalyType ?? ""),
            status: String(data.status ?? ""),
            details: String(data.details ?? ""),
          })
        }
      />
    </div>
  );
}

type UpsertLeaveBalanceStackProps = {
  employeeOptions: HREmployeeOption[];
  upsertBalanceAction: (formData: FormData) => void | Promise<void>;
};

export function UpsertLeaveBalanceStack({
  employeeOptions,
  upsertBalanceAction,
}: UpsertLeaveBalanceStackProps) {
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
      id: "annualDays",
      label: "Annual days",
      type: "number",
      placeholder: "Annual days",
      step: 0.25,
      required: true,
    },
    {
      id: "usedDays",
      label: "Used days",
      type: "number",
      placeholder: "Used days",
      step: 0.25,
    },
    {
      id: "carryDays",
      label: "Carry days",
      type: "number",
      placeholder: "Carry days",
      step: 0.25,
    },
  ];

  const initialData: Record<string, string | boolean> = {
    employeeId: "",
    annualDays: "",
    usedDays: "",
    carryDays: "",
  };

  return (
    <div className="space-y-3">
      <form ref={formRef} action={upsertBalanceAction} className="hidden" aria-hidden>
        <input name="employeeId" type="hidden" />
        <input name="annualDays" type="hidden" />
        <input name="usedDays" type="hidden" />
        <input name="carryDays" type="hidden" />
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        submitLabel="Save balance"
        onSubmit={(data) =>
          submitHiddenForm(formRef, {
            employeeId: String(data.employeeId ?? ""),
            annualDays: String(data.annualDays ?? ""),
            usedDays: String(data.usedDays ?? ""),
            carryDays: String(data.carryDays ?? ""),
          })
        }
      />
    </div>
  );
}

type CreateLeaveRequestStackProps = {
  employeeOptions: HREmployeeOption[];
  createLeaveRequestAction: (formData: FormData) => void | Promise<void>;
};

export function CreateLeaveRequestStack({
  employeeOptions,
  createLeaveRequestAction,
}: CreateLeaveRequestStackProps) {
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
      id: "leaveType",
      label: "Leave type",
      type: "text",
      placeholder: "Leave type",
      required: true,
    },
    {
      id: "days",
      label: "Days",
      type: "number",
      placeholder: "Days",
      step: 0.25,
      required: true,
    },
    {
      id: "leaveDates",
      label: "Leave dates",
      type: "compound",
      required: true,
      fields: [
        { id: "startDate", label: "Start date", type: "date" },
        { id: "endDate", label: "End date", type: "date" },
      ],
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: HR_LEAVE_REQUEST_STATUSES.map((status) => ({
        value: status,
        label: humanizeLabel(status),
      })),
    },
  ];

  const initialData: Record<string, string | boolean> = {
    employeeId: "",
    leaveType: "",
    days: "",
    startDate: "",
    endDate: "",
    status: "pending",
  };

  return (
    <div className="space-y-3">
      <form ref={formRef} action={createLeaveRequestAction} className="hidden" aria-hidden>
        <input name="employeeId" type="hidden" />
        <input name="leaveType" type="hidden" />
        <input name="days" type="hidden" />
        <input name="startDate" type="hidden" />
        <input name="endDate" type="hidden" />
        <input name="status" type="hidden" />
      </form>

      <ProgressiveInputStack
        steps={steps}
        initialData={initialData}
        submitLabel="Create leave request"
        onSubmit={(data) =>
          submitHiddenForm(formRef, {
            employeeId: String(data.employeeId ?? ""),
            leaveType: String(data.leaveType ?? ""),
            days: String(data.days ?? ""),
            startDate: String(data.startDate ?? ""),
            endDate: String(data.endDate ?? ""),
            status: String(data.status ?? ""),
          })
        }
      />
    </div>
  );
}
