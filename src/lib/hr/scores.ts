import { ensureDbSchema, getDbPool } from "@/lib/db";
import type { HRMonthlyScore } from "@/lib/types";
import {
  applyListLimit,
  asRecordRows,
  asString,
  normalizeMonthlyScore,
} from "@/lib/hr/shared";
import { SCORE_WEIGHTS, computeRating } from "@/lib/hr/framework-reference";
import type { CreateMonthlyScoreInput } from "@/lib/hr/types";

export type HRMonthlyScoreWithEmployee = HRMonthlyScore & {
  employee_name: string;
  department: string;
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function computeWeightedTotal(input: {
  kpiScore: number;
  taskScore: number;
  commsScore: number;
  teamworkScore: number;
}): number {
  const total =
    (clampPercent(input.kpiScore) * SCORE_WEIGHTS.kpi +
      clampPercent(input.taskScore) * SCORE_WEIGHTS.task +
      clampPercent(input.commsScore) * SCORE_WEIGHTS.comms +
      clampPercent(input.teamworkScore) * SCORE_WEIGHTS.teamwork) /
    100;
  return Math.round(total * 100) / 100;
}

export async function listMonthlyScores(options: {
  period?: string;
  rating?: string;
  limit?: number;
} = {}): Promise<HRMonthlyScoreWithEmployee[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.period?.trim()) {
    values.push(options.period.trim());
    conditions.push(`s.period = $${values.length}`);
  }
  if (options.rating?.trim()) {
    values.push(options.rating.trim());
    conditions.push(`s.rating = $${values.length}`);
  }

  let query = `
    SELECT
      s.id, s.employee_id, s.period, s.kpi_score, s.task_score, s.comms_score,
      s.teamwork_score, s.total_score, s.rating, s.notes, s.scored_by, s.created_at,
      e.full_name AS employee_name, e.department AS department
    FROM hr_monthly_scores s
    INNER JOIN hr_employees e ON e.id = s.employee_id
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY s.period DESC, s.total_score DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map((row) => ({
    ...normalizeMonthlyScore(row),
    employee_name: asString(row.employee_name),
    department: asString(row.department),
  }));
}

export async function upsertMonthlyScore(
  input: CreateMonthlyScoreInput
): Promise<HRMonthlyScore> {
  await ensureDbSchema();
  const pool = getDbPool();
  const total = computeWeightedTotal(input);
  const rating = computeRating(total);
  const result = await pool.query(
    `
      INSERT INTO hr_monthly_scores (
        employee_id, period, kpi_score, task_score, comms_score, teamwork_score,
        total_score, rating, notes, scored_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (employee_id, period) DO UPDATE
      SET kpi_score = EXCLUDED.kpi_score,
          task_score = EXCLUDED.task_score,
          comms_score = EXCLUDED.comms_score,
          teamwork_score = EXCLUDED.teamwork_score,
          total_score = EXCLUDED.total_score,
          rating = EXCLUDED.rating,
          notes = EXCLUDED.notes,
          scored_by = EXCLUDED.scored_by
      RETURNING id, employee_id, period, kpi_score, task_score, comms_score,
        teamwork_score, total_score, rating, notes, scored_by, created_at
    `,
    [
      input.employeeId,
      input.period.trim(),
      clampPercent(input.kpiScore),
      clampPercent(input.taskScore),
      clampPercent(input.commsScore),
      clampPercent(input.teamworkScore),
      total,
      rating,
      input.notes?.trim() || null,
      input.scoredBy?.trim() || null,
    ]
  );
  return normalizeMonthlyScore(asRecordRows(result.rows)[0]);
}
