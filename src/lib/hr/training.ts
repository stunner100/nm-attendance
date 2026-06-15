import { ensureDbSchema, getDbPool } from "@/lib/db";
import type { HROnboardingChecklist, HRTrainingAssignment, HRTrainingModule, HRTrainingStatus } from "@/lib/types";
import { HR_TRAINING_STATUSES } from "@/lib/types";
import {
  applyListLimit,
  asNumber,
  asRecordRows,
  asString,
  ensureDateOnly,
  ensureEnumValue,
  normalizeOnboardingChecklist,
  normalizeTrainingAssignment,
  normalizeTrainingModule,
} from "@/lib/hr/shared";
import type {
  CreateOnboardingChecklistInput,
  CreateTrainingAssignmentInput,
  CreateTrainingModuleInput,
} from "@/lib/hr/types";

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
