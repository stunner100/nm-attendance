import { ensureDbSchema, getDbPool } from "@/lib/db";
import type { AtRiskEmployee, HRDepartment } from "@/lib/types";
import { normalizePeriod } from "@/lib/hr/framework-reference";
import { asNumber, asRecordRows, asString } from "@/lib/hr/shared";

export async function getAtRiskEmployees(periodInput?: string): Promise<AtRiskEmployee[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const period = normalizePeriod(periodInput);

  const result = await pool.query(
    `
      SELECT
        e.id,
        e.full_name,
        e.department,
        e.job_title,
        s.total_score AS latest_score,
        (
          SELECT COUNT(*)::int
          FROM hr_monthly_scores s2
          WHERE s2.employee_id = e.id
            AND s2.period <= $1
            AND s2.total_score < 70
        ) AS months_below_threshold
      FROM hr_employees e
      INNER JOIN hr_monthly_scores s
        ON s.employee_id = e.id
       AND s.period = $1
      WHERE e.employment_status = 'active'
        AND s.total_score < 70
      ORDER BY s.total_score ASC, months_below_threshold DESC, e.full_name ASC
      LIMIT 8
    `,
    [period]
  );

  return asRecordRows(result.rows).map((row) => ({
    id: asNumber(row.id),
    full_name: asString(row.full_name),
    department: asString(row.department) as HRDepartment,
    job_title: row.job_title ? asString(row.job_title) : null,
    latest_score: asNumber(row.latest_score),
    months_below_threshold: Math.max(1, asNumber(row.months_below_threshold)),
    href: `/admin/headcount/${asNumber(row.id)}`,
  }));
}
