import { ensureDbSchema, getDbPool } from "@/lib/db";
import type { HRCompanyGoal, HRGoalPriority, HRGoalStatus } from "@/lib/types";
import { HR_GOAL_PRIORITIES, HR_GOAL_STATUSES } from "@/lib/types";
import {
  applyListLimit,
  asDateOnly,
  asNullableDateOnly,
  asRecordRows,
  asString,
  ensureDateOnly,
  ensureEnumValue,
} from "@/lib/hr/shared";
import { logHrAudit } from "@/lib/hr/hr-audit";

export type CreateCompanyGoalInput = {
  title: string;
  description?: string | null;
  period: string;
  priority?: HRGoalPriority;
  owner?: string | null;
  status?: HRGoalStatus;
  createdBy?: string | null;
};

export type UpdateCompanyGoalInput = CreateCompanyGoalInput & {
  approvedBy?: string | null;
  dateApproved?: string | null;
};

function normalizeCompanyGoal(row: Record<string, unknown>): HRCompanyGoal {
  return {
    id: Number(row.id) || 0,
    title: asString(row.title),
    description: row.description ? asString(row.description) : null,
    period: asString(row.period),
    priority: asString(row.priority) as HRGoalPriority,
    owner: row.owner ? asString(row.owner) : null,
    status: asString(row.status) as HRGoalStatus,
    created_by: row.created_by ? asString(row.created_by) : null,
    approved_by: row.approved_by ? asString(row.approved_by) : null,
    date_created: asDateOnly(row.date_created),
    date_approved: asNullableDateOnly(row.date_approved),
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
  };
}

const GOAL_COLUMNS = `
  id, title, description, period, priority, owner, status,
  created_by, approved_by, date_created, date_approved, created_at, updated_at
`;

export async function listCompanyGoals(options: {
  period?: string;
  status?: string;
  limit?: number;
} = {}): Promise<HRCompanyGoal[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.period?.trim()) {
    values.push(options.period.trim());
    conditions.push(`period = $${values.length}`);
  }
  if (options.status?.trim()) {
    values.push(options.status.trim());
    conditions.push(`status = $${values.length}`);
  }

  let query = `SELECT ${GOAL_COLUMNS} FROM hr_company_goals`;
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  query += " ORDER BY period DESC, id DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizeCompanyGoal);
}

export async function listActiveCompanyGoalOptions(): Promise<
  Array<{ id: number; title: string; period: string }>
> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(`
    SELECT id, title, period
    FROM hr_company_goals
    WHERE status IN ('active', 'draft')
    ORDER BY period DESC, title ASC
  `);
  return asRecordRows(result.rows).map((row) => ({
    id: Number(row.id) || 0,
    title: asString(row.title),
    period: asString(row.period),
  }));
}

export async function createCompanyGoal(
  input: CreateCompanyGoalInput,
  actor = "HR Admin"
): Promise<HRCompanyGoal> {
  await ensureDbSchema();
  const pool = getDbPool();
  const priority = ensureEnumValue(
    input.priority || "medium",
    HR_GOAL_PRIORITIES,
    "goalPriority"
  );
  const status = ensureEnumValue(
    input.status || "draft",
    HR_GOAL_STATUSES,
    "goalStatus"
  );

  const result = await pool.query(
    `
      INSERT INTO hr_company_goals (
        title, description, period, priority, owner, status, created_by, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING ${GOAL_COLUMNS}
    `,
    [
      input.title.trim(),
      input.description?.trim() || null,
      input.period.trim(),
      priority,
      input.owner?.trim() || null,
      status,
      input.createdBy?.trim() || actor,
    ]
  );

  const goal = normalizeCompanyGoal(asRecordRows(result.rows)[0]);
  await logHrAudit({
    recordType: "company_goal",
    recordId: goal.id,
    action: "created",
    editedBy: actor,
  });
  return goal;
}

export async function updateCompanyGoal(
  id: number,
  input: UpdateCompanyGoalInput,
  actor = "HR Admin"
): Promise<HRCompanyGoal | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const priority = ensureEnumValue(
    input.priority || "medium",
    HR_GOAL_PRIORITIES,
    "goalPriority"
  );
  const status = ensureEnumValue(
    input.status || "draft",
    HR_GOAL_STATUSES,
    "goalStatus"
  );

  const result = await pool.query(
    `
      UPDATE hr_company_goals
      SET title = $2,
          description = $3,
          period = $4,
          priority = $5,
          owner = $6,
          status = $7,
          approved_by = COALESCE($8, approved_by),
          date_approved = COALESCE($9, date_approved),
          updated_at = NOW()
      WHERE id = $1
      RETURNING ${GOAL_COLUMNS}
    `,
    [
      id,
      input.title.trim(),
      input.description?.trim() || null,
      input.period.trim(),
      priority,
      input.owner?.trim() || null,
      status,
      input.approvedBy?.trim() || null,
      input.dateApproved ? ensureDateOnly(input.dateApproved) : null,
    ]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const goal = normalizeCompanyGoal(asRecordRows(result.rows)[0]);
  await logHrAudit({
    recordType: "company_goal",
    recordId: goal.id,
    action: "edited",
    editedBy: actor,
  });
  return goal;
}
