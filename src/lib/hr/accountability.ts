import { ensureDbSchema, getDbPool } from "@/lib/db";
import type { HRAccountabilityAction, HRAccountabilityStatus } from "@/lib/types";
import { HR_ACCOUNTABILITY_STAGES, HR_ACCOUNTABILITY_STATUSES } from "@/lib/types";
import {
  applyListLimit,
  asRecordRows,
  asString,
  ensureDateOnly,
  ensureEnumValue,
  normalizeAccountabilityAction,
} from "@/lib/hr/shared";
import type { CreateAccountabilityActionInput } from "@/lib/hr/types";

export type HRAccountabilityActionWithEmployee = HRAccountabilityAction & {
  employee_name: string;
};

export async function listAccountabilityActions(options: {
  status?: string;
  stage?: string;
  limit?: number;
} = {}): Promise<HRAccountabilityActionWithEmployee[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.status?.trim()) {
    values.push(options.status.trim());
    conditions.push(`a.status = $${values.length}`);
  }
  if (options.stage?.trim()) {
    values.push(options.stage.trim());
    conditions.push(`a.stage = $${values.length}`);
  }

  let query = `
    SELECT
      a.id, a.employee_id, a.stage, a.reason, a.issued_on, a.status, a.notes, a.created_at,
      e.full_name AS employee_name
    FROM hr_accountability_actions a
    INNER JOIN hr_employees e ON e.id = a.employee_id
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY a.issued_on DESC, a.id DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map((row) => ({
    ...normalizeAccountabilityAction(row),
    employee_name: asString(row.employee_name),
  }));
}

export async function createAccountabilityAction(
  input: CreateAccountabilityActionInput
): Promise<HRAccountabilityAction> {
  await ensureDbSchema();
  const pool = getDbPool();
  const stage = ensureEnumValue(input.stage, HR_ACCOUNTABILITY_STAGES, "accountabilityStage");
  const status = ensureEnumValue(
    input.status || "open",
    HR_ACCOUNTABILITY_STATUSES,
    "accountabilityStatus"
  );
  const result = await pool.query(
    `
      INSERT INTO hr_accountability_actions (employee_id, stage, reason, issued_on, status, notes)
      VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5, $6)
      RETURNING id, employee_id, stage, reason, issued_on, status, notes, created_at
    `,
    [
      input.employeeId,
      stage,
      input.reason.trim(),
      ensureDateOnly(input.issuedOn),
      status,
      input.notes?.trim() || null,
    ]
  );
  return normalizeAccountabilityAction(asRecordRows(result.rows)[0]);
}

export async function updateAccountabilityStatus(
  actionId: number,
  status: HRAccountabilityStatus,
  notes?: string | null
): Promise<HRAccountabilityAction | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      UPDATE hr_accountability_actions
      SET status = $2, notes = COALESCE($3, notes)
      WHERE id = $1
      RETURNING id, employee_id, stage, reason, issued_on, status, notes, created_at
    `,
    [actionId, status, notes?.trim() || null]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return normalizeAccountabilityAction(asRecordRows(result.rows)[0]);
}
