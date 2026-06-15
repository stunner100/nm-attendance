import { randomUUID } from "crypto";

import { parseCsv } from "@/lib/csv";
import { ensureDbSchema, getDbPool } from "@/lib/db";
import { logImportRun } from "@/lib/hr/import-runs";
import {
  HR_CONTRACT_TYPES,
  HR_DEPARTMENTS,
  HR_EMPLOYMENT_STATUSES,
  HR_EXIT_TYPES,
  HR_LEAVE_REQUEST_STATUSES,
  HR_PAYROLL_STATUSES,
  HR_RECRUITMENT_STAGES,
} from "@/lib/types";

export const HR_IMPORT_SCOPES = [
  "employees",
  "recruitment",
  "leave",
  "payroll",
] as const;

export type HRImportScope = (typeof HR_IMPORT_SCOPES)[number];

export type HRImportRowError = {
  row: number;
  message: string;
};

export type HRImportResult = {
  scope: HRImportScope;
  dryRun: boolean;
  rowsTotal: number;
  rowsSuccess: number;
  rowsFailed: number;
  errors: HRImportRowError[];
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function normalizeRow(row: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[normalizeHeader(key)] = value.trim();
  }
  return normalized;
}

function readValue(row: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = row[normalizeHeader(key)];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function parseOptionalDate(value: string): string | null {
  if (!value.trim()) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return parsed.toISOString().slice(0, 10);
}

function parseRequiredDate(value: string, field: string): string {
  const parsed = parseOptionalDate(value);
  if (!parsed) {
    throw new Error(`${field} is required`);
  }
  return parsed;
}

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid number: ${value}`);
  }
  return parsed;
}

function ensureEnum<T extends readonly string[]>(
  value: string,
  values: T,
  field: string
): T[number] {
  if (!values.includes(value as T[number])) {
    const allowed = values.join(", ");
    throw new Error(
      `Invalid ${field}: "${value}". Must be one of: ${allowed}`
    );
  }
  return value as T[number];
}

function collectRows(csv: string): Array<Record<string, string>> {
  const parsed = parseCsv(csv);
  return parsed.rows.map(normalizeRow);
}

function asScope(value: string): HRImportScope | null {
  if (HR_IMPORT_SCOPES.includes(value as HRImportScope)) {
    return value as HRImportScope;
  }
  return null;
}

async function importEmployees(
  rows: Array<Record<string, string>>,
  dryRun: boolean
): Promise<HRImportResult> {
  const pool = getDbPool();
  const errors: HRImportRowError[] = [];
  let rowsSuccess = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const row = rows[index];

    try {
      const employeeCode = readValue(row, ["employee_code"]);
      const fullName = readValue(row, ["full_name", "name"]);
      const workEmail = readValue(row, ["work_email", "email"]) || null;
      const department = ensureEnum(
        readValue(row, ["department"]),
        HR_DEPARTMENTS,
        "department"
      );
      const contractType = ensureEnum(
        readValue(row, ["contract_type"]),
        HR_CONTRACT_TYPES,
        "contract_type"
      );
      const employmentStatus = ensureEnum(
        readValue(row, ["employment_status"]) || "active",
        HR_EMPLOYMENT_STATUSES,
        "employment_status"
      );
      const hireDate = parseRequiredDate(
        readValue(row, ["hire_date"]) || new Date().toISOString().slice(0, 10),
        "hire_date"
      );
      const probationEndDate = parseOptionalDate(
        readValue(row, ["probation_end_date"])
      );
      const contractEndDate = parseOptionalDate(readValue(row, ["contract_end_date"]));
      const exitDate = parseOptionalDate(readValue(row, ["exit_date"]));
      const exitTypeRaw = readValue(row, ["exit_type"]);
      const managerEmployeeCode = readValue(row, [
        "manager_employee_code",
        "manager_code",
      ]);
      const managerEmployeeIdRaw = parseOptionalNumber(
        readValue(row, ["manager_employee_id"])
      );

      if (!employeeCode) {
        throw new Error("employee_code is required");
      }
      if (!fullName) {
        throw new Error("full_name is required");
      }

      let exitType: "voluntary" | "involuntary" | null = null;
      if (exitTypeRaw) {
        exitType = ensureEnum(exitTypeRaw, HR_EXIT_TYPES, "exit_type");
      }

      if (managerEmployeeCode && managerEmployeeCode === employeeCode) {
        throw new Error("manager_employee_code cannot equal employee_code");
      }

      if (dryRun) {
        rowsSuccess += 1;
        continue;
      }

      let managerEmployeeId = managerEmployeeIdRaw;
      if (managerEmployeeCode) {
        const managerResult = await pool.query<{ id: number }>(
          `
            SELECT id
            FROM hr_employees
            WHERE employee_code = $1
            LIMIT 1
          `,
          [managerEmployeeCode]
        );
        if (managerResult.rows.length === 0) {
          throw new Error(
            `manager_employee_code ${managerEmployeeCode} was not found`
          );
        }
        managerEmployeeId = managerResult.rows[0].id;
      }

      await pool.query(
        `
          INSERT INTO hr_employees (
            employee_code, full_name, work_email, department, contract_type,
            employment_status, manager_employee_id, hire_date, probation_end_date,
            contract_end_date, exit_date, exit_type, updated_at
          )
          VALUES ($1, $2, NULLIF($3, ''), $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
          ON CONFLICT (employee_code) DO UPDATE
          SET full_name = EXCLUDED.full_name,
              work_email = EXCLUDED.work_email,
              department = EXCLUDED.department,
              contract_type = EXCLUDED.contract_type,
              employment_status = EXCLUDED.employment_status,
              manager_employee_id = EXCLUDED.manager_employee_id,
              hire_date = EXCLUDED.hire_date,
              probation_end_date = EXCLUDED.probation_end_date,
              contract_end_date = EXCLUDED.contract_end_date,
              exit_date = EXCLUDED.exit_date,
              exit_type = EXCLUDED.exit_type,
              updated_at = NOW()
        `,
        [
          employeeCode,
          fullName,
          workEmail,
          department,
          contractType,
          employmentStatus,
          managerEmployeeId,
          hireDate,
          probationEndDate,
          contractEndDate,
          exitDate,
          exitType,
        ]
      );

      rowsSuccess += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      errors.push({ row: rowNumber, message });
    }
  }

  const result: HRImportResult = {
    scope: "employees",
    dryRun,
    rowsTotal: rows.length,
    rowsSuccess,
    rowsFailed: rows.length - rowsSuccess,
    errors,
  };

  await logImportRun({
    scope: result.scope,
    dryRun: result.dryRun,
    rowsTotal: result.rowsTotal,
    rowsSuccess: result.rowsSuccess,
    rowsFailed: result.rowsFailed,
  });

  return result;
}

async function getOrCreateRecruitmentRoleId(input: {
  title: string;
  department: (typeof HR_DEPARTMENTS)[number];
  vacancies: number;
  openedAt: string;
  hiringStage: string;
}): Promise<number> {
  const pool = getDbPool();
  const existing = await pool.query<{ id: number }>(
    `
      SELECT id
      FROM hr_recruitment_roles
      WHERE title = $1
        AND department = $2
      ORDER BY id DESC
      LIMIT 1
    `,
    [input.title, input.department]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const created = await pool.query<{ id: number }>(
    `
      INSERT INTO hr_recruitment_roles (
        title, department, vacancies, opened_at, hiring_stage
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
    [input.title, input.department, input.vacancies, input.openedAt, input.hiringStage]
  );

  return created.rows[0].id;
}

async function importRecruitment(
  rows: Array<Record<string, string>>,
  dryRun: boolean
): Promise<HRImportResult> {
  const pool = getDbPool();
  const errors: HRImportRowError[] = [];
  let rowsSuccess = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const row = rows[index];

    try {
      const title = readValue(row, ["role_title", "title"]);
      const department = ensureEnum(
        readValue(row, ["department"]),
        HR_DEPARTMENTS,
        "department"
      );
      const vacancies = parseOptionalNumber(readValue(row, ["vacancies"])) ?? 1;
      const openedAt = parseRequiredDate(
        readValue(row, ["opened_at"]) || new Date().toISOString().slice(0, 10),
        "opened_at"
      );
      const roleHiringStage = readValue(row, ["hiring_stage"]) || "screening";

      if (!title) {
        throw new Error("role_title is required");
      }

      const applicantName = readValue(row, ["applicant_name", "full_name"]);
      const applicantEmail = readValue(row, ["applicant_email", "email"]) || null;
      const employmentTrackRaw =
        readValue(row, ["employment_track"]) || "full_time";
      const currentStage = ensureEnum(
        readValue(row, ["current_stage"]) || "applied",
        HR_RECRUITMENT_STAGES,
        "current_stage"
      );
      const appliedAt = parseRequiredDate(
        readValue(row, ["applied_at"]) || new Date().toISOString().slice(0, 10),
        "applied_at"
      );
      const offeredAt = parseOptionalDate(readValue(row, ["offered_at"]));
      const hiredAt = parseOptionalDate(readValue(row, ["hired_at"]));
      const offerStatus = readValue(row, ["offer_status"]);

      if (employmentTrackRaw !== "intern" && employmentTrackRaw !== "full_time") {
        throw new Error("employment_track must be intern or full_time");
      }
      if (
        offerStatus &&
        !["pending", "accepted", "rejected"].includes(offerStatus)
      ) {
        throw new Error("offer_status must be pending, accepted, or rejected");
      }

      if (dryRun) {
        rowsSuccess += 1;
        continue;
      }

      const roleId = await getOrCreateRecruitmentRoleId({
        title,
        department,
        vacancies,
        openedAt,
        hiringStage: roleHiringStage,
      });

      if (applicantName) {
        const applicantInsert = await pool.query<{ id: number }>(
          `
            INSERT INTO hr_recruitment_applicants (
              role_id, full_name, email, employment_track, current_stage,
              applied_at, offered_at, hired_at, offer_status
            )
            VALUES ($1, $2, NULLIF($3, ''), $4, $5, $6, $7, $8, $9)
            RETURNING id
          `,
          [
            roleId,
            applicantName,
            applicantEmail,
            employmentTrackRaw,
            currentStage,
            appliedAt,
            offeredAt,
            hiredAt,
            offerStatus || null,
          ]
        );

        await pool.query(
          `
            INSERT INTO hr_recruitment_stage_events (applicant_id, stage)
            VALUES ($1, $2)
          `,
          [applicantInsert.rows[0].id, currentStage]
        );
      }

      rowsSuccess += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      errors.push({ row: rowNumber, message });
    }
  }

  const result: HRImportResult = {
    scope: "recruitment",
    dryRun,
    rowsTotal: rows.length,
    rowsSuccess,
    rowsFailed: rows.length - rowsSuccess,
    errors,
  };

  await logImportRun({
    scope: result.scope,
    dryRun: result.dryRun,
    rowsTotal: result.rowsTotal,
    rowsSuccess: result.rowsSuccess,
    rowsFailed: result.rowsFailed,
  });

  return result;
}

