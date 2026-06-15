import { ensureDbSchema, getDbPool } from "@/lib/db";
import type { HRKpiScore, HRPerformanceReview, HRPip, HRPipStatus, HRReviewStatus } from "@/lib/types";
import { HR_PIP_STATUSES } from "@/lib/types";
import {
  applyListLimit,
  asRecordRows,
  ensureDateOnly,
  ensureEnumValue,
  normalizeKpiScore,
  normalizePerformanceReview,
  normalizePip,
} from "@/lib/hr/shared";
import type {
  CreateKpiScoreInput,
  CreatePerformanceReviewInput,
  CreatePipInput,
} from "@/lib/hr/types";

export async function listPerformanceReviews(options: {
  status?: string;
  limit?: number;
} = {}): Promise<HRPerformanceReview[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.status?.trim()) {
    values.push(options.status.trim());
    conditions.push(`status = $${values.length}`);
  }

  let query = `
    SELECT
      id, employee_id, review_period, due_date, completed_at, status,
      reviewer_employee_id, notes, created_at
    FROM hr_performance_reviews
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY due_date ASC, id DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizePerformanceReview);
}

export async function createPerformanceReview(
  input: CreatePerformanceReviewInput
): Promise<HRPerformanceReview> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      INSERT INTO hr_performance_reviews (
        employee_id, review_period, due_date, status, reviewer_employee_id, notes
      )
      VALUES ($1, $2, $3, 'pending', $4, $5)
      RETURNING
        id, employee_id, review_period, due_date, completed_at, status,
        reviewer_employee_id, notes, created_at
    `,
    [
      input.employeeId,
      input.reviewPeriod.trim(),
      ensureDateOnly(input.dueDate),
      input.reviewerEmployeeId ?? null,
      input.notes?.trim() || null,
    ]
  );
  return normalizePerformanceReview(asRecordRows(result.rows)[0]);
}

export async function updatePerformanceReviewStatus(
  reviewId: number,
  status: HRReviewStatus
): Promise<HRPerformanceReview | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const completedAt =
    status === "completed" ? new Date().toISOString().slice(0, 10) : null;
  const result = await pool.query(
    `
      UPDATE hr_performance_reviews
      SET status = $2,
          completed_at = COALESCE($3, completed_at)
      WHERE id = $1
      RETURNING
        id, employee_id, review_period, due_date, completed_at, status,
        reviewer_employee_id, notes, created_at
    `,
    [reviewId, status, completedAt]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return normalizePerformanceReview(asRecordRows(result.rows)[0]);
}

export async function listPips(options: {
  status?: string;
  limit?: number;
} = {}): Promise<HRPip[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.status?.trim()) {
    values.push(options.status.trim());
    conditions.push(`status = $${values.length}`);
  }

  let query = `
    SELECT id, employee_id, status, start_date, end_date, progress_note, last_updated
    FROM hr_pips
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY last_updated DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizePip);
}

export async function createPip(input: CreatePipInput): Promise<HRPip> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      INSERT INTO hr_pips (
        employee_id, status, start_date, end_date, progress_note, last_updated
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, employee_id, status, start_date, end_date, progress_note, last_updated
    `,
    [
      input.employeeId,
      ensureEnumValue(input.status, HR_PIP_STATUSES, "pipStatus"),
      ensureDateOnly(input.startDate),
      ensureDateOnly(input.endDate),
      input.progressNote?.trim() || null,
    ]
  );
  return normalizePip(asRecordRows(result.rows)[0]);
}

export async function updatePipStatus(
  pipId: number,
  status: HRPipStatus,
  progressNote?: string | null
): Promise<HRPip | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      UPDATE hr_pips
      SET status = $2,
          progress_note = COALESCE($3, progress_note),
          last_updated = NOW()
      WHERE id = $1
      RETURNING id, employee_id, status, start_date, end_date, progress_note, last_updated
    `,
    [pipId, status, progressNote?.trim() || null]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return normalizePip(asRecordRows(result.rows)[0]);
}

export async function listKpiScores(options: {
  limit?: number;
} = {}): Promise<HRKpiScore[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const values: unknown[] = [];
  const query = applyListLimit(
    `
      SELECT id, employee_id, metric_name, score, period_start, period_end, created_at
      FROM hr_kpi_scores
      ORDER BY period_end DESC, created_at DESC
    `,
    values,
    options.limit
  );
  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map(normalizeKpiScore);
}

export async function createKpiScore(input: CreateKpiScoreInput): Promise<HRKpiScore> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      INSERT INTO hr_kpi_scores (
        employee_id, metric_name, score, period_start, period_end
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, employee_id, metric_name, score, period_start, period_end, created_at
    `,
    [
      input.employeeId,
      input.metricName.trim(),
      input.score,
      ensureDateOnly(input.periodStart),
      ensureDateOnly(input.periodEnd),
    ]
  );
  return normalizeKpiScore(asRecordRows(result.rows)[0]);
}
