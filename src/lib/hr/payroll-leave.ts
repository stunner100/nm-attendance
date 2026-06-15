import { ensureDbSchema, getDbPool } from "@/lib/db";
import type {
  HRLeaveBalance,
  HRLeaveRequest,
  HRLeaveRequestStatus,
  HRPayrollAnomaly,
  HRPayrollCycle,
  HRPayrollStatus,
} from "@/lib/types";
import { HR_LEAVE_REQUEST_STATUSES, HR_PAYROLL_STATUSES } from "@/lib/types";
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
import type {
  CreateLeaveRequestInput,
  CreatePayrollAnomalyInput,
  CreatePayrollCycleInput,
  UpsertLeaveBalanceInput,
} from "@/lib/hr/types";

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
