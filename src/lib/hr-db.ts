import { randomUUID } from "crypto";

import { ensureDbSchema, getDbPool } from "@/lib/db";
import type {
  HRContractType,
  HRDashboardSummary,
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

type DbRow = Record<string, unknown>;

export type CreateHREmployeeInput = {
  employeeCode?: string | null;
  fullName: string;
  workEmail?: string | null;
  department: HRDepartment;
  contractType: HRContractType;
  workMode?: HRWorkMode;
  employmentStatus?: HREmploymentStatus;
  managerEmployeeId?: number | null;
  hireDate?: string | null;
  probationEndDate?: string | null;
  contractEndDate?: string | null;
  exitDate?: string | null;
  exitType?: HRExitType | null;
};

export type UpdateHREmployeeInput = {
  employeeCode?: string | null;
  fullName: string;
  workEmail?: string | null;
  department: HRDepartment;
  contractType: HRContractType;
  workMode: HRWorkMode;
  employmentStatus: HREmploymentStatus;
  managerEmployeeId?: number | null;
  hireDate?: string | null;
  contractEndDate?: string | null;
  exitDate?: string | null;
  exitType?: HRExitType | null;
};

export type CreateRecruitmentRoleInput = {
  title: string;
  department: HRDepartment;
  hiringStage?: string | null;
  vacancies?: number;
  openedAt?: string | null;
};

export type CreateRecruitmentApplicantInput = {
  roleId: number;
  fullName: string;
  email?: string | null;
  employmentTrack: "intern" | "full_time";
  currentStage?: HRRecruitmentStage;
  appliedAt?: string | null;
};

export type CreateDisciplinaryCaseInput = {
  employeeId?: number | null;
  category: string;
  status: HRDisciplinaryStatus;
  summary: string;
  openedAt?: string | null;
  dueDate?: string | null;
};

export type CreatePolicyViolationInput = {
  employeeId?: number | null;
  category: string;
  severity: "low" | "medium" | "high";
  notes?: string | null;
  occurredOn?: string | null;
};

export type CreateFollowupActionInput = {
  employeeId?: number | null;
  actionType: string;
  status?: "pending" | "in_progress" | "done";
  dueDate?: string | null;
  notes?: string | null;
};

export type CreatePayrollCycleInput = {
  cycleMonth: string;
  status?: HRPayrollStatus;
  processedAt?: string | null;
  notes?: string | null;
};

export type CreatePayrollAnomalyInput = {
  payrollCycleId: number;
  employeeId?: number | null;
  anomalyType: string;
  status?: "open" | "resolved";
  details?: string | null;
};

export type UpsertLeaveBalanceInput = {
  employeeId: number;
  annualDays: number;
  usedDays?: number;
  carryDays?: number;
};

export type CreateLeaveRequestInput = {
  employeeId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status?: HRLeaveRequestStatus;
};

export type CreatePerformanceReviewInput = {
  employeeId: number;
  reviewPeriod: string;
  dueDate: string;
  reviewerEmployeeId?: number | null;
  notes?: string | null;
};

export type CreatePipInput = {
  employeeId: number;
  status: HRPipStatus;
  startDate: string;
  endDate?: string | null;
  progressNote?: string | null;
};

export type CreateKpiScoreInput = {
  employeeId: number;
  metricName: string;
  score: number;
  periodStart: string;
  periodEnd: string;
};

export type CreateTrainingModuleInput = {
  code: string;
  title: string;
  category: string;
  durationHours?: number;
};

export type CreateTrainingAssignmentInput = {
  employeeId: number;
  moduleId: number;
  status?: HRTrainingStatus;
  assignedAt?: string | null;
};

export type CreateOnboardingChecklistInput = {
  employeeId: number;
  itemName: string;
  status?: "pending" | "completed";
  dueDate?: string | null;
};

function asString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return "";
}

function asNullableString(value: unknown): string | null {
  const resolved = asString(value).trim();
  return resolved || null;
}

function asNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    return Number(value);
  }
  return 0;
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return asNumber(value);
}

