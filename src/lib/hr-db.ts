import { ensureDbSchema, getDbPool } from "@/lib/db";
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
import {
  applyListLimit,
  asDateOnly,
  asNullableDateOnly,
  asNullableString,
  asNumber,
  asRecordRows,
  asString,
  ensureDateOnly,
  ensureEnumValue,
  generateEmployeeCode,
  normalizeApplicant,
  normalizeDisciplinaryCase,
  normalizeEmployee,
  normalizeFollowupAction,
  normalizeKpiScore,
  normalizeLeaveBalance,
  normalizeLeaveRequest,
  normalizeOnboardingChecklist,
  normalizePayrollAnomaly,
  normalizePayrollCycle,
  normalizePerformanceReview,
  normalizePip,
  normalizePolicyViolation,
  normalizeRole,
  normalizeTrainingAssignment,
  normalizeTrainingModule,
  type HREmployeeOption,
  type ListHREmployeesOptions,
} from "@/lib/hr/shared";
import type {
  CreateDisciplinaryCaseInput,
  CreateFollowupActionInput,
  CreateHREmployeeInput,
  CreateKpiScoreInput,
  CreateLeaveRequestInput,
  CreateOnboardingChecklistInput,
  CreatePayrollAnomalyInput,
  CreatePayrollCycleInput,
  CreatePerformanceReviewInput,
  CreatePipInput,
  CreatePolicyViolationInput,
  CreateRecruitmentApplicantInput,
  CreateRecruitmentRoleInput,
  CreateTrainingAssignmentInput,
  CreateTrainingModuleInput,
  UpdateHREmployeeInput,
  UpsertLeaveBalanceInput,
} from "@/lib/hr/types";

export * from "@/lib/hr/types";
export {
  applyListLimit,
  asBoolean,
  asDateOnly,
  asNullableDateOnly,
  asNullableNumber,
  asNullableString,
  asNumber,
  asRecordRows,
  asString,
  ensureDateOnly,
  ensureEnumValue,
  generateEmployeeCode,
  normalizeApplicant,
  normalizeDisciplinaryCase,
  normalizeEmployee,
  normalizeFollowupAction,
  normalizeKpiScore,
  normalizeLeaveBalance,
  normalizeLeaveRequest,
  normalizeOnboardingChecklist,
  normalizePayrollAnomaly,
  normalizePayrollCycle,
  normalizePerformanceReview,
  normalizePip,
  normalizePolicyViolation,
  normalizeRole,
  normalizeTrainingAssignment,
  normalizeTrainingModule,
  type DbRow,
  type HREmployeeOption,
  type ListHREmployeesOptions,
} from "@/lib/hr/shared";

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

export { logImportRun, listImportRuns, type HRImportRun } from "@/lib/hr/import-runs";
export { getHRDashboardSummary } from "@/lib/hr/dashboard";
