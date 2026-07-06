import { ensureDbSchema, getDbPool } from "@/lib/db";
import type {
  HRLeaveBalance,
  HRLeaveBalanceWithEmployee,
  HRLeaveRequest,
  HRLeaveRequestStatus,
  HRPayrollAnomaly,
  HRPayrollCycle,
  HRPayrollStatus,
} from "@/lib/types";
import { HR_LEAVE_REQUEST_CATEGORIES, HR_LEAVE_REQUEST_STATUSES } from "@/lib/types";
import {
  applyListLimit,
  asDateOnly,
  asNumber,
  asRecordRows,
  asString,
  ensureDateOnly,
  ensureEnumValue,
  normalizeLeaveBalance,
  normalizeLeaveRequest,
  normalizePayrollAnomaly,
  normalizePayrollCycle,
} from "@/lib/hr/shared";
import {
  buildEmployeeLeaveOverviewRow,
  type HREmployeeLeaveOverview,
} from "@/lib/hr/leave-entitlement";
import type { HRDepartment } from "@/lib/types";
import type {
  CreateLeaveRequestInput,
  CreatePayrollAnomalyInput,
  CreatePayrollCycleInput,
  UpsertLeaveBalanceInput,
} from "@/lib/hr/types";

export { daysBetweenInclusive } from "@/lib/hr/shared";

export const PAYROLL_LEAVE_LIST_DEFAULT_LIMIT = 200;

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