function asBoolean(value: unknown): boolean {
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

function asDateOnly(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return "";
}

function asNullableDateOnly(value: unknown): string | null {
  const resolved = asDateOnly(value);
  return resolved || null;
}

function ensureDateOnly(value: string | null | undefined): string | null {
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

function ensureEnumValue<T extends readonly string[]>(
  value: string,
  allowed: T,
  field: string
): T[number] {
  if (allowed.includes(value as T[number])) {
    return value as T[number];
  }
  throw new Error(`Invalid ${field}: ${value}`);
}

function asRecordRows<T = DbRow>(rows: unknown[]): T[] {
  return rows as T[];
}

function normalizeEmployee(row: DbRow): HREmployee {
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

function normalizeRole(row: DbRow): HRRecruitmentRole {
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

function normalizeApplicant(row: DbRow): HRRecruitmentApplicant {
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

function normalizeDisciplinaryCase(row: DbRow): HRDisciplinaryCase {
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

function normalizePolicyViolation(row: DbRow): HRPolicyViolation {
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

function normalizeFollowupAction(row: DbRow): HRFollowupAction {
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

function normalizePayrollCycle(row: DbRow): HRPayrollCycle {
  return {
    id: asNumber(row.id),
    cycle_month: asDateOnly(row.cycle_month),
    status: asString(row.status) as HRPayrollStatus,
    processed_at: asNullableDateOnly(row.processed_at),
    notes: asNullableString(row.notes),
    created_at: asString(row.created_at),
  };
}

function normalizePayrollAnomaly(row: DbRow): HRPayrollAnomaly {
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

function normalizeLeaveBalance(row: DbRow): HRLeaveBalance {
  return {
    id: asNumber(row.id),
    employee_id: asNumber(row.employee_id),
    annual_days: asNumber(row.annual_days),
    used_days: asNumber(row.used_days),
    carry_days: asNumber(row.carry_days),
    updated_at: asString(row.updated_at),
  };
}

function normalizeLeaveRequest(row: DbRow): HRLeaveRequest {
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

function normalizePerformanceReview(row: DbRow): HRPerformanceReview {
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

function normalizePip(row: DbRow): HRPip {
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

function normalizeKpiScore(row: DbRow): HRKpiScore {
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

function normalizeTrainingModule(row: DbRow): HRTrainingModule {
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

function normalizeTrainingAssignment(row: DbRow): HRTrainingAssignment {
  return {
    id: asNumber(row.id),
    employee_id: asNumber(row.employee_id),
    module_id: asNumber(row.module_id),
    status: asString(row.status) as HRTrainingStatus,
    assigned_at: asDateOnly(row.assigned_at),
    completed_at: asNullableDateOnly(row.completed_at),
  };
}

function normalizeOnboardingChecklist(row: DbRow): HROnboardingChecklist {
  return {
    id: asNumber(row.id),
    employee_id: asNumber(row.employee_id),
    item_name: asString(row.item_name),
    status: asString(row.status) as "pending" | "completed",
    due_date: asNullableDateOnly(row.due_date),
    completed_at: asNullableDateOnly(row.completed_at),
  };
}

function generateEmployeeCode(): string {
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

function applyListLimit(query: string, values: unknown[], limit?: number): string {
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

export async function listHREmployees(
  options: ListHREmployeesOptions = {}
): Promise<HREmployee[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.department?.trim()) {
    values.push(options.department.trim());
    conditions.push(`department = $${values.length}`);
  }
  if (options.status?.trim()) {
    values.push(options.status.trim());
    conditions.push(`employment_status = $${values.length}`);
  }
  if (options.contractType?.trim()) {
    values.push(options.contractType.trim());
    conditions.push(`contract_type = $${values.length}`);
  }

  let query = `
    SELECT
      id, employee_code, full_name, work_email, department, contract_type, work_mode,
      employment_status, manager_employee_id, hire_date, probation_end_date,
      contract_end_date, exit_date, exit_type, created_at, updated_at
    FROM hr_employees
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY created_at DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizeEmployee);
}

export async function listHREmployeeOptions(
  options: { activeOnly?: boolean } = {}
): Promise<HREmployeeOption[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const values: unknown[] = [];

  let query = `
    SELECT id, full_name, employee_code
    FROM hr_employees
  `;

  if (options.activeOnly) {
    values.push("active");
    query += `\nWHERE employment_status = $${values.length}`;
  }

  query += "\nORDER BY full_name ASC";

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map((row) => ({
    id: asNumber(row.id),
    full_name: asString(row.full_name),
    employee_code: asString(row.employee_code),
  }));
}

export async function createHREmployee(
  input: CreateHREmployeeInput
): Promise<HREmployee> {
  await ensureDbSchema();
  const pool = getDbPool();

  const fullName = input.fullName.trim();
  if (!fullName) {
    throw new Error("fullName is required");
  }

  const employeeCode = (input.employeeCode || generateEmployeeCode()).trim();
  const department = ensureEnumValue(input.department, HR_DEPARTMENTS, "department");
  const contractType = ensureEnumValue(
    input.contractType,
    HR_CONTRACT_TYPES,
    "contractType"
  );
  const workMode = ensureEnumValue(input.workMode || "onsite", HR_WORK_MODES, "workMode");
  const employmentStatus = ensureEnumValue(
    input.employmentStatus || "active",
    HR_EMPLOYMENT_STATUSES,
    "employmentStatus"
  );

  const result = await pool.query(
    `
      INSERT INTO hr_employees (
        employee_code, full_name, work_email, department, contract_type,
        work_mode, employment_status, manager_employee_id, hire_date, probation_end_date,
        contract_end_date, exit_date, exit_type, updated_at
      )
      VALUES ($1, $2, NULLIF($3, ''), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING
        id, employee_code, full_name, work_email, department, contract_type, work_mode,
        employment_status, manager_employee_id, hire_date, probation_end_date,
        contract_end_date, exit_date, exit_type, created_at, updated_at
    `,
    [
      employeeCode,
      fullName,
      input.workEmail?.trim() || null,
      department,
      contractType,
      workMode,
      employmentStatus,
      input.managerEmployeeId ?? null,
      ensureDateOnly(input.hireDate) || new Date().toISOString().slice(0, 10),
      ensureDateOnly(input.probationEndDate),
      ensureDateOnly(input.contractEndDate),
      ensureDateOnly(input.exitDate),
      input.exitType || null,
    ]
  );

  return normalizeEmployee(asRecordRows(result.rows)[0]);
}

export async function updateHREmployeeStatus(
  employeeId: number,
  status: HREmploymentStatus,
  options?: { exitType?: HRExitType | null; exitDate?: string | null }
): Promise<HREmployee | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      UPDATE hr_employees
      SET employment_status = $2,
          exit_type = $3,
          exit_date = $4,
          updated_at = NOW()
      WHERE id = $1
      RETURNING
        id, employee_code, full_name, work_email, department, contract_type, work_mode,
        employment_status, manager_employee_id, hire_date, probation_end_date,
        contract_end_date, exit_date, exit_type, created_at, updated_at
    `,
    [employeeId, status, options?.exitType || null, ensureDateOnly(options?.exitDate)]
  );

  if (result.rows.length === 0) {
    return null;
  }
  return normalizeEmployee(asRecordRows(result.rows)[0]);
}

export async function updateHREmployee(
  employeeId: number,
  patch: UpdateHREmployeeInput
): Promise<HREmployee | null> {
  await ensureDbSchema();
  const pool = getDbPool();

  const fullName = patch.fullName.trim();
  if (!fullName) {
    throw new Error("fullName is required");
  }

  const department = ensureEnumValue(patch.department, HR_DEPARTMENTS, "department");
  const contractType = ensureEnumValue(patch.contractType, HR_CONTRACT_TYPES, "contractType");
  const workMode = ensureEnumValue(patch.workMode, HR_WORK_MODES, "workMode");
  const employmentStatus = ensureEnumValue(
    patch.employmentStatus,
    HR_EMPLOYMENT_STATUSES,
    "employmentStatus"
  );

  const result = await pool.query(
    `
      UPDATE hr_employees
      SET employee_code = COALESCE(NULLIF($2, ''), employee_code),
          full_name = $3,
          work_email = NULLIF($4, ''),
          department = $5,
          contract_type = $6,
          work_mode = $7,
          employment_status = $8,
          manager_employee_id = $9,
          hire_date = COALESCE($10, hire_date),
          contract_end_date = $11,
          exit_date = $12,
          exit_type = $13,
          updated_at = NOW()
      WHERE id = $1
      RETURNING
        id, employee_code, full_name, work_email, department, contract_type, work_mode,
        employment_status, manager_employee_id, hire_date, probation_end_date,
        contract_end_date, exit_date, exit_type, created_at, updated_at
    `,
    [
      employeeId,
      patch.employeeCode?.trim() || null,
      fullName,
      patch.workEmail?.trim() || null,
      department,
      contractType,
      workMode,
      employmentStatus,
      patch.managerEmployeeId ?? null,
      ensureDateOnly(patch.hireDate),
      ensureDateOnly(patch.contractEndDate),
      ensureDateOnly(patch.exitDate),
      patch.exitType || null,
    ]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return normalizeEmployee(asRecordRows(result.rows)[0]);
}

export type ListRecruitmentRolesOptions = {
  department?: string;
  limit?: number;
};

export type HRRecruitmentRoleOption = {
  id: number;
  title: string;
  department: HRDepartment;
  closed_at: string | null;
};

export async function listRecruitmentRoles(
  options: ListRecruitmentRolesOptions = {}
): Promise<HRRecruitmentRole[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.department?.trim()) {
    values.push(options.department.trim());
    conditions.push(`department = $${values.length}`);
  }

  let query = `
    SELECT id, title, department, hiring_stage, vacancies, opened_at, closed_at, created_at
    FROM hr_recruitment_roles
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY opened_at DESC, id DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizeRole);
}

export async function listRecruitmentRoleOptions(): Promise<HRRecruitmentRoleOption[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(`
    SELECT id, title, department, closed_at
    FROM hr_recruitment_roles
    ORDER BY closed_at ASC NULLS FIRST, opened_at DESC, id DESC
  `);

  return asRecordRows(result.rows).map((row) => ({
    id: asNumber(row.id),
    title: asString(row.title),
    department: asString(row.department) as HRDepartment,
    closed_at: asNullableDateOnly(row.closed_at),
  }));
}

export async function createRecruitmentRole(
  input: CreateRecruitmentRoleInput
): Promise<HRRecruitmentRole> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      INSERT INTO hr_recruitment_roles (
        title, department, hiring_stage, vacancies, opened_at
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, title, department, hiring_stage, vacancies, opened_at, closed_at, created_at
    `,
    [
      input.title.trim(),
      ensureEnumValue(input.department, HR_DEPARTMENTS, "department"),
      input.hiringStage?.trim() || "screening",
      Math.max(1, Number(input.vacancies || 1)),
      ensureDateOnly(input.openedAt) || new Date().toISOString().slice(0, 10),
    ]
  );
  return normalizeRole(asRecordRows(result.rows)[0]);
}

export async function updateRecruitmentRole(
  roleId: number,
  patch: { hiringStage?: string; vacancies?: number; closedAt?: string | null }
): Promise<HRRecruitmentRole | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      UPDATE hr_recruitment_roles
      SET hiring_stage = COALESCE($2, hiring_stage),
          vacancies = COALESCE($3, vacancies),
          closed_at = COALESCE($4, closed_at)
      WHERE id = $1
      RETURNING id, title, department, hiring_stage, vacancies, opened_at, closed_at, created_at
    `,
    [roleId, patch.hiringStage ?? null, patch.vacancies ?? null, ensureDateOnly(patch.closedAt)]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return normalizeRole(asRecordRows(result.rows)[0]);
}

export async function listRecruitmentApplicants(options: {
  stage?: string;
  limit?: number;
} = {}): Promise<HRRecruitmentApplicant[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.stage?.trim()) {
    values.push(options.stage.trim());
    conditions.push(`current_stage = $${values.length}`);
  }

  let query = `
    SELECT
      id, role_id, full_name, email, employment_track, current_stage,
      applied_at, offered_at, hired_at, offer_status, created_at
    FROM hr_recruitment_applicants
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY applied_at DESC, id DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizeApplicant);
}

export async function createRecruitmentApplicant(
  input: CreateRecruitmentApplicantInput
): Promise<HRRecruitmentApplicant> {
  await ensureDbSchema();
  const pool = getDbPool();

  const stage = ensureEnumValue(
    input.currentStage || "applied",
    HR_RECRUITMENT_STAGES,
    "currentStage"
  );

  const result = await pool.query(
    `
      INSERT INTO hr_recruitment_applicants (
        role_id, full_name, email, employment_track, current_stage, applied_at
      )
      VALUES ($1, $2, NULLIF($3, ''), $4, $5, $6)
      RETURNING
        id, role_id, full_name, email, employment_track, current_stage,
        applied_at, offered_at, hired_at, offer_status, created_at
    `,
    [
      input.roleId,
      input.fullName.trim(),
      input.email?.trim() || null,
      input.employmentTrack,
      stage,
      ensureDateOnly(input.appliedAt) || new Date().toISOString().slice(0, 10),
    ]
  );

  const applicant = normalizeApplicant(asRecordRows(result.rows)[0]);
  await pool.query(
    `
      INSERT INTO hr_recruitment_stage_events (applicant_id, stage)
      VALUES ($1, $2)
    `,
    [applicant.id, stage]
  );

  return applicant;
}

export async function updateRecruitmentApplicantStage(
  applicantId: number,
  stage: HRRecruitmentStage,
  patch?: { offeredAt?: string | null; hiredAt?: string | null; offerStatus?: string | null }
): Promise<HRRecruitmentApplicant | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      UPDATE hr_recruitment_applicants
      SET current_stage = $2,
          offered_at = COALESCE($3, offered_at),
          hired_at = COALESCE($4, hired_at),
          offer_status = COALESCE($5, offer_status)
      WHERE id = $1
      RETURNING
        id, role_id, full_name, email, employment_track, current_stage,
        applied_at, offered_at, hired_at, offer_status, created_at
    `,
    [
      applicantId,
      stage,
      ensureDateOnly(patch?.offeredAt),
      ensureDateOnly(patch?.hiredAt),
      patch?.offerStatus || null,
    ]
  );
  if (result.rows.length === 0) {
    return null;
  }

  await pool.query(
    `
      INSERT INTO hr_recruitment_stage_events (applicant_id, stage)
      VALUES ($1, $2)
    `,
    [applicantId, stage]
  );

  return normalizeApplicant(asRecordRows(result.rows)[0]);
}

export async function listDisciplinaryCases(options: {
  status?: string;
  limit?: number;
} = {}): Promise<HRDisciplinaryCase[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.status?.trim()) {
    values.push(options.status.trim());
    conditions.push(`status = $${values.length}`);
  }

  let query = `
    SELECT id, employee_id, category, status, summary, opened_at, due_date, resolved_at, created_at
    FROM hr_disciplinary_cases
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY opened_at DESC, id DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizeDisciplinaryCase);
}

export async function createDisciplinaryCase(
  input: CreateDisciplinaryCaseInput
): Promise<HRDisciplinaryCase> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      INSERT INTO hr_disciplinary_cases (
        employee_id, category, status, summary, opened_at, due_date
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, employee_id, category, status, summary, opened_at, due_date, resolved_at, created_at
    `,
    [
      input.employeeId ?? null,
      input.category.trim(),
      ensureEnumValue(input.status, HR_DISCIPLINARY_STATUSES, "status"),
      input.summary.trim(),
      ensureDateOnly(input.openedAt) || new Date().toISOString().slice(0, 10),
      ensureDateOnly(input.dueDate),
    ]
  );
  return normalizeDisciplinaryCase(asRecordRows(result.rows)[0]);
}

export async function updateDisciplinaryCaseStatus(
  caseId: number,
  status: HRDisciplinaryStatus
): Promise<HRDisciplinaryCase | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const resolvedAt = status === "resolved" ? new Date().toISOString().slice(0, 10) : null;
  const result = await pool.query(
    `
      UPDATE hr_disciplinary_cases
      SET status = $2,
          resolved_at = COALESCE($3, resolved_at)
      WHERE id = $1
      RETURNING id, employee_id, category, status, summary, opened_at, due_date, resolved_at, created_at
    `,
    [caseId, status, resolvedAt]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return normalizeDisciplinaryCase(asRecordRows(result.rows)[0]);
}

export async function listPolicyViolations(options: {
  severity?: string;
  limit?: number;
} = {}): Promise<HRPolicyViolation[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.severity?.trim()) {
    values.push(options.severity.trim());
    conditions.push(`severity = $${values.length}`);
  }

  let query = `
    SELECT id, employee_id, category, severity, notes, occurred_on, created_at
    FROM hr_policy_violations
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY occurred_on DESC, id DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizePolicyViolation);
}

export async function createPolicyViolation(
  input: CreatePolicyViolationInput
): Promise<HRPolicyViolation> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      INSERT INTO hr_policy_violations (
        employee_id, category, severity, notes, occurred_on
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, employee_id, category, severity, notes, occurred_on, created_at
    `,
    [
      input.employeeId ?? null,
      input.category.trim(),
      input.severity,
      input.notes?.trim() || null,
      ensureDateOnly(input.occurredOn) || new Date().toISOString().slice(0, 10),
    ]
  );
  return normalizePolicyViolation(asRecordRows(result.rows)[0]);
}

export async function listFollowupActions(options: {
  status?: string;
  limit?: number;
} = {}): Promise<HRFollowupAction[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.status?.trim()) {
    values.push(options.status.trim());
    conditions.push(`status = $${values.length}`);
  }

  let query = `
    SELECT id, employee_id, action_type, status, due_date, notes, created_at
    FROM hr_followup_actions
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY COALESCE(due_date, CURRENT_DATE + 365) ASC, id DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizeFollowupAction);
}

export async function createFollowupAction(
  input: CreateFollowupActionInput
): Promise<HRFollowupAction> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      INSERT INTO hr_followup_actions (
        employee_id, action_type, status, due_date, notes
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, employee_id, action_type, status, due_date, notes, created_at
    `,
    [
      input.employeeId ?? null,
      input.actionType.trim(),
      input.status || "pending",
      ensureDateOnly(input.dueDate),
      input.notes?.trim() || null,
    ]
  );
  return normalizeFollowupAction(asRecordRows(result.rows)[0]);
}

export async function updateFollowupActionStatus(
  actionId: number,
  status: "pending" | "in_progress" | "done"
): Promise<HRFollowupAction | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      UPDATE hr_followup_actions
      SET status = $2
      WHERE id = $1
      RETURNING id, employee_id, action_type, status, due_date, notes, created_at
    `,
    [actionId, status]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return normalizeFollowupAction(asRecordRows(result.rows)[0]);
}

export type HRPayrollCycleOption = {
  id: number;
  cycle_month: string;
  status: HRPayrollStatus;
};

export async function listPayrollCycles(options: {
  status?: string;
  limit?: number;
} = {}): Promise<HRPayrollCycle[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.status?.trim()) {
    values.push(options.status.trim());
    conditions.push(`status = $${values.length}`);
  }

  let query = `
    SELECT id, cycle_month, status, processed_at, notes, created_at
    FROM hr_payroll_cycles
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY cycle_month DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizePayrollCycle);
}

export async function listPayrollCycleOptions(): Promise<HRPayrollCycleOption[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(`
    SELECT id, cycle_month, status
    FROM hr_payroll_cycles
    ORDER BY cycle_month DESC
  `);

  return asRecordRows(result.rows).map((row) => ({
    id: asNumber(row.id),
    cycle_month: asDateOnly(row.cycle_month),
    status: asString(row.status) as HRPayrollStatus,
  }));
}

export async function createPayrollCycle(
  input: CreatePayrollCycleInput
): Promise<HRPayrollCycle> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      INSERT INTO hr_payroll_cycles (
        cycle_month, status, processed_at, notes
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (cycle_month) DO UPDATE
      SET status = EXCLUDED.status,
          processed_at = EXCLUDED.processed_at,
          notes = EXCLUDED.notes
      RETURNING id, cycle_month, status, processed_at, notes, created_at
    `,
    [
      ensureDateOnly(input.cycleMonth) ||
        new Date().toISOString().slice(0, 7).concat("-01"),
      input.status || "pending",
      ensureDateOnly(input.processedAt),
      input.notes?.trim() || null,
    ]
  );
  return normalizePayrollCycle(asRecordRows(result.rows)[0]);
}

export async function updatePayrollCycleStatus(
  cycleId: number,
  status: HRPayrollStatus
): Promise<HRPayrollCycle | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const processedAt =
    status === "processed" ? new Date().toISOString().slice(0, 10) : null;
  const result = await pool.query(
    `
      UPDATE hr_payroll_cycles
      SET status = $2,
          processed_at = COALESCE($3, processed_at)
      WHERE id = $1
      RETURNING id, cycle_month, status, processed_at, notes, created_at
    `,
    [cycleId, status, processedAt]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return normalizePayrollCycle(asRecordRows(result.rows)[0]);
}

export async function listPayrollAnomalies(options: {
  limit?: number;
} = {}): Promise<HRPayrollAnomaly[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const values: unknown[] = [];
  const query = applyListLimit(
    `
      SELECT id, payroll_cycle_id, employee_id, anomaly_type, status, details, created_at
      FROM hr_payroll_anomalies
      ORDER BY created_at DESC
    `,
    values,
    options.limit
  );
  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizePayrollAnomaly);
}

export async function createPayrollAnomaly(
  input: CreatePayrollAnomalyInput
): Promise<HRPayrollAnomaly> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      INSERT INTO hr_payroll_anomalies (
        payroll_cycle_id, employee_id, anomaly_type, status, details
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, payroll_cycle_id, employee_id, anomaly_type, status, details, created_at
    `,
    [
      input.payrollCycleId,
      input.employeeId ?? null,
      input.anomalyType.trim(),
      input.status || "open",
      input.details?.trim() || null,
    ]
  );
  return normalizePayrollAnomaly(asRecordRows(result.rows)[0]);
}

export async function updatePayrollAnomalyStatus(
  anomalyId: number,
  status: "open" | "resolved"
): Promise<HRPayrollAnomaly | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      UPDATE hr_payroll_anomalies
      SET status = $2
      WHERE id = $1
      RETURNING id, payroll_cycle_id, employee_id, anomaly_type, status, details, created_at
    `,
    [anomalyId, status]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return normalizePayrollAnomaly(asRecordRows(result.rows)[0]);
}

export async function listLeaveBalances(options: {
  limit?: number;
} = {}): Promise<HRLeaveBalance[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const values: unknown[] = [];
  const query = applyListLimit(
    `
      SELECT id, employee_id, annual_days, used_days, carry_days, updated_at
      FROM hr_leave_balances
      ORDER BY updated_at DESC
    `,
    values,
    options.limit
  );
  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizeLeaveBalance);
}

export async function upsertLeaveBalance(
  input: UpsertLeaveBalanceInput
): Promise<HRLeaveBalance> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      INSERT INTO hr_leave_balances (
        employee_id, annual_days, used_days, carry_days, updated_at
      )
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (employee_id) DO UPDATE
      SET annual_days = EXCLUDED.annual_days,
          used_days = EXCLUDED.used_days,
          carry_days = EXCLUDED.carry_days,
          updated_at = NOW()
      RETURNING id, employee_id, annual_days, used_days, carry_days, updated_at
    `,
    [
      input.employeeId,
      input.annualDays,
      input.usedDays || 0,
      input.carryDays || 0,
    ]
  );
  return normalizeLeaveBalance(asRecordRows(result.rows)[0]);
}

export async function listLeaveRequests(options: {
  status?: string;
  limit?: number;
} = {}): Promise<HRLeaveRequest[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.status?.trim()) {
    values.push(options.status.trim());
    conditions.push(`status = $${values.length}`);
  }

  let query = `
    SELECT id, employee_id, leave_type, start_date, end_date, days, status, requested_at, reviewed_at
    FROM hr_leave_requests
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY requested_at DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizeLeaveRequest);
}

export async function createLeaveRequest(
  input: CreateLeaveRequestInput
): Promise<HRLeaveRequest> {
  await ensureDbSchema();
  const pool = getDbPool();
  const status = ensureEnumValue(
    input.status || "pending",
    HR_LEAVE_REQUEST_STATUSES,
    "leaveRequestStatus"
  );
  const result = await pool.query(
    `
      INSERT INTO hr_leave_requests (
        employee_id, leave_type, start_date, end_date, days, status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, employee_id, leave_type, start_date, end_date, days, status, requested_at, reviewed_at
    `,
    [
      input.employeeId,
      input.leaveType.trim(),
      ensureDateOnly(input.startDate),
      ensureDateOnly(input.endDate),
      input.days,
      status,
    ]
  );
  return normalizeLeaveRequest(asRecordRows(result.rows)[0]);
}

export async function updateLeaveRequestStatus(
  leaveRequestId: number,
  status: HRLeaveRequestStatus
): Promise<HRLeaveRequest | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      UPDATE hr_leave_requests
      SET status = $2,
          reviewed_at = NOW()
      WHERE id = $1
      RETURNING id, employee_id, leave_type, start_date, end_date, days, status, requested_at, reviewed_at
    `,
    [leaveRequestId, status]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return normalizeLeaveRequest(asRecordRows(result.rows)[0]);
}

export async function listPerformanceReviews(options: {
  status?: string;
  limit?: number;
} = {}): Promise<HRPerformanceReview[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.status?.trim()) {
    values.push(options.status.trim());
    conditions.push(`status = $${values.length}`);
  }

  let query = `
    SELECT
      id, employee_id, review_period, due_date, completed_at, status,
      reviewer_employee_id, notes, created_at
    FROM hr_performance_reviews
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY due_date ASC, id DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizePerformanceReview);
}

