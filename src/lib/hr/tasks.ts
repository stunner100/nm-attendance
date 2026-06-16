import { ensureDbSchema, getDbPool } from "@/lib/db";
import type { HRTask, HRTaskStatus } from "@/lib/types";
import { HR_TASK_STATUSES } from "@/lib/types";
import {
  applyListLimit,
  asRecordRows,
  asString,
  ensureDateOnly,
  ensureEnumValue,
  normalizeTask,
} from "@/lib/hr/shared";
import type { CreateTaskInput } from "@/lib/hr/types";

export type HRTaskWithEmployee = HRTask & { employee_name: string };

export async function listTasks(options: {
  status?: string;
  employeeId?: number;
  limit?: number;
} = {}): Promise<HRTaskWithEmployee[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.status?.trim()) {
    values.push(options.status.trim());
    conditions.push(`t.status = $${values.length}`);
  }
  if (options.employeeId && Number.isFinite(options.employeeId)) {
    values.push(options.employeeId);
    conditions.push(`t.employee_id = $${values.length}`);
  }

  let query = `
    SELECT
      t.id, t.employee_id, t.card_id, t.title, t.description, t.due_date,
      t.status, t.completed_at, t.quality_note, t.created_at,
      e.full_name AS employee_name
    FROM hr_tasks t
    INNER JOIN hr_employees e ON e.id = t.employee_id
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY t.due_date ASC NULLS LAST, t.id DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map((row) => ({
    ...normalizeTask(row),
    employee_name: asString(row.employee_name),
  }));
}

export async function createTask(input: CreateTaskInput): Promise<HRTask> {
  await ensureDbSchema();
  const pool = getDbPool();
  const status = ensureEnumValue(
    input.status || "not_started",
    HR_TASK_STATUSES,
    "taskStatus"
  );
  const result = await pool.query(
    `
      INSERT INTO hr_tasks (
        employee_id, card_id, title, description, due_date, status, quality_note
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, employee_id, card_id, title, description, due_date, status, completed_at, quality_note, created_at
    `,
    [
      input.employeeId,
      input.cardId ?? null,
      input.title.trim(),
      input.description?.trim() || null,
      ensureDateOnly(input.dueDate),
      status,
      input.qualityNote?.trim() || null,
    ]
  );
  return normalizeTask(asRecordRows(result.rows)[0]);
}

export async function updateTaskStatus(
  taskId: number,
  status: HRTaskStatus,
  qualityNote?: string | null
): Promise<HRTask | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const completedAt =
    status === "completed" ? new Date().toISOString().slice(0, 10) : null;
  const result = await pool.query(
    `
      UPDATE hr_tasks
      SET status = $2,
          completed_at = CASE WHEN $2 = 'completed' THEN COALESCE($3, completed_at, CURRENT_DATE) ELSE NULL END,
          quality_note = COALESCE($4, quality_note)
      WHERE id = $1
      RETURNING id, employee_id, card_id, title, description, due_date, status, completed_at, quality_note, created_at
    `,
    [taskId, status, completedAt, qualityNote?.trim() || null]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return normalizeTask(asRecordRows(result.rows)[0]);
}