async function getEmployeeIdByCode(employeeCode: string): Promise<number> {
  const pool = getDbPool();
  const employee = await pool.query<{ id: number }>(
    `
      SELECT id
      FROM hr_employees
      WHERE employee_code = $1
      LIMIT 1
    `,
    [employeeCode]
  );
  if (employee.rows.length === 0) {
    throw new Error(`employee_code ${employeeCode} was not found`);
  }
  return employee.rows[0].id;
}

async function importLeave(
  rows: Array<Record<string, string>>,
  dryRun: boolean
): Promise<HRImportResult> {
  const pool = getDbPool();
  const errors: HRImportRowError[] = [];
  let rowsSuccess = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const row = rows[index];

    try {
      const recordType =
        readValue(row, ["record_type"]) ||
        (readValue(row, ["leave_type", "start_date", "end_date"])
          ? "request"
          : "balance");
      const employeeCode = readValue(row, ["employee_code"]);
      if (!employeeCode) {
        throw new Error("employee_code is required");
      }

      if (recordType !== "balance" && recordType !== "request") {
        throw new Error("record_type must be balance or request");
      }

      const annualDays = parseOptionalNumber(readValue(row, ["annual_days"])) ?? 0;
      const usedDays = parseOptionalNumber(readValue(row, ["used_days"])) ?? 0;
      const carryDays = parseOptionalNumber(readValue(row, ["carry_days"])) ?? 0;

      const leaveType = readValue(row, ["leave_type"]);
      const startDate = parseOptionalDate(readValue(row, ["start_date"]));
      const endDate = parseOptionalDate(readValue(row, ["end_date"]));
      const days = parseOptionalNumber(readValue(row, ["days"]));
      const leaveStatusRaw = readValue(row, ["status"]) || "pending";
      const leaveStatus = ensureEnum(
        leaveStatusRaw,
        HR_LEAVE_REQUEST_STATUSES,
        "status"
      );

      if (recordType === "request") {
        if (!leaveType) {
          throw new Error("leave_type is required for request rows");
        }
        if (!startDate || !endDate || days === null) {
          throw new Error(
            "start_date, end_date, and days are required for request rows"
          );
        }
      }

      if (dryRun) {
        rowsSuccess += 1;
        continue;
      }

      const employeeId = await getEmployeeIdByCode(employeeCode);

      if (recordType === "balance") {
        await pool.query(
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
          `,
          [employeeId, annualDays, usedDays, carryDays]
        );
      } else {
        await pool.query(
          `
            INSERT INTO hr_leave_requests (
              employee_id, leave_type, start_date, end_date, days, status
            )
            VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [employeeId, leaveType, startDate, endDate, days, leaveStatus]
        );
      }

      rowsSuccess += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      errors.push({ row: rowNumber, message });
    }
  }

  const result: HRImportResult = {
    scope: "leave",
    dryRun,
    rowsTotal: rows.length,
    rowsSuccess,
    rowsFailed: rows.length - rowsSuccess,
    errors,
  };

  await logImportRun({
    scope: result.scope,
    dryRun: result.dryRun,
    rowsTotal: result.rowsTotal,
    rowsSuccess: result.rowsSuccess,
    rowsFailed: result.rowsFailed,
  });

  return result;
}