export async function createPerformanceReview(
  input: CreatePerformanceReviewInput
): Promise<HRPerformanceReview> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      INSERT INTO hr_performance_reviews (
        employee_id, review_period, due_date, status, reviewer_employee_id, notes
      )
      VALUES ($1, $2, $3, 'pending', $4, $5)
      RETURNING
        id, employee_id, review_period, due_date, completed_at, status,
        reviewer_employee_id, notes, created_at
    `,
    [
      input.employeeId,
      input.reviewPeriod.trim(),
      ensureDateOnly(input.dueDate),
      input.reviewerEmployeeId ?? null,
      input.notes?.trim() || null,
    ]
  );
  return normalizePerformanceReview(asRecordRows(result.rows)[0]);
}

export async function updatePerformanceReviewStatus(
  reviewId: number,
  status: HRReviewStatus
): Promise<HRPerformanceReview | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const completedAt =
    status === "completed" ? new Date().toISOString().slice(0, 10) : null;
  const result = await pool.query(
    `
      UPDATE hr_performance_reviews
      SET status = $2,
          completed_at = COALESCE($3, completed_at)
      WHERE id = $1
      RETURNING
        id, employee_id, review_period, due_date, completed_at, status,
        reviewer_employee_id, notes, created_at
    `,
    [reviewId, status, completedAt]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return normalizePerformanceReview(asRecordRows(result.rows)[0]);
}

export async function listPips(options: {
  status?: string;
  limit?: number;
} = {}): Promise<HRPip[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.status?.trim()) {
    values.push(options.status.trim());
    conditions.push(`status = $${values.length}`);
  }

  let query = `
    SELECT id, employee_id, status, start_date, end_date, progress_note, last_updated
    FROM hr_pips
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY last_updated DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizePip);
}

