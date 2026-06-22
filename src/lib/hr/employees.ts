import { ensureDbSchema, getDbPool } from "@/lib/db";
import type { HREmployee, HREmploymentStatus, HRExitType } from "@/lib/types";
import {
  HR_CONTRACT_TYPES,
  HR_DEPARTMENTS,
  HR_EMPLOYMENT_STATUSES,
  HR_WORK_MODES,
} from "@/lib/types";
import {
  applyListLimit,
  asNumber,
  asRecordRows,
  asString,
  ensureDateOnly,
  ensureEnumValue,
  generateEmployeeCode,
  normalizeEmployee,
  type HREmployeeOption,
  type ListHREmployeesOptions,
} from "@/lib/hr/shared";
import type { CreateHREmployeeInput, UpdateHREmployeeInput } from "@/lib/hr/types";

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

export async function deleteHREmployee(employeeId: number): Promise<boolean> {
  await ensureDbSchema();
  const pool = getDbPool();

  const existing = await pool.query<{ full_name: string }>(
    `SELECT full_name FROM hr_employees WHERE id = $1 LIMIT 1`,
    [employeeId]
  );
  if (existing.rows.length === 0) {
    return false;
  }

  const fullName = asString(existing.rows[0].full_name);

  const result = await pool.query(`DELETE FROM hr_employees WHERE id = $1 RETURNING id`, [
    employeeId,
  ]);
  if ((result.rowCount ?? 0) === 0) {
    return false;
  }

  await pool.query(`DELETE FROM employees WHERE LOWER(btrim(name)) = LOWER($1)`, [fullName]);

  return true;
}