async function getOrCreatePayrollCycleId(
  cycleMonth: string,
  status: (typeof HR_PAYROLL_STATUSES)[number],
  processedAt: string | null,
  notes: string | null
): Promise<number> {
  const pool = getDbPool();
  const result = await pool.query<{ id: number }>(
    `
      INSERT INTO hr_payroll_cycles (
        cycle_month, status, processed_at, notes
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (cycle_month) DO UPDATE
      SET status = EXCLUDED.status,
          processed_at = EXCLUDED.processed_at,
          notes = COALESCE(EXCLUDED.notes, hr_payroll_cycles.notes)
      RETURNING id
    `,
    [cycleMonth, status, processedAt, notes]
  );
  return result.rows[0].id;
}

async function importPayroll(
  rows: Array<Record<string, string>>,
  dryRun: boolean
): Promise<HRImportResult> {
  const pool = getDbPool();
  const errors: HRImportRowError[] = [];
  let rowsSuccess = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const row = rows[index];

    try {
      const recordType =
        readValue(row, ["record_type"]) ||
        (readValue(row, ["anomaly_type"]) ? "anomaly" : "cycle");
      if (recordType !== "cycle" && recordType !== "anomaly") {
        throw new Error("record_type must be cycle or anomaly");
      }

      const cycleMonth = parseRequiredDate(readValue(row, ["cycle_month"]), "cycle_month");
      const status = ensureEnum(
        readValue(row, ["status"]) || "pending",
        HR_PAYROLL_STATUSES,
        "status"
      );
      const processedAt = parseOptionalDate(readValue(row, ["processed_at"]));
      const notes = readValue(row, ["notes"]) || null;

      const anomalyType = readValue(row, ["anomaly_type"]);
      const anomalyStatus = readValue(row, ["anomaly_status"]) || "open";
      const details = readValue(row, ["details"]) || null;
      const employeeCode = readValue(row, ["employee_code"]);

      if (recordType === "anomaly" && !anomalyType) {
        throw new Error("anomaly_type is required for anomaly rows");
      }
      if (recordType === "anomaly" && !["open", "resolved"].includes(anomalyStatus)) {
        throw new Error("anomaly_status must be open or resolved");
      }

      if (dryRun) {
        rowsSuccess += 1;
        continue;
      }

      const cycleId = await getOrCreatePayrollCycleId(
        cycleMonth,
        status,
        processedAt,
        notes
      );

      if (recordType === "anomaly") {
        let employeeId: number | null = null;
        if (employeeCode) {
          employeeId = await getEmployeeIdByCode(employeeCode);
        }
        await pool.query(
          `
            INSERT INTO hr_payroll_anomalies (
              payroll_cycle_id, employee_id, anomaly_type, status, details
            )
            VALUES ($1, $2, $3, $4, $5)
          `,
          [cycleId, employeeId, anomalyType, anomalyStatus, details]
        );
      }

      rowsSuccess += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      errors.push({ row: rowNumber, message });
    }
  }

  const result: HRImportResult = {
    scope: "payroll",
    dryRun,
    rowsTotal: rows.length,
    rowsSuccess,
    rowsFailed: rows.length - rowsSuccess,
    errors,
  };

  await logImportRun({
    scope: result.scope,
    dryRun: result.dryRun,
    rowsTotal: result.rowsTotal,
    rowsSuccess: result.rowsSuccess,
    rowsFailed: result.rowsFailed,
  });

  return result;
}