export async function listLeaveBalancesWithEmployees(options: {
  limit?: number;
} = {}): Promise<HRLeaveBalanceWithEmployee[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const values: unknown[] = [];
  const query = applyListLimit(
    `
      SELECT
        lb.id,
        lb.employee_id,
        lb.annual_days,
        lb.used_days,
        lb.carry_days,
        lb.updated_at,
        e.full_name
      FROM hr_leave_balances lb
      INNER JOIN hr_employees e ON e.id = lb.employee_id
      ORDER BY lb.updated_at DESC
    `,
    values,
    options.limit
  );
  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map((row) => ({
    ...normalizeLeaveBalance(row),
    full_name: asString(row.full_name),
  }));
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
  employeeId?: number;
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
  if (Number.isFinite(options.employeeId) && Number(options.employeeId) > 0) {
    values.push(options.employeeId);
    conditions.push(`employee_id = $${values.length}`);
  }

  let query = `
    SELECT id, employee_id, leave_type, request_category, start_date, end_date,
      late_arrival_time, days, status, reason, coverage_plan, contact_number,
      submitted_by_email, reviewer_note, source, requested_at, reviewed_at
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
  const requestCategory = ensureEnumValue(
    input.requestCategory || "leave",
    HR_LEAVE_REQUEST_CATEGORIES,
    "leaveRequestCategory"
  );
  const status = ensureEnumValue(
    input.status || "pending",
    HR_LEAVE_REQUEST_STATUSES,
    "leaveRequestStatus"
  );
  const result = await pool.query(
    `
      INSERT INTO hr_leave_requests (
        employee_id, leave_type, request_category, start_date, end_date,
        late_arrival_time, days, status, reason, coverage_plan, contact_number,
        submitted_by_email, reviewer_note, source
      )
      VALUES ($1, $2, $3, $4, $5, $6::time, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, employee_id, leave_type, request_category, start_date, end_date,
        late_arrival_time, days, status, reason, coverage_plan, contact_number,
        submitted_by_email, reviewer_note, source, requested_at, reviewed_at
    `,
    [
      input.employeeId,
      input.leaveType.trim(),
      requestCategory,
      ensureDateOnly(input.startDate),
      ensureDateOnly(input.endDate),
      input.lateArrivalTime?.trim() || null,
      input.days,
      status,
      input.reason?.trim() || null,
      input.coveragePlan?.trim() || null,
      input.contactNumber?.trim() || null,
      input.submittedByEmail?.trim().toLowerCase() || null,
      input.reviewerNote?.trim() || null,
      input.source || "admin",
    ]
  );
  return normalizeLeaveRequest(asRecordRows(result.rows)[0]);
}

export async function updateLeaveRequestStatus(
  leaveRequestId: number,
  status: HRLeaveRequestStatus,
  reviewerNote?: string | null
): Promise<HRLeaveRequest | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      UPDATE hr_leave_requests
      SET status = $2,
          reviewer_note = COALESCE(NULLIF($3, ''), reviewer_note),
          reviewed_at = NOW()
      WHERE id = $1
      RETURNING id, employee_id, leave_type, request_category, start_date, end_date,
        late_arrival_time, days, status, reason, coverage_plan, contact_number,
        submitted_by_email, reviewer_note, source, requested_at, reviewed_at
    `,
    [leaveRequestId, status, reviewerNote?.trim() || null]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return normalizeLeaveRequest(asRecordRows(result.rows)[0]);
}

export async function deleteLeaveRequest(leaveRequestId: number): Promise<boolean> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `DELETE FROM hr_leave_requests WHERE id = $1 RETURNING id`,
    [leaveRequestId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listEmployeeLeaveRequests(
  employeeId: number,
  options: { limit?: number } = {}
): Promise<HRLeaveRequest[]> {
  return listLeaveRequests({ employeeId, limit: options.limit });
}

export async function listEmployeeLeaveOverview(): Promise<HREmployeeLeaveOverview[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query<{
    employee_id: number;
    full_name: string;
    department: HRDepartment;
    hire_date: string | Date;
    balance_id: number | null;
    annual_days: number | null;
    carry_days: number | null;
    stored_used_days: number | null;
    approved_used_ytd: number | null;
  }>(`
    SELECT
      e.id AS employee_id,
      e.full_name,
      e.department,
      e.hire_date,
      lb.id AS balance_id,
      lb.annual_days,
      lb.carry_days,
      lb.used_days AS stored_used_days,
      COALESCE(usage.approved_used_ytd, 0) AS approved_used_ytd
    FROM hr_employees e
    LEFT JOIN hr_leave_balances lb ON lb.employee_id = e.id
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(lr.days), 0)::numeric AS approved_used_ytd
      FROM hr_leave_requests lr
      WHERE lr.employee_id = e.id
        AND lr.status = 'approved'
        AND lr.request_category = 'leave'
        AND EXTRACT(YEAR FROM lr.start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    ) usage ON TRUE
    WHERE e.employment_status = 'active'
    ORDER BY e.full_name ASC
  `);

  return asRecordRows(result.rows).map((row) =>
    buildEmployeeLeaveOverviewRow({
      employee_id: asNumber(row.employee_id),
      full_name: asString(row.full_name),
      department: asString(row.department) as HRDepartment,
      hire_date: asDateOnly(row.hire_date),
      balance_id: row.balance_id === null ? null : asNumber(row.balance_id),
      annual_days: asNumber(row.annual_days ?? 0),
      carry_days: asNumber(row.carry_days ?? 0),
      stored_used_days: asNumber(row.stored_used_days ?? 0),
      approved_used_ytd: asNumber(row.approved_used_ytd ?? 0),
    })
  );
}

export async function applyTenureLeaveEntitlements(options: {
  employeeId?: number;
} = {}): Promise<number> {
  const overview = await listEmployeeLeaveOverview();
  const targets = options.employeeId
    ? overview.filter((row) => row.employee_id === options.employeeId)
    : overview;

  if (options.employeeId && targets.length === 0) {
    return 0;
  }

  let updated = 0;
  for (const row of targets) {
    await upsertLeaveBalance({
      employeeId: row.employee_id,
      annualDays: row.recommended_annual_days,
      usedDays: row.approved_used_ytd,
      carryDays: row.carry_days,
    });
    updated += 1;
  }
  return updated;
}
