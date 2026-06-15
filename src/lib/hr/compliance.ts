import { ensureDbSchema, getDbPool } from "@/lib/db";
import type { HRDisciplinaryCase, HRDisciplinaryStatus, HRFollowupAction, HRPolicyViolation } from "@/lib/types";
import { HR_DISCIPLINARY_STATUSES } from "@/lib/types";
import {
  applyListLimit,
  asRecordRows,
  ensureDateOnly,
  ensureEnumValue,
  normalizeDisciplinaryCase,
  normalizeFollowupAction,
  normalizePolicyViolation,
} from "@/lib/hr/shared";
import type {
  CreateDisciplinaryCaseInput,
  CreateFollowupActionInput,
  CreatePolicyViolationInput,
} from "@/lib/hr/types";

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