export async function runHrCsvImport(input: {
  scope: HRImportScope;
  csv: string;
  dryRun: boolean;
}): Promise<HRImportResult> {
  await ensureDbSchema();
  const rows = collectRows(input.csv);

  switch (input.scope) {
    case "employees":
      return importEmployees(rows, input.dryRun);
    case "recruitment":
      return importRecruitment(rows, input.dryRun);
    case "leave":
      return importLeave(rows, input.dryRun);
    case "payroll":
      return importPayroll(rows, input.dryRun);
    default:
      throw new Error(`Unsupported scope: ${input.scope}`);
  }
}

export function ensureImportScope(value: string): HRImportScope {
  const scope = asScope(value);
  if (!scope) {
    throw new Error(`Unsupported import scope: ${value}`);
  }
  return scope;
}

export function getImportTemplate(scope: HRImportScope): string {
  switch (scope) {
    case "employees":
      return [
        "employee_code,full_name,work_email,department,contract_type,employment_status,manager_employee_code,hire_date,probation_end_date,contract_end_date,exit_date,exit_type",
        `EMP-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()},Jane Doe,jane@company.com,Tech,full_time,active,,2026-01-05,2026-04-05,,,`,
      ].join("\n");
    case "recruitment":
      return [
        "role_title,department,vacancies,opened_at,hiring_stage,applicant_name,applicant_email,employment_track,current_stage,applied_at,offered_at,hired_at,offer_status",
        "Finance & Compliance Manager,Finance & Compliance,1,2026-03-10,interview_loop,Ada Mensah,ada@example.com,full_time,interviewed,2026-03-12,,,",
      ].join("\n");
    case "leave":
      return [
        "record_type,employee_code,annual_days,used_days,carry_days,leave_type,start_date,end_date,days,status",
        "balance,EMP-2026-001,,,,,,,,",
        "request,EMP-2026-001,,,,Annual Leave,2026-04-10,2026-04-12,3,pending",
      ].join("\n");
    case "payroll":
      return [
        "record_type,cycle_month,status,processed_at,notes,employee_code,anomaly_type,anomaly_status,details",
        "cycle,2026-04-01,pending,,, ,,,",
        "anomaly,2026-04-01,issues_flagged,,,EMP-2026-001,missing_bank_details,open,Bank details not provided",
      ].join("\n");
    default:
      return "";
  }
}
