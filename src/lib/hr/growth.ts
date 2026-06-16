import { ensureDbSchema, getDbPool } from "@/lib/db";
import type { HRGrowthPlan, HRGrowthPlanStatus } from "@/lib/types";
import { HR_GROWTH_PLAN_STATUSES } from "@/lib/types";
import {
  applyListLimit,
  asRecordRows,
  asString,
  ensureDateOnly,
  ensureEnumValue,
  normalizeGrowthPlan,
} from "@/lib/hr/shared";
import type { CreateGrowthPlanInput } from "@/lib/hr/types";

export type HRGrowthPlanWithEmployee = HRGrowthPlan & {
  employee_name: string;
  department: string;
};

export async function listGrowthPlans(options: {
  status?: string;
  limit?: number;
} = {}): Promise<HRGrowthPlanWithEmployee[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (options.status?.trim()) {
    values.push(options.status.trim());
    conditions.push(`g.status = $${values.length}`);
  }

  let query = `
    SELECT
      g.id, g.employee_id, g."current_role", g.current_responsibilities, g.required_kpis,
      g.skills_to_improve, g.possible_next_role, g.promotion_requirements, g.training_needed,
      g.review_timeline, g.status, g.next_review_date, g.created_at, g.updated_at,
      e.full_name AS employee_name, e.department AS department
    FROM hr_growth_plans g
    INNER JOIN hr_employees e ON e.id = g.employee_id
  `;

  if (conditions.length > 0) {
    query += `\nWHERE ${conditions.join(" AND ")}`;
  }

  query += "\nORDER BY g.next_review_date ASC NULLS LAST, g.id DESC";
  query = applyListLimit(query, values, options.limit);

  const result = await pool.query(query, values);
  return asRecordRows(result.rows).map((row) => ({
    ...normalizeGrowthPlan(row),
    employee_name: asString(row.employee_name),
    department: asString(row.department),
  }));
}

export async function createGrowthPlan(
  input: CreateGrowthPlanInput
): Promise<HRGrowthPlan> {
  await ensureDbSchema();
  const pool = getDbPool();
  const status = ensureEnumValue(
    input.status || "active",
    HR_GROWTH_PLAN_STATUSES,
    "growthPlanStatus"
  );
  const result = await pool.query(
    `
      INSERT INTO hr_growth_plans (
        employee_id, "current_role", current_responsibilities, required_kpis,
        skills_to_improve, possible_next_role, promotion_requirements, training_needed,
        review_timeline, status, next_review_date, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING id, employee_id, "current_role", current_responsibilities, required_kpis,
        skills_to_improve, possible_next_role, promotion_requirements, training_needed,
        review_timeline, status, next_review_date, created_at, updated_at
    `,
    [
      input.employeeId,
      input.currentRole?.trim() || null,
      input.currentResponsibilities?.trim() || null,
      input.requiredKpis?.trim() || null,
      input.skillsToImprove?.trim() || null,
      input.possibleNextRole?.trim() || null,
      input.promotionRequirements?.trim() || null,
      input.trainingNeeded?.trim() || null,
      input.reviewTimeline?.trim() || null,
      status,
      ensureDateOnly(input.nextReviewDate),
    ]
  );
  return normalizeGrowthPlan(asRecordRows(result.rows)[0]);
}

export async function updateGrowthPlanStatus(
  planId: number,
  status: HRGrowthPlanStatus,
  nextReviewDate?: string | null
): Promise<HRGrowthPlan | null> {
  await ensureDbSchema();
  const pool = getDbPool();
  const result = await pool.query(
    `
      UPDATE hr_growth_plans
      SET status = $2,
          next_review_date = COALESCE($3, next_review_date),
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, employee_id, "current_role", current_responsibilities, required_kpis,
        skills_to_improve, possible_next_role, promotion_requirements, training_needed,
        review_timeline, status, next_review_date, created_at, updated_at
    `,
    [planId, status, ensureDateOnly(nextReviewDate)]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return normalizeGrowthPlan(asRecordRows(result.rows)[0]);
}