export async function createPip(input: CreatePipInput): Promise<HRPip> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      INSERT INTO hr_pips (
        employee_id, status, start_date, end_date, progress_note, last_updated
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, employee_id, status, start_date, end_date, progress_note, last_updated
    `,
    [
      input.employeeId,
      ensureEnumValue(input.status, HR_PIP_STATUSES, "pipStatus"),
      ensureDateOnly(input.startDate),
      ensureDateOnly(input.endDate),
      input.progressNote?.trim() || null,
    ]
  );
  return normalizePip(asRecordRows(result.rows)[0]);
}

export async function updatePipStatus(
  pipId: number,
  status: HRPipStatus,
  progressNote?: string | null
): Promise<HRPip | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      UPDATE hr_pips
      SET status = $2,
          progress_note = COALESCE($3, progress_note),
          last_updated = NOW()
      WHERE id = $1
      RETURNING id, employee_id, status, start_date, end_date, progress_note, last_updated
    `,
    [pipId, status, progressNote?.trim() || null]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return normalizePip(asRecordRows(result.rows)[0]);
}

export async function listKpiScores(options: {
  limit?: number;
} = {}): Promise<HRKpiScore[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const values: unknown[] = [];
  const query = applyListLimit(
    `
      SELECT id, employee_id, metric_name, score, period_start, period_end, created_at
      FROM hr_kpi_scores
      ORDER BY period_end DESC, created_at DESC
    `,
    values,
    options.limit
  );
  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizeKpiScore);
}

