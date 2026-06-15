import { randomUUID } from "crypto";

import type {
  HRContractType,
  HRDepartment,
  HRDisciplinaryCase,
  HRDisciplinaryStatus,
  HREmployee,
  HREmploymentStatus,
  HRExitType,
  HRFollowupAction,
  HRKpiScore,
  HRLeaveBalance,
  HRLeaveRequest,
  HRLeaveRequestStatus,
  HROnboardingChecklist,
  HRPayrollAnomaly,
  HRPayrollCycle,
  HRPayrollStatus,
  HRPerformanceReview,
  HRPip,
  HRPipStatus,
  HRPolicyViolation,
  HRRecruitmentApplicant,
  HRRecruitmentRole,
  HRRecruitmentStage,
  HRReviewStatus,
  HRTrainingAssignment,
  HRTrainingModule,
  HRTrainingStatus,
  HRWorkMode,
} from "@/lib/types";
import {
  HR_CONTRACT_TYPES,
  HR_DEPARTMENTS,
  HR_DISCIPLINARY_STATUSES,
  HR_EMPLOYMENT_STATUSES,
  HR_LEAVE_REQUEST_STATUSES,
  HR_PIP_STATUSES,
  HR_RECRUITMENT_STAGES,
  HR_TRAINING_STATUSES,
  HR_WORK_MODES,
} from "@/lib/types";

export type DbRow = Record<string, unknown>;

export function asString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return "";
}

export function asNullableString(value: unknown): string | null {
  const resolved = asString(value).trim();
  return resolved || null;
}

export function asNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    return Number(value);
  }
  return 0;
}

export function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return asNumber(value);
}

export function asBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    return ["true", "1", "yes"].includes(value.trim().toLowerCase());
  }
  return false;
}

export function asDateOnly(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return "";
}

export function asNullableDateOnly(value: unknown): string | null {
  const resolved = asDateOnly(value);
  return resolved || null;
}

export function ensureDateOnly(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return date.toISOString().slice(0, 10);
}

export function ensureEnumValue<T extends readonly string[]>(
  value: string,
  allowed: T,
  field: string
): T[number] {
  if (allowed.includes(value as T[number])) {
    return value as T[number];
  }
  throw new Error(`Invalid ${field}: ${value}`);
}

export function asRecordRows<T = DbRow>(rows: unknown[]): T[] {
  return rows as T[];
}

export function normalizeEmployee(row: DbRow): HREmployee {
  return {
    id: asNumber(row.id),
    employee_code: asString(row.employee_code),
    full_name: asString(row.full_name),
    work_email: asNullableString(row.work_email),
    department: asString(row.department) as HRDepartment,
    contract_type: asString(row.contract_type) as HRContractType,
    work_mode: asString(row.work_mode) as HRWorkMode,
    employment_status: asString(row.employment_status) as HREmploymentStatus,
    manager_employee_id: asNullableNumber(row.manager_employee_id),
    hire_date: asDateOnly(row.hire_date),
    probation_end_date: asNullableDateOnly(row.probation_end_date),
    contract_end_date: asNullableDateOnly(row.contract_end_date),
    exit_date: asNullableDateOnly(row.exit_date),
    exit_type: asNullableString(row.exit_type) as HRExitType | null,
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
  };
}

export function normalizeRole(row: DbRow): HRRecruitmentRole {
  return {
    id: asNumber(row.id),
    title: asString(row.title),
    department: asString(row.department) as HRDepartment,
    hiring_stage: asString(row.hiring_stage),
    vacancies: asNumber(row.vacancies),
    opened_at: asDateOnly(row.opened_at),
    closed_at: asNullableDateOnly(row.closed_at),
    created_at: asString(row.created_at),
  };
}

export function normalizeApplicant(row: DbRow): HRRecruitmentApplicant {
  return {
    id: asNumber(row.id),
    role_id: asNumber(row.role_id),
    full_name: asString(row.full_name),
    email: asNullableString(row.email),
    employment_track: asString(row.employment_track) as "intern" | "full_time",
    current_stage: asString(row.current_stage) as HRRecruitmentStage,
    applied_at: asDateOnly(row.applied_at),
    offered_at: asNullableDateOnly(row.offered_at),
    hired_at: asNullableDateOnly(row.hired_at),
    offer_status: asNullableString(row.offer_status) as
      | "pending"
      | "accepted"
      | "rejected"
      | null,
    created_at: asString(row.created_at),
  };
}

export function normalizeDisciplinaryCase(row: DbRow): HRDisciplinaryCase {
  return {
    id: asNumber(row.id),
    employee_id: asNullableNumber(row.employee_id),
    category: asString(row.category),
    status: asString(row.status) as HRDisciplinaryStatus,
    summary: asString(row.summary),
    opened_at: asDateOnly(row.opened_at),
    due_date: asNullableDateOnly(row.due_date),
    resolved_at: asNullableDateOnly(row.resolved_at),
    created_at: asString(row.created_at),
  };
}

export function normalizePolicyViolation(row: DbRow): HRPolicyViolation {
  return {
    id: asNumber(row.id),
    employee_id: asNullableNumber(row.employee_id),
    category: asString(row.category),
    severity: asString(row.severity) as "low" | "medium" | "high",
    notes: asNullableString(row.notes),
    occurred_on: asDateOnly(row.occurred_on),
    created_at: asString(row.created_at),
  };
}

