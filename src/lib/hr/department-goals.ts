import { ensureDbSchema, getDbPool } from "@/lib/db";
import type {
  HRDepartment,
  HRDepartmentGoal,
  HRGoalStatus,
  HRRoadmapHealth,
} from "@/lib/types";
import { HR_DEPARTMENTS, HR_GOAL_STATUSES, HR_ROADMAP_HEALTH } from "@/lib/types";
import {
  applyListLimit,
  asRecordRows,
  asString,
  ensureEnumValue,
} from "@/lib/hr/shared";
import { logHrAudit } from "@/lib/hr/hr-audit";

export type CreateDepartmentGoalInput = {
  department: HRDepartment;
  companyGoalId?: number | null;
  title: string;
  description?: string | null;
  period: string;
  owner?: string | null;
  roadmapHealth?: HRRoadmapHealth;
  statusReason?: string | null;
  keyBlockers?: string | null;
  nextPriorities?: string | null;
  status?: HRGoalStatus;
};

function normalizeDepartmentGoal(row: Record<string, unknown>): HRDepartmentGoal {
  return {
    id: Number(row.id) || 0,
    department: asString(row.department) as HRDepartment,
    company_goal_id: row.company_goal_id ? Number(row.company_goal_id) : null,
    company_goal_title: row.company_goal_title
      ? asString(row.company_goal_title)
      : null,
    title: asString(row.title),
    description: row.description ? asString(row.description) : null,
    period: asString(row.period),
    owner: row.owner ? asString(row.owner) : null,
    roadmap_health: asString(row.roadmap_health) as HRRoadmapHealth,
    status_reason: row.status_reason ? asString(row.status_reason) : null,
    key_blockers: row.key_blockers ? asString(row.key_blockers) : null,
    next_priorities: row.next_priorities ? asString(row.next_priorities) : null,
    status: asString(row.status) as HRGoalStatus,
    created_at: asString(row.created_at),
    updated_at: asString(row.updated_at),
  };
}

const GOAL_COLUMNS = `
  d.id, d.department, d.company_goal_id, c.title AS company_goal_title,
  d.title, d.description, d.period, d.owner, d.roadmap_health,
  d.status_reason, d.key_blockers, d.next_priorities, d.status,
  d.created_at, d.updated_at
`;

export async function listDepartmentGoals(options: {
  period?: string;
  department?: string;
  roadmapHealth?: string;
  limit?: number;
} = {}): Promise<HRDepartmentGoal[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.period?.trim()) {
    values.push(options.period.trim());
    conditions.push(`d.period = $${values.length}`);
  }
  if (options.department?.trim()) {
    values.push(options.department.trim());
    conditions.push(`d.department = $${values.length}`);
  }
  if (options.roadmapHealth?.trim()) {
    values.push(options.roadmapHealth.trim());
    conditions.push(`d.roadmap_health = $${values.length}`);
  }

  let query = `
    SELECT ${GOAL_COLUMNS}
    FROM hr_department_goals d
    LEFT JOIN hr_company_goals c ON c.id = d.company_goal_id
  `;
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  query += " ORDER BY d.period DESC, d.department ASC, d.id DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizeDepartmentGoal);
}

export async function listDepartmentGoalOptions(period?: string): Promise<
  Array<{ id: number; title: string; department: string }>
> {
  await ensureDbSchema();
  const pool = getDbPool();
  const values: unknown[] = [];
  let query = `
    SELECT id, title, department
    FROM hr_department_goals
    WHERE status IN ('active', 'draft')
  `;
  if (period?.trim()) {
    values.push(period.trim());
    query += ` AND period = $1`;
  }
  query += " ORDER BY department ASC, title ASC";

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map((row) => ({
    id: Number(row.id) || 0,
    title: asString(row.title),
    department: asString(row.department),
  }));
}

export async function createDepartmentGoal(
  input: CreateDepartmentGoalInput,
  actor = "HR Admin"
): Promise<HRDepartmentGoal> {
  await ensureDbSchema();
  const pool = getDbPool();
  ensureEnumValue(input.department, HR_DEPARTMENTS, "department");
  const roadmapHealth = ensureEnumValue(
    input.roadmapHealth || "on_track",
    HR_ROADMAP_HEALTH,
    "roadmapHealth"
  );
  const status = ensureEnumValue(
    input.status || "draft",
    HR_GOAL_STATUSES,
    "goalStatus"
  );

  const result = await pool.query(
    `
      INSERT INTO hr_department_goals (
        department, company_goal_id, title, description, period, owner,
        roadmap_health, status_reason, key_blockers, next_priorities, status, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING id
    `,
    [
      input.department,
      input.companyGoalId ?? null,
      input.title.trim(),
      input.description?.trim() || null,
      input.period.trim(),
      input.owner?.trim() || null,
      roadmapHealth,
      input.statusReason?.trim() || null,
      input.keyBlockers?.trim() || null,
      input.nextPriorities?.trim() || null,
      status,
    ]
  );

  const id = Number(asRecordRows(result.rows)[0]?.id) || 0;
  await logHrAudit({
    recordType: "department_goal",
    recordId: id,
    action: "created",
    editedBy: actor,
  });

  const listed = await listDepartmentGoals({ limit: 200 });
  return listed.find((g) => g.id === id) ?? normalizeDepartmentGoal({ id, title: input.title, department: input.department, period: input.period, roadmap_health: roadmapHealth, status });
}

export async function updateDepartmentGoalRoadmap(
  id: number,
  input: {
    roadmapHealth: HRRoadmapHealth;
    statusReason?: string | null;
    keyBlockers?: string | null;
    nextPriorities?: string | null;
  },
  actor = "Manager"
): Promise<HRDepartmentGoal | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const roadmapHealth = ensureEnumValue(
    input.roadmapHealth,
    HR_ROADMAP_HEALTH,
    "roadmapHealth"
  );

  await pool.query(
    `
      UPDATE hr_department_goals
      SET roadmap_health = $2,
          status_reason = $3,
          key_blockers = $4,
          next_priorities = $5,
          updated_at = NOW()
      WHERE id = $1
    `,
    [
      id,
      roadmapHealth,
      input.statusReason?.trim() || null,
      input.keyBlockers?.trim() || null,
      input.nextPriorities?.trim() || null,
    ]
  );

  await logHrAudit({
    recordType: "department_goal",
    recordId: id,
    action: "edited",
    editedBy: actor,
    fieldChanged: "roadmap_health",
    newValue: roadmapHealth,
  });

  const goals = await listDepartmentGoals({ limit: 200 });
  return goals.find((g) => g.id === id) ?? null;
}

export async function getLatestRoadmapByDepartment(
  period: string
): Promise<Record<HRDepartment, HRRoadmapHealth | null>> {
  const base = HR_DEPARTMENTS.reduce(
    (acc, dept) => {
      acc[dept] = null;
      return acc;
    },
    {} as Record<HRDepartment, HRRoadmapHealth | null>
  );

  const goals = await listDepartmentGoals({ period, limit: 100 });
  for (const goal of goals) {
    if (!base[goal.department]) {
      base[goal.department] = goal.roadmap_health;
    }
  }
  return base;
}