export async function createKpiScore(input: CreateKpiScoreInput): Promise<HRKpiScore> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      INSERT INTO hr_kpi_scores (
        employee_id, metric_name, score, period_start, period_end
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, employee_id, metric_name, score, period_start, period_end, created_at
    `,
    [
      input.employeeId,
      input.metricName.trim(),
      input.score,
      ensureDateOnly(input.periodStart),
      ensureDateOnly(input.periodEnd),
    ]
  );
  return normalizeKpiScore(asRecordRows(result.rows)[0]);
}

export type HRTrainingModuleOption = {
  id: number;
  code: string;
  title: string;
  category: string;
};

export async function listTrainingModules(options: {
  category?: string;
  limit?: number;
} = {}): Promise<HRTrainingModule[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.category?.trim()) {
    values.push(options.category.trim());
    conditions.push(`LOWER(category) = LOWER($${values.length})`);
  }

  let query = `
    SELECT id, code, title, category, duration_hours, active, created_at
    FROM hr_training_modules
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY category ASC, title ASC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizeTrainingModule);
}

export async function listTrainingModuleOptions(): Promise<HRTrainingModuleOption[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(`
    SELECT id, code, title, category
    FROM hr_training_modules
    WHERE active = TRUE
    ORDER BY category ASC, title ASC
  `);

  return asRecordRows(result.rows).map((row) => ({
    id: asNumber(row.id),
    code: asString(row.code),
    title: asString(row.title),
    category: asString(row.category),
  }));
}

export async function createTrainingModule(
  input: CreateTrainingModuleInput
): Promise<HRTrainingModule> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      INSERT INTO hr_training_modules (
        code, title, category, duration_hours, active
      )
      VALUES ($1, $2, $3, $4, TRUE)
      ON CONFLICT (code) DO UPDATE
      SET title = EXCLUDED.title,
          category = EXCLUDED.category,
          duration_hours = EXCLUDED.duration_hours
      RETURNING id, code, title, category, duration_hours, active, created_at
    `,
    [input.code.trim(), input.title.trim(), input.category.trim(), input.durationHours ?? 0]
  );
  return normalizeTrainingModule(asRecordRows(result.rows)[0]);
}

export async function listTrainingAssignments(options: {
  status?: string;
  limit?: number;
} = {}): Promise<HRTrainingAssignment[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.status?.trim()) {
    values.push(options.status.trim());
    conditions.push(`status = $${values.length}`);
  }

  let query = `
    SELECT id, employee_id, module_id, status, assigned_at, completed_at
    FROM hr_training_assignments
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY assigned_at DESC, id DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizeTrainingAssignment);
}