export function normalizeFollowupAction(row: DbRow): HRFollowupAction {
  return {
    id: asNumber(row.id),
    employee_id: asNullableNumber(row.employee_id),
    action_type: asString(row.action_type),
    status: asString(row.status) as "pending" | "in_progress" | "done",
    due_date: asNullableDateOnly(row.due_date),
    notes: asNullableString(row.notes),
    created_at: asString(row.created_at),
  };
}

export function normalizePayrollCycle(row: DbRow): HRPayrollCycle {
  return {
    id: asNumber(row.id),
    cycle_month: asDateOnly(row.cycle_month),
    status: asString(row.status) as HRPayrollStatus,
    processed_at: asNullableDateOnly(row.processed_at),
    notes: asNullableString(row.notes),
    created_at: asString(row.created_at),
  };
}

export function normalizePayrollAnomaly(row: DbRow): HRPayrollAnomaly {
  return {
    id: asNumber(row.id),
    payroll_cycle_id: asNumber(row.payroll_cycle_id),
    employee_id: asNullableNumber(row.employee_id),
    anomaly_type: asString(row.anomaly_type),
    status: asString(row.status) as "open" | "resolved",
    details: asNullableString(row.details),
    created_at: asString(row.created_at),
  };
}

export function normalizeLeaveBalance(row: DbRow): HRLeaveBalance {
  return {
    id: asNumber(row.id),
    employee_id: asNumber(row.employee_id),
    annual_days: asNumber(row.annual_days),
    used_days: asNumber(row.used_days),
    carry_days: asNumber(row.carry_days),
    updated_at: asString(row.updated_at),
  };
}

export function normalizeLeaveRequest(row: DbRow): HRLeaveRequest {
  return {
    id: asNumber(row.id),
    employee_id: asNumber(row.employee_id),
    leave_type: asString(row.leave_type),
    start_date: asDateOnly(row.start_date),
    end_date: asDateOnly(row.end_date),
    days: asNumber(row.days),
    status: asString(row.status) as HRLeaveRequestStatus,
    requested_at: asString(row.requested_at),
    reviewed_at: asNullableString(row.reviewed_at),
  };
}

export function normalizePerformanceReview(row: DbRow): HRPerformanceReview {
  return {
    id: asNumber(row.id),
    employee_id: asNumber(row.employee_id),
    review_period: asString(row.review_period),
    due_date: asDateOnly(row.due_date),
    completed_at: asNullableDateOnly(row.completed_at),
    status: asString(row.status) as HRReviewStatus,
    reviewer_employee_id: asNullableNumber(row.reviewer_employee_id),
    notes: asNullableString(row.notes),
    created_at: asString(row.created_at),
  };
}

export function normalizePip(row: DbRow): HRPip {
  return {
    id: asNumber(row.id),
    employee_id: asNumber(row.employee_id),
    status: asString(row.status) as HRPipStatus,
    start_date: asDateOnly(row.start_date),
    end_date: asNullableDateOnly(row.end_date),
    progress_note: asNullableString(row.progress_note),
    last_updated: asString(row.last_updated),
  };
}

export function normalizeKpiScore(row: DbRow): HRKpiScore {
  return {
    id: asNumber(row.id),
    employee_id: asNumber(row.employee_id),
    metric_name: asString(row.metric_name),
    score: asNumber(row.score),
    period_start: asDateOnly(row.period_start),
    period_end: asDateOnly(row.period_end),
    created_at: asString(row.created_at),
  };
}

export function normalizeTrainingModule(row: DbRow): HRTrainingModule {
  return {
    id: asNumber(row.id),
    code: asString(row.code),
    title: asString(row.title),
    category: asString(row.category),
    duration_hours: asNumber(row.duration_hours),
    active: asBoolean(row.active),
    created_at: asString(row.created_at),
  };
}

export function normalizeTrainingAssignment(row: DbRow): HRTrainingAssignment {
  return {
    id: asNumber(row.id),
    employee_id: asNumber(row.employee_id),
    module_id: asNumber(row.module_id),
    status: asString(row.status) as HRTrainingStatus,
    assigned_at: asDateOnly(row.assigned_at),
    completed_at: asNullableDateOnly(row.completed_at),
  };
}

export function normalizeOnboardingChecklist(row: DbRow): HROnboardingChecklist {
  return {
    id: asNumber(row.id),
    employee_id: asNumber(row.employee_id),
    item_name: asString(row.item_name),
    status: asString(row.status) as "pending" | "completed",
    due_date: asNullableDateOnly(row.due_date),
    completed_at: asNullableDateOnly(row.completed_at),
  };
}

export function generateEmployeeCode(): string {
  return `EMP-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export type ListHREmployeesOptions = {
  department?: string;
  status?: string;
  contractType?: string;
  limit?: number;
};

export type HREmployeeOption = {
  id: number;
  full_name: string;
  employee_code: string;
};

export function applyListLimit(query: string, values: unknown[], limit?: number): string {
  if (!limit) {
    return query;
  }

  const safeLimit = Math.max(1, Math.min(500, Math.trunc(Number(limit))));
  if (!Number.isFinite(safeLimit)) {
    return query;
  }

  values.push(safeLimit);
  return `${query}\nLIMIT $${values.length}`;
}
