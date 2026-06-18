import { ensureDbSchema, getDbPool } from "@/lib/db";
import { asNumber, asRecordRows, asString } from "@/lib/hr/shared";

export type PerformanceRecommendation = {
  employeeId: number;
  employeeName: string;
  department: string;
  period: string;
  kind: "reward" | "accountability" | "growth" | "training";
  label: string;
  reason: string;
  severity: "low" | "medium" | "high";
};

export async function getPerformanceRecommendations(
  period: string
): Promise<PerformanceRecommendation[]> {
  await ensureDbSchema();
  const pool = getDbPool();
  const recommendations: PerformanceRecommendation[] = [];

  const scoresRes = await pool.query(
    `
      SELECT s.employee_id, s.total_score, s.kpi_score, s.task_score,
        s.comms_score, s.hygiene_score, s.extracurricular_score,
        e.full_name, e.department
      FROM hr_monthly_scores s
      INNER JOIN hr_employees e ON e.id = s.employee_id
      WHERE s.period = $1
      ORDER BY s.total_score DESC
    `,
    [period]
  );

  for (const row of asRecordRows(scoresRes.rows)) {
    const employeeId = asNumber(row.employee_id);
    const employeeName = asString(row.full_name);
    const department = asString(row.department);
    const total = asNumber(row.total_score);

    if (total >= 90) {
      recommendations.push({
        employeeId,
        employeeName,
        department,
        period,
        kind: "reward",
        label: "Higher reward or special recognition",
        reason: `Scored ${total.toFixed(1)} (90–100: Excellent)`,
        severity: "low",
      });
    } else if (total >= 80) {
      recommendations.push({
        employeeId,
        employeeName,
        department,
        period,
        kind: "reward",
        label: "Standard monthly reward",
        reason: `Scored ${total.toFixed(1)} (80–89: Strong)`,
        severity: "low",
      });
    } else if (total >= 60 && total < 70) {
      recommendations.push({
        employeeId,
        employeeName,
        department,
        period,
        kind: "accountability",
        label: "Coaching or improvement note",
        reason: `Scored ${total.toFixed(1)} (60–69: Below Expectation)`,
        severity: "medium",
      });
    } else if (total < 60) {
      recommendations.push({
        employeeId,
        employeeName,
        department,
        period,
        kind: "accountability",
        label: "Formal review or PIP consideration",
        reason: `Scored ${total.toFixed(1)} (below 60: Poor)`,
        severity: "high",
      });
    }

    const attendance = asNumber(row.comms_score);
    const discipline = asNumber(row.task_score);
    const kpi = asNumber(row.kpi_score);

    if (attendance > 0 && attendance < 70) {
      recommendations.push({
        employeeId,
        employeeName,
        department,
        period,
        kind: "training",
        label: "Attendance improvement coaching",
        reason: `Attendance score ${attendance.toFixed(1)} is below 70`,
        severity: "medium",
      });
    }
    if (discipline > 0 && discipline < 70) {
      recommendations.push({
        employeeId,
        employeeName,
        department,
        period,
        kind: "training",
        label: "Discipline & conduct coaching",
        reason: `Discipline score ${discipline.toFixed(1)} is below 70`,
        severity: "medium",
      });
    }
    if (kpi > 0 && kpi < 70) {
      recommendations.push({
        employeeId,
        employeeName,
        department,
        period,
        kind: "training",
        label: "Department-specific KPI coaching",
        reason: `KPI performance score ${kpi.toFixed(1)} is below 70`,
        severity: "medium",
      });
    }
  }

  const streakRes = await pool.query(
    `
      WITH ranked AS (
        SELECT
          employee_id,
          period,
          total_score,
          LAG(total_score, 1) OVER (PARTITION BY employee_id ORDER BY period) AS prev_score,
          LAG(total_score, 2) OVER (PARTITION BY employee_id ORDER BY period) AS prev2_score
        FROM hr_monthly_scores
      )
      SELECT r.employee_id, r.total_score, r.prev_score, e.full_name, e.department
      FROM ranked r
      INNER JOIN hr_employees e ON e.id = r.employee_id
      WHERE r.period = $1
        AND r.total_score >= 90
        AND r.prev_score >= 90
        AND r.prev2_score >= 90
    `,
    [period]
  );

  for (const row of asRecordRows(streakRes.rows)) {
    recommendations.push({
      employeeId: asNumber(row.employee_id),
      employeeName: asString(row.full_name),
      department: asString(row.department),
      period,
      kind: "growth",
      label: "Promotion or salary review consideration",
      reason: "90+ score for 3 consecutive months",
      severity: "low",
    });
  }

  const twoMonthLowRes = await pool.query(
    `
      WITH ranked AS (
        SELECT
          employee_id,
          period,
          total_score,
          LAG(total_score, 1) OVER (PARTITION BY employee_id ORDER BY period) AS prev_score
        FROM hr_monthly_scores
      )
      SELECT r.employee_id, r.total_score, e.full_name, e.department
      FROM ranked r
      INNER JOIN hr_employees e ON e.id = r.employee_id
      WHERE r.period = $1
        AND r.total_score < 70
        AND r.prev_score < 70
    `,
    [period]
  );

  for (const row of asRecordRows(twoMonthLowRes.rows)) {
    recommendations.push({
      employeeId: asNumber(row.employee_id),
      employeeName: asString(row.full_name),
      department: asString(row.department),
      period,
      kind: "accountability",
      label: "Recommend Performance Improvement Plan",
      reason: "Below 70 for two consecutive months",
      severity: "high",
    });
  }

  const missedTasksRes = await pool.query(`
    SELECT t.employee_id, COUNT(*)::int AS missed_count, e.full_name, e.department
    FROM hr_tasks t
    INNER JOIN hr_employees e ON e.id = t.employee_id
    WHERE t.status IN ('missed', 'delayed')
      AND t.due_date >= CURRENT_DATE - INTERVAL '60 days'
    GROUP BY t.employee_id, e.full_name, e.department
    HAVING COUNT(*) >= 2
  `);

  for (const row of asRecordRows(missedTasksRes.rows)) {
    recommendations.push({
      employeeId: asNumber(row.employee_id),
      employeeName: asString(row.full_name),
      department: asString(row.department),
      period,
      kind: "accountability",
      label: "Accountability action for repeated missed tasks",
      reason: `${asNumber(row.missed_count)} missed or delayed tasks in 60 days`,
      severity: "high",
    });
  }

  return recommendations;
}
