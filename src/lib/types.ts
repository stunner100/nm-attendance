export type GpsStatus = "idle" | "loading" | "granted" | "denied";

export type AttendanceRow = {
  id: number;
  name: string;
  timestamp: string;
  checkout_timestamp: string | null;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  created_at: string;
};

export const HR_DEPARTMENTS = [
  "Operations",
  "Marketing",
  "Tech",
  "Finance & Compliance",
  "HR & Admin",
] as const;
export type HRDepartment = (typeof HR_DEPARTMENTS)[number];

export const HR_CONTRACT_TYPES = [
  "full_time",
  "part_time",
  "intern",
  "contractor",
] as const;
export type HRContractType = (typeof HR_CONTRACT_TYPES)[number];

export const HR_EMPLOYMENT_STATUSES = [
  "active",
  "inactive",
  "terminated",
  "resigned",
] as const;
export type HREmploymentStatus = (typeof HR_EMPLOYMENT_STATUSES)[number];

export const HR_RECRUITMENT_STAGES = [
  "applied",
  "screened",
  "interviewed",
  "offered",
  "hired",
] as const;
export type HRRecruitmentStage = (typeof HR_RECRUITMENT_STAGES)[number];

export const HR_DISCIPLINARY_STATUSES = [
  "warning_issued",
  "resolved",
  "escalated",
] as const;
export type HRDisciplinaryStatus = (typeof HR_DISCIPLINARY_STATUSES)[number];

export const HR_PAYROLL_STATUSES = ["processed", "pending", "issues_flagged"] as const;
export type HRPayrollStatus = (typeof HR_PAYROLL_STATUSES)[number];

export const HR_LEAVE_REQUEST_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;
export type HRLeaveRequestStatus = (typeof HR_LEAVE_REQUEST_STATUSES)[number];

export const HR_REVIEW_STATUSES = ["pending", "completed", "overdue"] as const;
export type HRReviewStatus = (typeof HR_REVIEW_STATUSES)[number];

export const HR_PIP_STATUSES = ["active", "improving", "completed", "failed"] as const;
export type HRPipStatus = (typeof HR_PIP_STATUSES)[number];

export const HR_TRAINING_STATUSES = ["assigned", "in_progress", "completed"] as const;
export type HRTrainingStatus = (typeof HR_TRAINING_STATUSES)[number];

export const HR_EXIT_TYPES = ["voluntary", "involuntary"] as const;
export type HRExitType = (typeof HR_EXIT_TYPES)[number];

export const HR_WORK_MODES = ["onsite", "hybrid", "remote"] as const;
export type HRWorkMode = (typeof HR_WORK_MODES)[number];

export type HREmployee = {
  id: number;
  employee_code: string;
  full_name: string;
  work_email: string | null;
  department: HRDepartment;
  contract_type: HRContractType;
  work_mode: HRWorkMode;
  employment_status: HREmploymentStatus;
  manager_employee_id: number | null;
  hire_date: string;
  probation_end_date: string | null;
  contract_end_date: string | null;
  exit_date: string | null;
  exit_type: HRExitType | null;
  created_at: string;
  updated_at: string;
};

export type HRRecruitmentRole = {
  id: number;
  title: string;
  department: HRDepartment;
  hiring_stage: string;
  vacancies: number;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
};

export type HRRecruitmentApplicant = {
  id: number;
  role_id: number;
  full_name: string;
  email: string | null;
  employment_track: "intern" | "full_time";
  current_stage: HRRecruitmentStage;
  applied_at: string;
  offered_at: string | null;
  hired_at: string | null;
  offer_status: "pending" | "accepted" | "rejected" | null;
  created_at: string;
};

export type HRDisciplinaryCase = {
  id: number;
  employee_id: number | null;
  category: string;
  status: HRDisciplinaryStatus;
  summary: string;
  opened_at: string;
  due_date: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type HRPolicyViolation = {
  id: number;
  employee_id: number | null;
  category: string;
  severity: "low" | "medium" | "high";
  notes: string | null;
  occurred_on: string;
  created_at: string;
};

export type HRFollowupAction = {
  id: number;
  employee_id: number | null;
  action_type: string;
  status: "pending" | "in_progress" | "done";
  due_date: string | null;
  notes: string | null;
  created_at: string;
};

export type HRPayrollCycle = {
  id: number;
  cycle_month: string;
  status: HRPayrollStatus;
  processed_at: string | null;
  notes: string | null;
  created_at: string;
};

export type HRPayrollAnomaly = {
  id: number;
  payroll_cycle_id: number;
  employee_id: number | null;
  anomaly_type: string;
  status: "open" | "resolved";
  details: string | null;
  created_at: string;
};

export type HRLeaveBalance = {
  id: number;
  employee_id: number;
  annual_days: number;
  used_days: number;
  carry_days: number;
  updated_at: string;
};

export type HRLeaveRequest = {
  id: number;
  employee_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: HRLeaveRequestStatus;
  requested_at: string;
  reviewed_at: string | null;
};

export type HRPerformanceReview = {
  id: number;
  employee_id: number;
  review_period: string;
  due_date: string;
  completed_at: string | null;
  status: HRReviewStatus;
  reviewer_employee_id: number | null;
  notes: string | null;
  created_at: string;
};

export type HRPip = {
  id: number;
  employee_id: number;
  status: HRPipStatus;
  start_date: string;
  end_date: string | null;
  progress_note: string | null;
  last_updated: string;
};

export type HRKpiScore = {
  id: number;
  employee_id: number;
  metric_name: string;
  score: number;
  period_start: string;
  period_end: string;
  created_at: string;
};

export type HRTrainingModule = {
  id: number;
  code: string;
  title: string;
  category: string;
  duration_hours: number;
  active: boolean;
  created_at: string;
};

export type HRTrainingAssignment = {
  id: number;
  employee_id: number;
  module_id: number;
  status: HRTrainingStatus;
  assigned_at: string;
  completed_at: string | null;
};

export type HROnboardingChecklist = {
  id: number;
  employee_id: number;
  item_name: string;
  status: "pending" | "completed";
  due_date: string | null;
  completed_at: string | null;
};

export type HRDashboardSummary = {
  recruitment: {
    open_roles: number;
    avg_days_open: number;
    funnel: Record<HRRecruitmentStage, number>;
    time_to_hire_days: number;
    offer_acceptance_rate: number;
    intern_hires: number;
    full_time_hires: number;
  };
  headcount: {
    total_active: number;
    by_department: Record<HRDepartment, number>;
    new_hires_month: number;
    new_hires_quarter: number;
    attrition_rate: number;
    exits_voluntary: number;
    exits_involuntary: number;
    contract_split: Record<HRContractType, number>;
  };
  compliance: {
    open_cases: number;
    by_status: Record<HRDisciplinaryStatus, number>;
    policy_violations: Record<string, number>;
    pending_followups: number;
    contract_renewals_due: number;
  };
  payroll_leave: {
    payroll_by_status: Record<HRPayrollStatus, number>;
    leave_pending_approval: number;
    anomalies_open: number;
  };
  performance: {
    upcoming_reviews: number;
    review_completion_rate: number;
    active_pips: number;
    direct_report_kpi_points: number;
  };
  training: {
    onboarding_completion_rate: number;
    modules_assigned: number;
    modules_completed: number;
    cs_curriculum_completion_rate: number;
  };
  alerts: Array<{
    id: string;
    type: string;
    label: string;
    due_on: string | null;
    severity: "low" | "medium" | "high";
  }>;
};
