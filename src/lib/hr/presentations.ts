import { ensureDbSchema, getDbPool } from "@/lib/db";
import type { HRPresentation, HRPresentationStatus } from "@/lib/types";
import { HR_PRESENTATION_STATUSES, HR_PRESENTER_TYPES, HR_ROADMAP_HEALTH } from "@/lib/types";
import {
  applyListLimit,
  asRecordRows,
  asString,
  ensureEnumValue,
  normalizePresentation,
} from "@/lib/hr/shared";
import type { CreatePresentationInput } from "@/lib/hr/types";

export type HRPresentationWithEmployee = HRPresentation & {
  employee_name: string;
  department: string;
};

export async function listPresentations(options: {
  status?: string;
  period?: string;
  presenterType?: string;
  limit?: number;
} = {}): Promise<HRPresentationWithEmployee[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.status?.trim()) {
    values.push(options.status.trim());
    conditions.push(`p.status = $${values.length}`);
  }
  if (options.period?.trim()) {
    values.push(options.period.trim());
    conditions.push(`p.period = $${values.length}`);
  }
  if (options.presenterType?.trim()) {
    values.push(options.presenterType.trim());
    conditions.push(`p.presenter_type = $${values.length}`);
  }

  let query = `
    SELECT
      p.id, p.employee_id, p.period, p.presenter_type, p.status, p.achievements,
      p.kpi_results, p.tasks_completed, p.tasks_delayed, p.challenges, p.support_needed,
      p.lessons, p.next_priorities, p.roadmap_health, p.key_wins, p.blockers, p.risks,
      p.dependencies, p.qa_notes, p.submitted_at, p.created_at,
      e.full_name AS employee_name, e.department AS department
    FROM hr_presentations p
    INNER JOIN hr_employees e ON e.id = p.employee_id
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY p.period DESC, p.id DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map((row) => ({
    ...normalizePresentation(row),
    employee_name: asString(row.employee_name),
    department: asString(row.department),
  }));
}

export async function createPresentation(
  input: CreatePresentationInput
): Promise<HRPresentation> {
  await ensureDbSchema();
  const pool = getDbPool();
  const presenterType = ensureEnumValue(
    input.presenterType,
    HR_PRESENTER_TYPES,
    "presenterType"
  );
  const status = ensureEnumValue(
    input.status || "scheduled",
    HR_PRESENTATION_STATUSES,
    "presentationStatus"
  );
  const roadmapHealth = input.roadmapHealth
    ? ensureEnumValue(input.roadmapHealth, HR_ROADMAP_HEALTH, "roadmapHealth")
    : null;

  const result = await pool.query(
    `
      INSERT INTO hr_presentations (
        employee_id, period, presenter_type, status, achievements, kpi_results,
        tasks_completed, tasks_delayed, challenges, support_needed, lessons,
        next_priorities, roadmap_health, key_wins, blockers, risks, dependencies, qa_notes,
        submitted_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        CASE WHEN $4 = 'submitted' OR $4 = 'reviewed' THEN CURRENT_DATE ELSE NULL END
      )
      RETURNING id, employee_id, period, presenter_type, status, achievements, kpi_results,
        tasks_completed, tasks_delayed, challenges, support_needed, lessons, next_priorities,
        roadmap_health, key_wins, blockers, risks, dependencies, qa_notes, submitted_at, created_at
    `,
    [
      input.employeeId,
      input.period.trim(),
      presenterType,
      status,
      input.achievements?.trim() || null,
      input.kpiResults?.trim() || null,
      input.tasksCompleted?.trim() || null,
      input.tasksDelayed?.trim() || null,
      input.challenges?.trim() || null,
      input.supportNeeded?.trim() || null,
      input.lessons?.trim() || null,
      input.nextPriorities?.trim() || null,
      roadmapHealth,
      input.keyWins?.trim() || null,
      input.blockers?.trim() || null,
      input.risks?.trim() || null,
      input.dependencies?.trim() || null,
      input.qaNotes?.trim() || null,
    ]
  );
  return normalizePresentation(asRecordRows(result.rows)[0]);
}

export async function updatePresentationStatus(
  presentationId: number,
  status: HRPresentationStatus,
  qaNotes?: string | null
): Promise<HRPresentation | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      UPDATE hr_presentations
      SET status = $2,
          qa_notes = COALESCE($3, qa_notes),
          submitted_at = CASE
            WHEN $2 IN ('submitted', 'reviewed') THEN COALESCE(submitted_at, CURRENT_DATE)
            ELSE submitted_at
          END
      WHERE id = $1
      RETURNING id, employee_id, period, presenter_type, status, achievements, kpi_results,
        tasks_completed, tasks_delayed, challenges, support_needed, lessons, next_priorities,
        roadmap_health, key_wins, blockers, risks, dependencies, qa_notes, submitted_at, created_at
    `,
    [presentationId, status, qaNotes?.trim() || null]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return normalizePresentation(asRecordRows(result.rows)[0]);
}