export async function createTrainingAssignment(
  input: CreateTrainingAssignmentInput
): Promise<HRTrainingAssignment> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      INSERT INTO hr_training_assignments (
        employee_id, module_id, status, assigned_at
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, employee_id, module_id, status, assigned_at, completed_at
    `,
    [
      input.employeeId,
      input.moduleId,
      ensureEnumValue(input.status || "assigned", HR_TRAINING_STATUSES, "trainingStatus"),
      ensureDateOnly(input.assignedAt) || new Date().toISOString().slice(0, 10),
    ]
  );
  return normalizeTrainingAssignment(asRecordRows(result.rows)[0]);
}

export async function updateTrainingAssignmentStatus(
  assignmentId: number,
  status: HRTrainingStatus
): Promise<HRTrainingAssignment | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const completedAt =
    status === "completed" ? new Date().toISOString().slice(0, 10) : null;
  const result = await pool.query(
    `
      UPDATE hr_training_assignments
      SET status = $2,
          completed_at = COALESCE($3, completed_at)
      WHERE id = $1
      RETURNING id, employee_id, module_id, status, assigned_at, completed_at
    `,
    [assignmentId, status, completedAt]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return normalizeTrainingAssignment(asRecordRows(result.rows)[0]);
}

export async function listOnboardingChecklists(options: {
  limit?: number;
} = {}): Promise<HROnboardingChecklist[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const values: unknown[] = [];
  const query = applyListLimit(
    `
      SELECT id, employee_id, item_name, status, due_date, completed_at
      FROM hr_onboarding_checklists
      ORDER BY due_date ASC NULLS LAST, id DESC
    `,
    values,
    options.limit
  );
  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizeOnboardingChecklist);
}

export async function createOnboardingChecklistItem(
  input: CreateOnboardingChecklistInput
): Promise<HROnboardingChecklist> {
  await ensureDbSchema();
  const pool = getDbPool();
  const status = input.status === "completed" ? "completed" : "pending";
  const result = await pool.query(
    `
      INSERT INTO hr_onboarding_checklists (
        employee_id, item_name, status, due_date, completed_at
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, employee_id, item_name, status, due_date, completed_at
    `,
    [
      input.employeeId,
      input.itemName.trim(),
      status,
      ensureDateOnly(input.dueDate),
      status === "completed" ? new Date().toISOString().slice(0, 10) : null,
    ]
  );
  return normalizeOnboardingChecklist(asRecordRows(result.rows)[0]);
}

export async function updateOnboardingChecklistStatus(
  checklistId: number,
  status: "pending" | "completed"
): Promise<HROnboardingChecklist | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const completedAt = status === "completed" ? new Date().toISOString().slice(0, 10) : null;
  const result = await pool.query(
    `
      UPDATE hr_onboarding_checklists
      SET status = $2,
          completed_at = COALESCE($3, completed_at)
      WHERE id = $1
      RETURNING id, employee_id, item_name, status, due_date, completed_at
    `,
    [checklistId, status, completedAt]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return normalizeOnboardingChecklist(asRecordRows(result.rows)[0]);
}

export type HRRecruitmentModuleData = {
  roles: HRRecruitmentRole[];
  applicants: HRRecruitmentApplicant[];
};

export type HRHeadcountModuleData = {
  employees: HREmployee[];
  totalActive: number;
  newHiresMonth: number;
  newHiresQuarter: number;
  attritionRate: number;
  exitsVoluntary: number;
  exitsInvoluntary: number;
};

export type HRComplianceModuleData = {
  cases: HRDisciplinaryCase[];
  violations: HRPolicyViolation[];
  actions: HRFollowupAction[];
};

export type HRPayrollLeaveModuleData = {
  payrollCycles: HRPayrollCycle[];
  payrollAnomalies: HRPayrollAnomaly[];
  leaveBalances: HRLeaveBalance[];
  leaveRequests: HRLeaveRequest[];
};

export type HRPerformanceModuleData = {
  reviews: HRPerformanceReview[];
  pips: HRPip[];
  kpiScores: HRKpiScore[];
};

export type HRTrainingModuleData = {
  modules: HRTrainingModule[];
  assignments: HRTrainingAssignment[];
  onboarding: HROnboardingChecklist[];
};

export async function getRecruitmentModuleData(filters: {
  department?: string;
  stage?: string;
} = {}): Promise<HRRecruitmentModuleData> {
  const [roles, applicants] = await Promise.all([
    listRecruitmentRoles({ department: filters.department }),
    listRecruitmentApplicants({ stage: filters.stage }),
  ]);
  return { roles, applicants };
}

export async function getHeadcountModuleData(filters: {
  department?: string;
  status?: string;
  contractType?: string;
} = {}): Promise<HRHeadcountModuleData> {
  await ensureDbSchema();
  const pool = getDbPool();

  const [employees, newHiresRes, attritionRes, activeHeadcountRes] = await Promise.all([
    listHREmployees(filters),
    pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE DATE_TRUNC('month', hire_date) = DATE_TRUNC('month', CURRENT_DATE)
        )::int AS month_count,
        COUNT(*) FILTER (
          WHERE DATE_TRUNC('quarter', hire_date) = DATE_TRUNC('quarter', CURRENT_DATE)
        )::int AS quarter_count
      FROM hr_employees
    `),
    pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE exit_date IS NOT NULL
            AND DATE_TRUNC('quarter', exit_date) = DATE_TRUNC('quarter', CURRENT_DATE)
        )::int AS exits_quarter,
        COUNT(*) FILTER (
          WHERE exit_date IS NOT NULL
            AND DATE_TRUNC('quarter', exit_date) = DATE_TRUNC('quarter', CURRENT_DATE)
            AND exit_type = 'voluntary'
        )::int AS exits_voluntary,
        COUNT(*) FILTER (
          WHERE exit_date IS NOT NULL
            AND DATE_TRUNC('quarter', exit_date) = DATE_TRUNC('quarter', CURRENT_DATE)
            AND exit_type = 'involuntary'
        )::int AS exits_involuntary,
        COUNT(*) FILTER (WHERE employment_status = 'active')::int AS active_staff
      FROM hr_employees
    `),
    pool.query(`
      SELECT COUNT(*)::int AS total_active
      FROM hr_employees
      WHERE employment_status = 'active'
    `),
  ]);

  const newHiresRow = asRecordRows(newHiresRes.rows)[0] ?? {};
  const attritionRow = asRecordRows(attritionRes.rows)[0] ?? {};
  const totalActiveRow = asRecordRows(activeHeadcountRes.rows)[0] ?? {};
  const activeStaff = asNumber(attritionRow.active_staff);
  const exitsQuarter = asNumber(attritionRow.exits_quarter);

  return {
    employees,
    totalActive: asNumber(totalActiveRow.total_active),
    newHiresMonth: asNumber(newHiresRow.month_count),
    newHiresQuarter: asNumber(newHiresRow.quarter_count),
    attritionRate: activeStaff === 0 ? 0 : (exitsQuarter / activeStaff) * 100,
    exitsVoluntary: asNumber(attritionRow.exits_voluntary),
    exitsInvoluntary: asNumber(attritionRow.exits_involuntary),
  };
}

export async function getComplianceModuleData(filters: {
  status?: string;
  severity?: string;
} = {}): Promise<HRComplianceModuleData> {
  const [cases, violations, actions] = await Promise.all([
    listDisciplinaryCases({ status: filters.status }),
    listPolicyViolations({ severity: filters.severity }),
    listFollowupActions(),
  ]);
  return { cases, violations, actions };
}

export async function getPayrollLeaveModuleData(filters: {
  cycleStatus?: string;
  leaveStatus?: string;
} = {}): Promise<HRPayrollLeaveModuleData> {
  const [payrollCycles, payrollAnomalies, leaveBalances, leaveRequests] =
    await Promise.all([
      listPayrollCycles({ status: filters.cycleStatus }),
      listPayrollAnomalies(),
      listLeaveBalances(),
      listLeaveRequests({ status: filters.leaveStatus }),
    ]);
  return { payrollCycles, payrollAnomalies, leaveBalances, leaveRequests };
}

export async function getPerformanceModuleData(filters: {
  reviewStatus?: string;
  pipStatus?: string;
} = {}): Promise<HRPerformanceModuleData> {
  const [reviews, pips, kpiScores] = await Promise.all([
    listPerformanceReviews({ status: filters.reviewStatus }),
    listPips({ status: filters.pipStatus }),
    listKpiScores(),
  ]);
  return { reviews, pips, kpiScores };
}

export async function getTrainingModuleData(filters: {
  category?: string;
  assignmentStatus?: string;
} = {}): Promise<HRTrainingModuleData> {
  const [modules, assignments, onboarding] = await Promise.all([
    listTrainingModules({ category: filters.category }),
    listTrainingAssignments({ status: filters.assignmentStatus }),
    listOnboardingChecklists(),
  ]);
  return { modules, assignments, onboarding };
}

export async function logImportRun(input: {
  scope: string;
  dryRun: boolean;
  rowsTotal: number;
  rowsSuccess: number;
  rowsFailed: number;
}): Promise<void> {
  await ensureDbSchema();
  const pool = getDbPool();
  await pool.query(
    `
      INSERT INTO hr_import_runs (scope, dry_run, rows_total, rows_success, rows_failed)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [input.scope, input.dryRun, input.rowsTotal, input.rowsSuccess, input.rowsFailed]
  );
}

export type HRImportRun = {
  id: number;
  scope: string;
  dry_run: boolean;
  rows_total: number;
  rows_success: number;
  rows_failed: number;
  created_at: string;
};

