import { ensureDbSchema, getDbPool } from "@/lib/db";
import type { HRDashboardSummary } from "@/lib/types";
import {
  HR_CONTRACT_TYPES,
  HR_DEPARTMENTS,
  HR_DISCIPLINARY_STATUSES,
  HR_PAYROLL_STATUSES,
  HR_RATING_BANDS,
  HR_RECRUITMENT_STAGES,
} from "@/lib/types";
import type {
  HRContractType,
  HRDepartment,
  HRDisciplinaryStatus,
  HRRatingBand,
  HRRecruitmentStage,
  HRPayrollStatus,
} from "@/lib/types";
import { currentPeriod } from "@/lib/hr/framework-reference";

import {
  asNullableString,
  asNumber,
  asRecordRows,
  asString,
  type DbRow,
} from "@/lib/hr/shared";

export async function getHRDashboardSummary(): Promise<HRDashboardSummary> {
  await ensureDbSchema();
  const pool = getDbPool();

  const period = currentPeriod();

  const [
    openRolesRes,
    funnelRes,
    timeToHireRes,
    offerRateRes,
    hireBreakdownRes,
    activeHeadcountRes,
    newHiresRes,
    attritionRes,
    contractSplitRes,
    casesRes,
    violationsRes,
    followupsRes,
    renewalsRes,
    payrollRes,
    leavePendingRes,
    anomaliesRes,
    reviewsRes,
    pipsRes,
    kpiRes,
    onboardingRes,
    trainingRes,
    csTrainingRes,
    monthlyScoreRes,
    ratingDistRes,
    deptScoreRes,
    kpiCardRes,
    overdueTaskRes,
    presentationPendingRes,
    rewardsMonthRes,
    accountabilityOpenRes,
    growthDueRes,
    alertsRes,
  ] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*)::int AS open_roles,
        COALESCE(AVG((CURRENT_DATE - opened_at)::numeric), 0)::float AS avg_days_open
      FROM hr_recruitment_roles
      WHERE closed_at IS NULL
    `),
    pool.query(`
      SELECT current_stage, COUNT(*)::int AS count
      FROM hr_recruitment_applicants
      GROUP BY current_stage
    `),
    pool.query(`
      SELECT COALESCE(AVG((hired_at - applied_at)::numeric), 0)::float AS time_to_hire_days
      FROM hr_recruitment_applicants
      WHERE hired_at IS NOT NULL
    `),
    pool.query(`
      SELECT
        CASE
          WHEN COUNT(*) FILTER (WHERE offer_status IS NOT NULL) = 0 THEN 0
          ELSE (
            COUNT(*) FILTER (WHERE offer_status = 'accepted')::float
            / COUNT(*) FILTER (WHERE offer_status IS NOT NULL)::float
          ) * 100
        END AS offer_acceptance_rate
      FROM hr_recruitment_applicants
    `),
    pool.query(`
      SELECT employment_track, COUNT(*)::int AS count
      FROM hr_recruitment_applicants
      WHERE hired_at IS NOT NULL
      GROUP BY employment_track
    `),
    pool.query(`
      SELECT
        COUNT(*)::int AS total_active,
        department,
        COUNT(*)::int AS count
      FROM hr_employees
      WHERE employment_status = 'active'
      GROUP BY department
    `),
    pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE DATE_TRUNC('month', hire_date) = DATE_TRUNC('month', CURRENT_DATE)
        )::int AS month_count,
        COUNT(*) FILTER (
          WHERE DATE_TRUNC('quarter', hire_date) = DATE_TRUNC('quarter', CURRENT_DATE)
        )::int AS quarter_count
      FROM hr_employees
    `),
    pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE exit_date IS NOT NULL
            AND DATE_TRUNC('quarter', exit_date) = DATE_TRUNC('quarter', CURRENT_DATE)
        )::int AS exits_quarter,
        COUNT(*) FILTER (
          WHERE exit_date IS NOT NULL
            AND DATE_TRUNC('quarter', exit_date) = DATE_TRUNC('quarter', CURRENT_DATE)
            AND exit_type = 'voluntary'
        )::int AS exits_voluntary,
        COUNT(*) FILTER (
          WHERE exit_date IS NOT NULL
            AND DATE_TRUNC('quarter', exit_date) = DATE_TRUNC('quarter', CURRENT_DATE)
            AND exit_type = 'involuntary'
        )::int AS exits_involuntary,
        COUNT(*) FILTER (WHERE employment_status = 'active')::int AS active_staff
      FROM hr_employees
    `),
    pool.query(`
      SELECT contract_type, COUNT(*)::int AS count
      FROM hr_employees
      WHERE employment_status = 'active'
      GROUP BY contract_type
    `),
    pool.query(`
      SELECT status, COUNT(*)::int AS count
      FROM hr_disciplinary_cases
      GROUP BY status
    `),
    pool.query(`
      SELECT category, COUNT(*)::int AS count
      FROM hr_policy_violations
      GROUP BY category
    `),
    pool.query(`
      SELECT COUNT(*)::int AS pending_followups
      FROM hr_followup_actions
      WHERE status <> 'done'
    `),
    pool.query(`
      SELECT COUNT(*)::int AS renewals_due
      FROM hr_employees
      WHERE employment_status = 'active'
        AND contract_end_date IS NOT NULL
        AND contract_end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
    `),
    pool.query(`
      SELECT status, COUNT(*)::int AS count
      FROM hr_payroll_cycles
      GROUP BY status
    `),
    pool.query(`
      SELECT COUNT(*)::int AS pending_leave
      FROM hr_leave_requests
      WHERE status = 'pending'
    `),
    pool.query(`
      SELECT COUNT(*)::int AS open_anomalies
      FROM hr_payroll_anomalies
      WHERE status = 'open'
    `),
    pool.query(`
      SELECT
        COUNT(*)::int AS total_reviews,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_reviews,
        COUNT(*) FILTER (
          WHERE due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
            AND status <> 'completed'
        )::int AS upcoming_reviews
      FROM hr_performance_reviews
    `),
    pool.query(`
      SELECT COUNT(*)::int AS active_pips
      FROM hr_pips
      WHERE status IN ('active', 'improving')
    `),
    pool.query(`
      SELECT COALESCE(AVG(score), 0)::float AS avg_kpi
      FROM hr_kpi_scores
      WHERE period_end >= CURRENT_DATE - INTERVAL '90 days'
    `),
    pool.query(`
      SELECT
        COUNT(*)::int AS total_items,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_items
      FROM hr_onboarding_checklists
    `),
    pool.query(`
      SELECT
        COUNT(*)::int AS assigned_count,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_count
      FROM hr_training_assignments
    `),
    pool.query(`
      SELECT
        COUNT(*)::int AS assigned_count,
        COUNT(*) FILTER (WHERE ta.status = 'completed')::int AS completed_count
      FROM hr_training_assignments ta
      INNER JOIN hr_training_modules tm ON tm.id = ta.module_id
      WHERE LOWER(tm.category) LIKE 'cs%'
         OR LOWER(tm.title) LIKE '%customer service%'
    `),
    pool.query(
      `
        SELECT
          COUNT(*)::int AS scored_employees,
          COALESCE(AVG(total_score), 0)::float AS avg_total,
          COUNT(*) FILTER (WHERE total_score >= 90)::int AS excellent_count,
          COUNT(*) FILTER (WHERE total_score >= 80)::int AS bonus_eligible_count,
          COUNT(*) FILTER (WHERE total_score < 60)::int AS poor_count
        FROM hr_monthly_scores
        WHERE period = $1
      `,
      [period]
    ),
    pool.query(
      `
        SELECT rating, COUNT(*)::int AS count
        FROM hr_monthly_scores
        WHERE period = $1
        GROUP BY rating
      `,
      [period]
    ),
    pool.query(
      `
        SELECT e.department AS department, COALESCE(AVG(s.total_score), 0)::float AS avg_total
        FROM hr_monthly_scores s
        INNER JOIN hr_employees e ON e.id = s.employee_id
        WHERE s.period = $1
        GROUP BY e.department
      `,
      [period]
    ),
    pool.query(`
      SELECT COUNT(*)::int AS active_cards
      FROM hr_kpi_cards
      WHERE status = 'active'
    `),
    pool.query(`
      SELECT COUNT(*)::int AS overdue_tasks
      FROM hr_tasks
      WHERE status <> 'completed'
        AND due_date IS NOT NULL
        AND due_date < CURRENT_DATE
    `),
    pool.query(
      `
        SELECT COUNT(*)::int AS pending
        FROM hr_presentations
        WHERE period = $1 AND status <> 'reviewed'
      `,
      [period]
    ),
    pool.query(`
      SELECT COUNT(*)::int AS rewards_month
      FROM hr_rewards
      WHERE DATE_TRUNC('month', awarded_on) = DATE_TRUNC('month', CURRENT_DATE)
    `),
    pool.query(`
      SELECT COUNT(*)::int AS open_actions
      FROM hr_accountability_actions
      WHERE status = 'open'
    `),
    pool.query(`
      SELECT COUNT(*)::int AS due_reviews
      FROM hr_growth_plans
      WHERE status = 'active'
        AND next_review_date IS NOT NULL
        AND next_review_date <= CURRENT_DATE + INTERVAL '30 days'
    `),
    pool.query(`
      SELECT *
      FROM (
        SELECT
          CONCAT('followup-', id::text) AS id,
          'follow_up' AS type,
          action_type AS label,
          due_date::text AS due_on,
          CASE
            WHEN due_date IS NOT NULL AND due_date < CURRENT_DATE THEN 'high'
            ELSE 'medium'
          END AS severity
        FROM hr_followup_actions
        WHERE status <> 'done'
          AND due_date IS NOT NULL
          AND due_date <= CURRENT_DATE + INTERVAL '30 days'

        UNION ALL

        SELECT
          CONCAT('probation-', id::text) AS id,
          'probation_end' AS type,
          CONCAT(full_name, ' probation ends') AS label,
          probation_end_date::text AS due_on,
          'medium' AS severity
        FROM hr_employees
        WHERE employment_status = 'active'
          AND probation_end_date IS NOT NULL
          AND probation_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'

        UNION ALL

        SELECT
          CONCAT('contract-', id::text) AS id,
          'contract_expiry' AS type,
          CONCAT(full_name, ' contract expires') AS label,
          contract_end_date::text AS due_on,
          'high' AS severity
        FROM hr_employees
        WHERE employment_status = 'active'
          AND contract_end_date IS NOT NULL
          AND contract_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      ) alerts
      ORDER BY due_on ASC NULLS LAST
      LIMIT 12
    `),
  ]);

  const funnelTemplate: Record<HRRecruitmentStage, number> = {
    applied: 0,
    screened: 0,
    interviewed: 0,
    offered: 0,
    hired: 0,
  };
  for (const row of asRecordRows(funnelRes.rows)) {
    const stage = asString(row.current_stage) as HRRecruitmentStage;
    if (stage in funnelTemplate) {
      funnelTemplate[stage] = asNumber(row.count);
    }
  }

  const hires = { intern: 0, full_time: 0 };
  for (const row of asRecordRows(hireBreakdownRes.rows)) {
    const track = asString(row.employment_track);
    if (track === "intern") {
      hires.intern = asNumber(row.count);
    }
    if (track === "full_time") {
      hires.full_time = asNumber(row.count);
    }
  }

  const byDepartment: Record<HRDepartment, number> = {
    Operations: 0,
    Product: 0,
    Marketing: 0,
    Tech: 0,
    "Finance & Compliance": 0,
    "HR & Admin": 0,
  };
  let totalActive = 0;
  for (const row of asRecordRows(activeHeadcountRes.rows)) {
    const department = asString(row.department) as HRDepartment;
    const count = asNumber(row.count);
    if (department in byDepartment) {
      byDepartment[department] = count;
      totalActive += count;
    }
  }

  const contractSplit: Record<HRContractType, number> = {
    full_time: 0,
    part_time: 0,
    intern: 0,
    contractor: 0,
  };
  for (const row of asRecordRows(contractSplitRes.rows)) {
    const contractType = asString(row.contract_type) as HRContractType;
    if (contractType in contractSplit) {
      contractSplit[contractType] = asNumber(row.count);
    }
  }

  const complianceByStatus: Record<HRDisciplinaryStatus, number> = {
    warning_issued: 0,
    resolved: 0,
    escalated: 0,
  };
  let openCases = 0;
  for (const row of asRecordRows(casesRes.rows)) {
    const status = asString(row.status) as HRDisciplinaryStatus;
    const count = asNumber(row.count);
    if (status in complianceByStatus) {
      complianceByStatus[status] = count;
      if (status !== "resolved") {
        openCases += count;
      }
    }
  }

  const policyViolations: Record<string, number> = {};
  for (const row of asRecordRows(violationsRes.rows)) {
    policyViolations[asString(row.category)] = asNumber(row.count);
  }

  const payrollByStatus: Record<HRPayrollStatus, number> = {
    processed: 0,
    pending: 0,
    issues_flagged: 0,
  };
  for (const row of asRecordRows(payrollRes.rows)) {
    const status = asString(row.status) as HRPayrollStatus;
    if (status in payrollByStatus) {
      payrollByStatus[status] = asNumber(row.count);
    }
  }

  const attritionRow = asRecordRows(attritionRes.rows)[0] as DbRow | undefined;
  const exitsQuarter = asNumber(attritionRow?.exits_quarter);
  const exitsVoluntary = asNumber(attritionRow?.exits_voluntary);
  const exitsInvoluntary = asNumber(attritionRow?.exits_involuntary);
  const activeStaff = asNumber(attritionRow?.active_staff);
  const attritionRate =
    activeStaff + exitsQuarter === 0
      ? 0
      : (exitsQuarter / (activeStaff + exitsQuarter)) * 100;

  const reviewsRow = asRecordRows(reviewsRes.rows)[0] as DbRow | undefined;
  const totalReviews = asNumber(reviewsRow?.total_reviews);
  const completedReviews = asNumber(reviewsRow?.completed_reviews);
  const reviewCompletionRate =
    totalReviews === 0 ? 0 : (completedReviews / totalReviews) * 100;

  const onboardingRow = asRecordRows(onboardingRes.rows)[0] as DbRow | undefined;
  const onboardingTotal = asNumber(onboardingRow?.total_items);
  const onboardingCompleted = asNumber(onboardingRow?.completed_items);
  const onboardingCompletionRate =
    onboardingTotal === 0 ? 0 : (onboardingCompleted / onboardingTotal) * 100;

  const trainingRow = asRecordRows(trainingRes.rows)[0] as DbRow | undefined;
  const csTrainingRow = asRecordRows(csTrainingRes.rows)[0] as DbRow | undefined;
  const csAssigned = asNumber(csTrainingRow?.assigned_count);
  const csCompleted = asNumber(csTrainingRow?.completed_count);
  const csCompletionRate = csAssigned === 0 ? 0 : (csCompleted / csAssigned) * 100;

  const monthlyScoreRow = asRecordRows(monthlyScoreRes.rows)[0] as DbRow | undefined;

  const ratingDistribution = HR_RATING_BANDS.reduce(
    (acc, band) => {
      acc[band] = 0;
      return acc;
    },
    {} as Record<HRRatingBand, number>
  );
  for (const row of asRecordRows(ratingDistRes.rows)) {
    const rating = asString(row.rating) as HRRatingBand;
    if (rating in ratingDistribution) {
      ratingDistribution[rating] = asNumber(row.count);
    }
  }

  const avgScoreByDepartment = HR_DEPARTMENTS.reduce(
    (acc, department) => {
      acc[department] = 0;
      return acc;
    },
    {} as Record<HRDepartment, number>
  );
  for (const row of asRecordRows(deptScoreRes.rows)) {
    const department = asString(row.department) as HRDepartment;
    if (department in avgScoreByDepartment) {
      avgScoreByDepartment[department] = asNumber(row.avg_total);
    }
  }

  return {
    recruitment: {
      open_roles: asNumber((asRecordRows(openRolesRes.rows)[0] as DbRow)?.open_roles),
      avg_days_open: asNumber((asRecordRows(openRolesRes.rows)[0] as DbRow)?.avg_days_open),
      funnel: funnelTemplate,
      time_to_hire_days: asNumber(
        (asRecordRows(timeToHireRes.rows)[0] as DbRow)?.time_to_hire_days
      ),
      offer_acceptance_rate: asNumber(
        (asRecordRows(offerRateRes.rows)[0] as DbRow)?.offer_acceptance_rate
      ),
      intern_hires: hires.intern,
      full_time_hires: hires.full_time,
    },
    headcount: {
      total_active: totalActive,
      by_department: byDepartment,
      new_hires_month: asNumber((asRecordRows(newHiresRes.rows)[0] as DbRow)?.month_count),
      new_hires_quarter: asNumber(
        (asRecordRows(newHiresRes.rows)[0] as DbRow)?.quarter_count
      ),
      attrition_rate: attritionRate,
      exits_voluntary: exitsVoluntary,
      exits_involuntary: exitsInvoluntary,
      contract_split: contractSplit,
    },
    compliance: {
      open_cases: openCases,
      by_status: complianceByStatus,
      policy_violations: policyViolations,
      pending_followups: asNumber(
        (asRecordRows(followupsRes.rows)[0] as DbRow)?.pending_followups
      ),
      contract_renewals_due: asNumber(
        (asRecordRows(renewalsRes.rows)[0] as DbRow)?.renewals_due
      ),
    },
    payroll_leave: {
      payroll_by_status: payrollByStatus,
      leave_pending_approval: asNumber(
        (asRecordRows(leavePendingRes.rows)[0] as DbRow)?.pending_leave
      ),
      anomalies_open: asNumber(
        (asRecordRows(anomaliesRes.rows)[0] as DbRow)?.open_anomalies
      ),
    },
    performance: {
      upcoming_reviews: asNumber(reviewsRow?.upcoming_reviews),
      review_completion_rate: reviewCompletionRate,
      active_pips: asNumber((asRecordRows(pipsRes.rows)[0] as DbRow)?.active_pips),
      direct_report_kpi_points: asNumber((asRecordRows(kpiRes.rows)[0] as DbRow)?.avg_kpi),
    },
    training: {
      onboarding_completion_rate: onboardingCompletionRate,
      modules_assigned: asNumber(trainingRow?.assigned_count),
      modules_completed: asNumber(trainingRow?.completed_count),
      cs_curriculum_completion_rate: csCompletionRate,
    },
    framework: {
      period,
      scored_employees: asNumber(monthlyScoreRow?.scored_employees),
      avg_monthly_score: asNumber(monthlyScoreRow?.avg_total),
      excellent_count: asNumber(monthlyScoreRow?.excellent_count),
      bonus_eligible_count: asNumber(monthlyScoreRow?.bonus_eligible_count),
      poor_count: asNumber(monthlyScoreRow?.poor_count),
      rating_distribution: ratingDistribution,
      avg_score_by_department: avgScoreByDepartment,
      active_kpi_cards: asNumber(
        (asRecordRows(kpiCardRes.rows)[0] as DbRow)?.active_cards
      ),
      overdue_tasks: asNumber(
        (asRecordRows(overdueTaskRes.rows)[0] as DbRow)?.overdue_tasks
      ),
      presentations_pending: asNumber(
        (asRecordRows(presentationPendingRes.rows)[0] as DbRow)?.pending
      ),
      rewards_this_month: asNumber(
        (asRecordRows(rewardsMonthRes.rows)[0] as DbRow)?.rewards_month
      ),
      open_accountability: asNumber(
        (asRecordRows(accountabilityOpenRes.rows)[0] as DbRow)?.open_actions
      ),
      growth_reviews_due: asNumber(
        (asRecordRows(growthDueRes.rows)[0] as DbRow)?.due_reviews
      ),
    },
    alerts: asRecordRows(alertsRes.rows).map((row) => ({
      id: asString(row.id),
      type: asString(row.type),
      label: asString(row.label),
      due_on: asNullableString(row.due_on),
      severity: (asString(row.severity) as "low" | "medium" | "high") || "medium",
    })),
  };
}
