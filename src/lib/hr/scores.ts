import { ensureDbSchema, getDbPool } from "@/lib/db";
import type { HRMonthlyScore } from "@/lib/types";
import {
  applyListLimit,
  asRecordRows,
  asString,
  normalizeMonthlyScore,
} from "@/lib/hr/shared";
import { SCORE_WEIGHTS, computeRating, computeWeightedTotal, normalizeDimensionScore } from "@/lib/hr/framework-reference";
import type { CreateMonthlyScoreInput } from "@/lib/hr/types";

export type HRMonthlyScoreWithEmployee = HRMonthlyScore & {
  employee_name: string;
  department: string;
};

function normalizeScoreInput(input: CreateMonthlyScoreInput): CreateMonthlyScoreInput {
  return {
    ...input,
    kpiScore: normalizeDimensionScore(input.kpiScore, SCORE_WEIGHTS.kpi),
    disciplineScore: normalizeDimensionScore(input.disciplineScore, SCORE_WEIGHTS.discipline),
    attendanceScore: normalizeDimensionScore(input.attendanceScore, SCORE_WEIGHTS.attendance),
    hygieneScore: normalizeDimensionScore(input.hygieneScore, SCORE_WEIGHTS.hygiene),
    extracurricularScore: normalizeDimensionScore(
      input.extracurricularScore,
      SCORE_WEIGHTS.extracurricular
    ),
  };
}

export async function listMonthlyScores(options: {
  period?: string;
  rating?: string;
  employeeId?: number;
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
  if (Number.isFinite(options.employeeId) && Number(options.employeeId) > 0) {
    values.push(options.employeeId);
    conditions.push(`s.employee_id = $${values.length}`);
  }

  let query = `
    SELECT
      s.id, s.employee_id, s.period, s.kpi_score, s.task_score, s.comms_score,
      s.hygiene_score, s.extracurricular_score,
      s.total_score, s.rating, s.notes, s.scored_by, s.created_at,
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
  const normalized = normalizeScoreInput(input);
  const total = computeWeightedTotal(normalized);
  const rating = computeRating(total);
  const result = await pool.query(
    `
      INSERT INTO hr_monthly_scores (
        employee_id, period, kpi_score, task_score, comms_score, teamwork_score,
        hygiene_score, extracurricular_score,
        total_score, rating, notes, scored_by
      )
      VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (employee_id, period) DO UPDATE
      SET kpi_score = EXCLUDED.kpi_score,
          task_score = EXCLUDED.task_score,
          comms_score = EXCLUDED.comms_score,
          teamwork_score = 0,
          hygiene_score = EXCLUDED.hygiene_score,
          extracurricular_score = EXCLUDED.extracurricular_score,
          total_score = EXCLUDED.total_score,
          rating = EXCLUDED.rating,
          notes = EXCLUDED.notes,
          scored_by = EXCLUDED.scored_by
      RETURNING id, employee_id, period, kpi_score, task_score, comms_score,
        hygiene_score, extracurricular_score,
        total_score, rating, notes, scored_by, created_at
    `,
    [
      normalized.employeeId,
      normalized.period.trim(),
      normalized.kpiScore,
      normalized.disciplineScore,
      normalized.attendanceScore,
      normalized.hygieneScore,
      normalized.extracurricularScore,
      total,
      rating,
      normalized.notes?.trim() || null,
      normalized.scoredBy?.trim() || null,
    ]
  );
  return normalizeMonthlyScore(asRecordRows(result.rows)[0]);
}

export async function deleteMonthlyScore(id: number): Promise<boolean> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(`DELETE FROM hr_monthly_scores WHERE id = $1 RETURNING id`, [id]);
  return (result.rowCount ?? 0) > 0;
}