export async function listImportRuns(limit = 50): Promise<HRImportRun[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const safeLimit = Math.max(1, Math.min(200, Number(limit)));

  const result = await pool.query(
    `
      SELECT
        id, scope, dry_run, rows_total, rows_success, rows_failed, created_at
      FROM hr_import_runs
      ORDER BY created_at DESC
      LIMIT $1
    `,
    [safeLimit]
  );

  return asRecordRows(result.rows).map((row) => ({
    id: asNumber(row.id),
    scope: asString(row.scope),
    dry_run: asBoolean(row.dry_run),
    rows_total: asNumber(row.rows_total),
    rows_success: asNumber(row.rows_success),
    rows_failed: asNumber(row.rows_failed),
    created_at: asString(row.created_at),
  }));
}

export async function getHRDashboardSummary(): Promise<HRDashboardSummary> {
  await ensureDbSchema();
  const pool = getDbPool();

  const [
    openRolesRes,
    funnelRes,
    timeToHireRes,
    offerRateRes,
    hireBreakdownRes,
    activeHeadcountRes,
    newHiresRes,
    attritionRes,
    contractSplitRes,
    casesRes,
    violationsRes,
    followupsRes,
    renewalsRes,
    payrollRes,
    leavePendingRes,
    anomaliesRes,
    reviewsRes,
    pipsRes,
    kpiRes,
    onboardingRes,
    trainingRes,
    csTrainingRes,
    alertsRes,
  ] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*)::int AS open_roles,
        COALESCE(AVG((CURRENT_DATE - opened_at)::numeric), 0)::float AS avg_days_open
      FROM hr_recruitment_roles
      WHERE closed_at IS NULL
    `),
    pool.query(`
      SELECT current_stage, COUNT(*)::int AS count
      FROM hr_recruitment_applicants
      GROUP BY current_stage
    `),
    pool.query(`
      SELECT COALESCE(AVG((hired_at - applied_at)::numeric), 0)::float AS time_to_hire_days
      FROM hr_recruitment_applicants
      WHERE hired_at IS NOT NULL
    `),
    pool.query(`
      SELECT
        CASE
          WHEN COUNT(*) FILTER (WHERE offer_status IS NOT NULL) = 0 THEN 0
          ELSE (
            COUNT(*) FILTER (WHERE offer_status = 'accepted')::float
            / COUNT(*) FILTER (WHERE offer_status IS NOT NULL)::float
          ) * 100
        END AS offer_acceptance_rate
      FROM hr_recruitment_applicants
    `),
    pool.query(`
      SELECT employment_track, COUNT(*)::int AS count
      FROM hr_recruitment_applicants
      WHERE hired_at IS NOT NULL
      GROUP BY employment_track
    `),
    pool.query(`
      SELECT
        COUNT(*)::int AS total_active,
        department,
        COUNT(*)::int AS count
      FROM hr_employees
      WHERE employment_status = 'active'
      GROUP BY department
    `),
    pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE DATE_TRUNC('month', hire_date) = DATE_TRUNC('month', CURRENT_DATE)
        )::int AS month_count,
        COUNT(*) FILTER (
          WHERE DATE_TRUNC('quarter', hire_date) = DATE_TRUNC('quarter', CURRENT_DATE)
        )::int AS quarter_count
      FROM hr_employees
    `),
    pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE exit_date IS NOT NULL
            AND DATE_TRUNC('quarter', exit_date) = DATE_TRUNC('quarter', CURRENT_DATE)
        )::int AS exits_quarter,
        COUNT(*) FILTER (
          WHERE exit_date IS NOT NULL
            AND DATE_TRUNC('quarter', exit_date) = DATE_TRUNC('quarter', CURRENT_DATE)
            AND exit_type = 'voluntary'
        )::int AS exits_voluntary,
        COUNT(*) FILTER (
          WHERE exit_date IS NOT NULL
            AND DATE_TRUNC('quarter', exit_date) = DATE_TRUNC('quarter', CURRENT_DATE)
            AND exit_type = 'involuntary'
        )::int AS exits_involuntary,
        COUNT(*) FILTER (WHERE employment_status = 'active')::int AS active_staff
      FROM hr_employees
    `),
    pool.query(`
      SELECT contract_type, COUNT(*)::int AS count
      FROM hr_employees
      WHERE employment_status = 'active'
      GROUP BY contract_type
    `),
    pool.query(`
      SELECT status, COUNT(*)::int AS count
      FROM hr_disciplinary_cases
      GROUP BY status
    `),
    pool.query(`
      SELECT category, COUNT(*)::int AS count
      FROM hr_policy_violations
      GROUP BY category
    `),
    pool.query(`
      SELECT COUNT(*)::int AS pending_followups
      FROM hr_followup_actions
      WHERE status <> 'done'
    `),
    pool.query(`
      SELECT COUNT(*)::int AS renewals_due
      FROM hr_employees
      WHERE employment_status = 'active'
        AND contract_end_date IS NOT NULL
        AND contract_end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
    `),
    pool.query(`
      SELECT status, COUNT(*)::int AS count
      FROM hr_payroll_cycles
      GROUP BY status
    `),
    pool.query(`
      SELECT COUNT(*)::int AS pending_leave
      FROM hr_leave_requests
      WHERE status = 'pending'
    `),
    pool.query(`
      SELECT COUNT(*)::int AS open_anomalies
      FROM hr_payroll_anomalies
      WHERE status = 'open'
    `),
    pool.query(`
      SELECT
        COUNT(*)::int AS total_reviews,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_reviews,
        COUNT(*) FILTER (
          WHERE due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
            AND status <> 'completed'
        )::int AS upcoming_reviews
      FROM hr_performance_reviews
    `),
    pool.query(`
      SELECT COUNT(*)::int AS active_pips
      FROM hr_pips
      WHERE status IN ('active', 'improving')
    `),
    pool.query(`
      SELECT COALESCE(AVG(score), 0)::float AS avg_kpi
      FROM hr_kpi_scores
      WHERE period_end >= CURRENT_DATE - INTERVAL '90 days'
    `),
    pool.query(`
      SELECT
        COUNT(*)::int AS total_items,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_items
      FROM hr_onboarding_checklists
    `),
    pool.query(`
      SELECT
        COUNT(*)::int AS assigned_count,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_count
      FROM hr_training_assignments
    `),
    pool.query(`
      SELECT
        COUNT(*)::int AS assigned_count,
        COUNT(*) FILTER (WHERE ta.status = 'completed')::int AS completed_count
      FROM hr_training_assignments ta
      INNER JOIN hr_training_modules tm ON tm.id = ta.module_id
      WHERE LOWER(tm.category) LIKE 'cs%'
         OR LOWER(tm.title) LIKE '%customer service%'
    `),
    pool.query(`
      SELECT *
      FROM (
        SELECT
          CONCAT('followup-', id::text) AS id,
          'follow_up' AS type,
          action_type AS label,
          due_date::text AS due_on,
          CASE
            WHEN due_date IS NOT NULL AND due_date < CURRENT_DATE THEN 'high'
            ELSE 'medium'
          END AS severity
        FROM hr_followup_actions
        WHERE status <> 'done'
          AND due_date IS NOT NULL
          AND due_date <= CURRENT_DATE + INTERVAL '30 days'

        UNION ALL

        SELECT
          CONCAT('probation-', id::text) AS id,
          'probation_end' AS type,
          CONCAT(full_name, ' probation ends') AS label,
          probation_end_date::text AS due_on,
          'medium' AS severity
        FROM hr_employees
        WHERE employment_status = 'active'
          AND probation_end_date IS NOT NULL
          AND probation_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'

        UNION ALL

        SELECT
          CONCAT('contract-', id::text) AS id,
          'contract_expiry' AS type,
          CONCAT(full_name, ' contract expires') AS label,
          contract_end_date::text AS due_on,
          'high' AS severity
        FROM hr_employees
        WHERE employment_status = 'active'
          AND contract_end_date IS NOT NULL
          AND contract_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      ) alerts
      ORDER BY due_on ASC NULLS LAST
      LIMIT 12
    `),
  ]);

  const funnelTemplate: Record<HRRecruitmentStage, number> = {
    applied: 0,
    screened: 0,
    interviewed: 0,
    offered: 0,
    hired: 0,
  };
  for (const row of asRecordRows(funnelRes.rows)) {
    const stage = asString(row.current_stage) as HRRecruitmentStage;
    if (stage in funnelTemplate) {
      funnelTemplate[stage] = asNumber(row.count);
    }
  }

  const hires = { intern: 0, full_time: 0 };
  for (const row of asRecordRows(hireBreakdownRes.rows)) {
    const track = asString(row.employment_track);
    if (track === "intern") {
      hires.intern = asNumber(row.count);
    }
    if (track === "full_time") {
      hires.full_time = asNumber(row.count);
    }
  }

  const byDepartment: Record<HRDepartment, number> = {
    Operations: 0,
    Marketing: 0,
    Tech: 0,
    "Finance & Compliance": 0,
    "HR & Admin": 0,
  };
  let totalActive = 0;
  for (const row of asRecordRows(activeHeadcountRes.rows)) {
    const department = asString(row.department) as HRDepartment;
    const count = asNumber(row.count);
    if (department in byDepartment) {
      byDepartment[department] = count;
      totalActive += count;
    }
  }

  const contractSplit: Record<HRContractType, number> = {
    full_time: 0,
    part_time: 0,
    intern: 0,
    contractor: 0,
  };
  for (const row of asRecordRows(contractSplitRes.rows)) {
    const contractType = asString(row.contract_type) as HRContractType;
    if (contractType in contractSplit) {
      contractSplit[contractType] = asNumber(row.count);
    }
  }

  const complianceByStatus: Record<HRDisciplinaryStatus, number> = {
    warning_issued: 0,
    resolved: 0,
    escalated: 0,
  };
  let openCases = 0;
  for (const row of asRecordRows(casesRes.rows)) {
    const status = asString(row.status) as HRDisciplinaryStatus;
    const count = asNumber(row.count);
    if (status in complianceByStatus) {
      complianceByStatus[status] = count;
      if (status !== "resolved") {
        openCases += count;
      }
    }
  }

  const policyViolations: Record<string, number> = {};
  for (const row of asRecordRows(violationsRes.rows)) {
    policyViolations[asString(row.category)] = asNumber(row.count);
  }

  const payrollByStatus: Record<HRPayrollStatus, number> = {
    processed: 0,
    pending: 0,
    issues_flagged: 0,
  };
  for (const row of asRecordRows(payrollRes.rows)) {
    const status = asString(row.status) as HRPayrollStatus;
    if (status in payrollByStatus) {
      payrollByStatus[status] = asNumber(row.count);
    }
  }

  const attritionRow = asRecordRows(attritionRes.rows)[0] as DbRow | undefined;
  const exitsQuarter = asNumber(attritionRow?.exits_quarter);
  const exitsVoluntary = asNumber(attritionRow?.exits_voluntary);
  const exitsInvoluntary = asNumber(attritionRow?.exits_involuntary);
  const activeStaff = asNumber(attritionRow?.active_staff);
  const attritionRate =
    activeStaff + exitsQuarter === 0
      ? 0
      : (exitsQuarter / (activeStaff + exitsQuarter)) * 100;

  const reviewsRow = asRecordRows(reviewsRes.rows)[0] as DbRow | undefined;
  const totalReviews = asNumber(reviewsRow?.total_reviews);
  const completedReviews = asNumber(reviewsRow?.completed_reviews);
  const reviewCompletionRate =
    totalReviews === 0 ? 0 : (completedReviews / totalReviews) * 100;

  const onboardingRow = asRecordRows(onboardingRes.rows)[0] as DbRow | undefined;
  const onboardingTotal = asNumber(onboardingRow?.total_items);
  const onboardingCompleted = asNumber(onboardingRow?.completed_items);
  const onboardingCompletionRate =
    onboardingTotal === 0 ? 0 : (onboardingCompleted / onboardingTotal) * 100;

  const trainingRow = asRecordRows(trainingRes.rows)[0] as DbRow | undefined;
  const csTrainingRow = asRecordRows(csTrainingRes.rows)[0] as DbRow | undefined;
  const csAssigned = asNumber(csTrainingRow?.assigned_count);
  const csCompleted = asNumber(csTrainingRow?.completed_count);
  const csCompletionRate = csAssigned === 0 ? 0 : (csCompleted / csAssigned) * 100;

  return {
    recruitment: {
      open_roles: asNumber((asRecordRows(openRolesRes.rows)[0] as DbRow)?.open_roles),
      avg_days_open: asNumber((asRecordRows(openRolesRes.rows)[0] as DbRow)?.avg_days_open),
      funnel: funnelTemplate,
      time_to_hire_days: asNumber(
        (asRecordRows(timeToHireRes.rows)[0] as DbRow)?.time_to_hire_days
      ),
      offer_acceptance_rate: asNumber(
        (asRecordRows(offerRateRes.rows)[0] as DbRow)?.offer_acceptance_rate
      ),
      intern_hires: hires.intern,
      full_time_hires: hires.full_time,
    },
    headcount: {
      total_active: totalActive,
      by_department: byDepartment,
      new_hires_month: asNumber((asRecordRows(newHiresRes.rows)[0] as DbRow)?.month_count),
      new_hires_quarter: asNumber(
        (asRecordRows(newHiresRes.rows)[0] as DbRow)?.quarter_count
      ),
      attrition_rate: attritionRate,
      exits_voluntary: exitsVoluntary,
      exits_involuntary: exitsInvoluntary,
      contract_split: contractSplit,
    },
    compliance: {
      open_cases: openCases,
      by_status: complianceByStatus,
      policy_violations: policyViolations,
      pending_followups: asNumber(
        (asRecordRows(followupsRes.rows)[0] as DbRow)?.pending_followups
      ),
      contract_renewals_due: asNumber(
        (asRecordRows(renewalsRes.rows)[0] as DbRow)?.renewals_due
      ),
    },
    payroll_leave: {
      payroll_by_status: payrollByStatus,
      leave_pending_approval: asNumber(
        (asRecordRows(leavePendingRes.rows)[0] as DbRow)?.pending_leave
      ),
      anomalies_open: asNumber(
        (asRecordRows(anomaliesRes.rows)[0] as DbRow)?.open_anomalies
      ),
    },
    performance: {
      upcoming_reviews: asNumber(reviewsRow?.upcoming_reviews),
      review_completion_rate: reviewCompletionRate,
      active_pips: asNumber((asRecordRows(pipsRes.rows)[0] as DbRow)?.active_pips),
      direct_report_kpi_points: asNumber((asRecordRows(kpiRes.rows)[0] as DbRow)?.avg_kpi),
    },
    training: {
      onboarding_completion_rate: onboardingCompletionRate,
      modules_assigned: asNumber(trainingRow?.assigned_count),
      modules_completed: asNumber(trainingRow?.completed_count),
      cs_curriculum_completion_rate: csCompletionRate,
    },
    alerts: asRecordRows(alertsRes.rows).map((row) => ({
      id: asString(row.id),
      type: asString(row.type),
      label: asString(row.label),
      due_on: asNullableString(row.due_on),
      severity: (asString(row.severity) as "low" | "medium" | "high") || "medium",
    })),
  };
}
