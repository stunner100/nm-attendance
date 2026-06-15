import { ensureDbSchema, getDbPool } from "@/lib/db";
import type {
  HRDisciplinaryCase,
  HREmployee,
  HRFollowupAction,
  HRKpiScore,
  HRLeaveBalance,
  HRLeaveRequest,
  HROnboardingChecklist,
  HRPayrollAnomaly,
  HRPayrollCycle,
  HRPerformanceReview,
  HRPip,
  HRPolicyViolation,
  HRRecruitmentApplicant,
  HRRecruitmentRole,
  HRTrainingAssignment,
  HRTrainingModule,
} from "@/lib/types";
import { asNumber, asRecordRows } from "@/lib/hr/shared";
import { listDisciplinaryCases, listFollowupActions, listPolicyViolations } from "@/lib/hr/compliance";
import { listHREmployees } from "@/lib/hr/employees";
import {
  listLeaveBalances,
  listLeaveRequests,
  listPayrollAnomalies,
  listPayrollCycles,
} from "@/lib/hr/payroll-leave";
import { listKpiScores, listPerformanceReviews, listPips } from "@/lib/hr/performance";
import { listRecruitmentApplicants, listRecruitmentRoles } from "@/lib/hr/recruitment";
import {
  listOnboardingChecklists,
  listTrainingAssignments,
  listTrainingModules,
} from "@/lib/hr/training";

export type HRRecruitmentModuleData = {
  roles: HRRecruitmentRole[];
  applicants: HRRecruitmentApplicant[];
};

export type HRHeadcountModuleData = {
  employees: HREmployee[];
  totalActive: number;
  newHiresMonth: number;
  newHiresQuarter: number;
  attritionRate: number;
  exitsVoluntary: number;
  exitsInvoluntary: number;
};

export type HRComplianceModuleData = {
  cases: HRDisciplinaryCase[];
  violations: HRPolicyViolation[];
  actions: HRFollowupAction[];
};

export type HRPayrollLeaveModuleData = {
  payrollCycles: HRPayrollCycle[];
  payrollAnomalies: HRPayrollAnomaly[];
  leaveBalances: HRLeaveBalance[];
  leaveRequests: HRLeaveRequest[];
};

export type HRPerformanceModuleData = {
  reviews: HRPerformanceReview[];
  pips: HRPip[];
  kpiScores: HRKpiScore[];
};

export type HRTrainingModuleData = {
  modules: HRTrainingModule[];
  assignments: HRTrainingAssignment[];
  onboarding: HROnboardingChecklist[];
};

export async function getRecruitmentModuleData(filters: {
  department?: string;
  stage?: string;
} = {}): Promise<HRRecruitmentModuleData> {
  const [roles, applicants] = await Promise.all([
    listRecruitmentRoles({ department: filters.department }),
    listRecruitmentApplicants({ stage: filters.stage }),
  ]);
  return { roles, applicants };
}

export async function getHeadcountModuleData(filters: {
  department?: string;
  status?: string;
  contractType?: string;
} = {}): Promise<HRHeadcountModuleData> {
  await ensureDbSchema();
  const pool = getDbPool();

  const [employees, newHiresRes, attritionRes, activeHeadcountRes] = await Promise.all([
    listHREmployees(filters),
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
      SELECT COUNT(*)::int AS total_active
      FROM hr_employees
      WHERE employment_status = 'active'
    `),
  ]);

  const newHiresRow = asRecordRows(newHiresRes.rows)[0] ?? {};
  const attritionRow = asRecordRows(attritionRes.rows)[0] ?? {};
  const totalActiveRow = asRecordRows(activeHeadcountRes.rows)[0] ?? {};
  const activeStaff = asNumber(attritionRow.active_staff);
  const exitsQuarter = asNumber(attritionRow.exits_quarter);

  return {
    employees,
    totalActive: asNumber(totalActiveRow.total_active),
    newHiresMonth: asNumber(newHiresRow.month_count),
    newHiresQuarter: asNumber(newHiresRow.quarter_count),
    attritionRate: activeStaff === 0 ? 0 : (exitsQuarter / activeStaff) * 100,
    exitsVoluntary: asNumber(attritionRow.exits_voluntary),
    exitsInvoluntary: asNumber(attritionRow.exits_involuntary),
  };
}

export async function getComplianceModuleData(filters: {
  status?: string;
  severity?: string;
} = {}): Promise<HRComplianceModuleData> {
  const [cases, violations, actions] = await Promise.all([
    listDisciplinaryCases({ status: filters.status }),
    listPolicyViolations({ severity: filters.severity }),
    listFollowupActions(),
  ]);
  return { cases, violations, actions };
}

export async function getPayrollLeaveModuleData(filters: {
  cycleStatus?: string;
  leaveStatus?: string;
} = {}): Promise<HRPayrollLeaveModuleData> {
  const [payrollCycles, payrollAnomalies, leaveBalances, leaveRequests] =
    await Promise.all([
      listPayrollCycles({ status: filters.cycleStatus }),
      listPayrollAnomalies(),
      listLeaveBalances(),
      listLeaveRequests({ status: filters.leaveStatus }),
    ]);
  return { payrollCycles, payrollAnomalies, leaveBalances, leaveRequests };
}

export async function getPerformanceModuleData(filters: {
  reviewStatus?: string;
  pipStatus?: string;
} = {}): Promise<HRPerformanceModuleData> {
  const [reviews, pips, kpiScores] = await Promise.all([
    listPerformanceReviews({ status: filters.reviewStatus }),
    listPips({ status: filters.pipStatus }),
    listKpiScores(),
  ]);
  return { reviews, pips, kpiScores };
}

export async function getTrainingModuleData(filters: {
  category?: string;
  assignmentStatus?: string;
} = {}): Promise<HRTrainingModuleData> {
  const [modules, assignments, onboarding] = await Promise.all([
    listTrainingModules({ category: filters.category }),
    listTrainingAssignments({ status: filters.assignmentStatus }),
    listOnboardingChecklists(),
  ]);
  return { modules, assignments, onboarding };
}
