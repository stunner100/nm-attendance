export type GpsStatus = "idle" | "loading" | "granted" | "denied";

export type AttendanceRow = {
  id: number;
  name: string;
  timestamp: string;
  checkout_timestamp: string | null;
  latitude: number | null;
  longitude: number | null;
  checkout_latitude: number | null;
  checkout_longitude: number | null;
  location: string | null;
  checkout_location: string | null;
  created_at: string;
};

export const HR_DEPARTMENTS = [
  "Operations",
  "Product",
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

export const HR_JOB_LEVELS = [
  "associate",
  "mid_level",
  "manager",
  "hod",
] as const;
export type HRJobLevel = (typeof HR_JOB_LEVELS)[number];

export const HR_GOAL_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type HRGoalPriority = (typeof HR_GOAL_PRIORITIES)[number];

export const HR_GOAL_STATUSES = [
  "draft",
  "active",
  "completed",
  "delayed",
  "cancelled",
] as const;
export type HRGoalStatus = (typeof HR_GOAL_STATUSES)[number];

export const HR_KPI_CARD_STATUSES = [
  "draft",
  "submitted",
  "hr_reviewed",
  "approved",
  "active",
  "closed",
  "locked",
] as const;
export type HRKpiCardStatus = (typeof HR_KPI_CARD_STATUSES)[number];

export const HR_TASK_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
  "delayed",
  "missed",
  "blocked",
] as const;
export type HRTaskStatus = (typeof HR_TASK_STATUSES)[number];

export const HR_TASK_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type HRTaskPriority = (typeof HR_TASK_PRIORITIES)[number];

export const HR_MANAGER_VERIFICATION = ["pending", "verified", "rejected"] as const;
export type HRManagerVerification = (typeof HR_MANAGER_VERIFICATION)[number];

export const HR_SCORE_APPROVAL_STATUSES = [
  "draft",
  "submitted",
  "hr_reviewed",
  "approved",
  "locked",
] as const;
export type HRScoreApprovalStatus = (typeof HR_SCORE_APPROVAL_STATUSES)[number];

export const HR_REWARD_STATUSES = [
  "recommended",
  "pending_approval",
  "approved",
  "paid",
  "rejected",
  "locked",
] as const;
export type HRRewardStatus = (typeof HR_REWARD_STATUSES)[number];

export const HR_ACCOUNTABILITY_ISSUE_TYPES = [
  "missed_kpi",
  "missed_task",
  "poor_communication",
  "misconduct",
  "false_reporting",
  "attendance_issue",
  "other",
] as const;
export type HRAccountabilityIssueType = (typeof HR_ACCOUNTABILITY_ISSUE_TYPES)[number];

export const HR_GROWTH_STATUSES = [
  "on_track",
  "at_risk",
  "not_ready",
  "ready_for_next_role",
] as const;
export type HRGrowthStatus = (typeof HR_GROWTH_STATUSES)[number];

export const HR_RATING_BANDS = [
  "excellent",
  "strong",
  "acceptable",
  "below_expectation",
  "poor",
] as const;
export type HRRatingBand = (typeof HR_RATING_BANDS)[number];

export const HR_PRESENTER_TYPES = [
  "associate",
  "mid_level",
  "manager",
  "hod",
] as const;
export type HRPresenterType = (typeof HR_PRESENTER_TYPES)[number];

export const HR_PRESENTATION_STATUSES = [
  "scheduled",
  "submitted",
  "reviewed",
] as const;
export type HRPresentationStatus = (typeof HR_PRESENTATION_STATUSES)[number];

export const HR_ROADMAP_HEALTH = [
  "on_track",
  "at_risk",
  "delayed",
  "blocked",
  "completed",
] as const;
export type HRRoadmapHealth = (typeof HR_ROADMAP_HEALTH)[number];

export const HR_REWARD_TIERS = [
  "weekly",
  "monthly",
  "quarterly",
  "long_term",
] as const;
export type HRRewardTier = (typeof HR_REWARD_TIERS)[number];

export const HR_ACCOUNTABILITY_STAGES = [
  "coaching",
  "verbal_warning",
  "written_warning",
  "pip",
  "final_review",
  "reassignment",
  "termination",
  "investigation",
] as const;
export type HRAccountabilityStage = (typeof HR_ACCOUNTABILITY_STAGES)[number];

export const HR_ACCOUNTABILITY_STATUSES = [
  "open",
  "resolved",
  "escalated",
  "closed",
  "reversed",
] as const;
export type HRAccountabilityStatus = (typeof HR_ACCOUNTABILITY_STATUSES)[number];

export const HR_GROWTH_PLAN_STATUSES = [
  "active",
  "on_hold",
  "completed",
  "closed",
] as const;
export type HRGrowthPlanStatus = (typeof HR_GROWTH_PLAN_STATUSES)[number];

export const HR_AUDIT_ACTIONS = [
  "created",
  "edited",
  "submitted",
  "approved",
  "rejected",
  "locked",
  "reopened",
] as const;
export type HRAuditAction = (typeof HR_AUDIT_ACTIONS)[number];

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
  job_level: HRJobLevel | null;
  job_title: string | null;
  manager_notes: string | null;
  hr_notes: string | null;
  hire_date: string;
  probation_end_date: string | null;
  contract_end_date: string | null;
  exit_date: string | null;
  exit_type: HRExitType | null;
  created_at: string;
  updated_at: string;
};

export type HRCompanyGoal = {
  id: number;
  title: string;
  description: string | null;
  period: string;
  priority: HRGoalPriority;
  owner: string | null;
  status: HRGoalStatus;
  created_by: string | null;
  approved_by: string | null;
  date_created: string;
  date_approved: string | null;
  created_at: string;
  updated_at: string;
};

export type HRDepartmentGoal = {
  id: number;
  department: HRDepartment;
  company_goal_id: number | null;
  company_goal_title: string | null;
  title: string;
  description: string | null;
  period: string;
  owner: string | null;
  roadmap_health: HRRoadmapHealth;
  status_reason: string | null;
  key_blockers: string | null;
  next_priorities: string | null;
  status: HRGoalStatus;
  created_at: string;
  updated_at: string;
};

export type HRAuditLogEntry = {
  id: number;
  record_type: string;
  record_id: number;
  action: HRAuditAction;
  edited_by: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  reason: string | null;
  approved_by: string | null;
  created_at: string;
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

export type HRKpiCard = {
  id: number;
  employee_id: number;
  period: string;
  role_title: string | null;
  company_goal: string | null;
  status: HRKpiCardStatus;
  created_at: string;
  updated_at: string;
};

export type HRKpiCardItem = {
  id: number;
  card_id: number;
  kpi_text: string;
  target_measure: string | null;
  weight: number;
  created_at: string;
};

export type HRTask = {
  id: number;
  employee_id: number;
  card_id: number | null;
  title: string;
  description: string | null;
  due_date: string | null;
  status: HRTaskStatus;
  completed_at: string | null;
  quality_note: string | null;
  created_at: string;
};

export type HRMonthlyScore = {
  id: number;
  employee_id: number;
  period: string;
  kpi_score: number;
  /** Stored in `task_score` — discipline component */
  discipline_score: number;
  /** Stored in `comms_score` — attendance component */
  attendance_score: number;
  hygiene_score: number;
  extracurricular_score: number;
  total_score: number;
  rating: HRRatingBand;
  notes: string | null;
  scored_by: string | null;
  created_at: string;
};

export type HRPresentation = {
  id: number;
  employee_id: number;
  period: string;
  presenter_type: HRPresenterType;
  status: HRPresentationStatus;
  achievements: string | null;
  kpi_results: string | null;
  tasks_completed: string | null;
  tasks_delayed: string | null;
  challenges: string | null;
  support_needed: string | null;
  lessons: string | null;
  next_priorities: string | null;
  roadmap_health: HRRoadmapHealth | null;
  key_wins: string | null;
  blockers: string | null;
  risks: string | null;
  dependencies: string | null;
  qa_notes: string | null;
  submitted_at: string | null;
  created_at: string;
};

export type HRReward = {
  id: number;
  employee_id: number;
  tier: HRRewardTier;
  reward_type: string;
  description: string | null;
  awarded_on: string;
  created_at: string;
};

export type HRAccountabilityAction = {
  id: number;
  employee_id: number;
  stage: HRAccountabilityStage;
  reason: string;
  issued_on: string;
  status: HRAccountabilityStatus;
  notes: string | null;
  created_at: string;
};

export type HRGrowthPlan = {
  id: number;
  employee_id: number;
  current_role: string | null;
  current_responsibilities: string | null;
  required_kpis: string | null;
  skills_to_improve: string | null;
  possible_next_role: string | null;
  promotion_requirements: string | null;
  training_needed: string | null;
  review_timeline: string | null;
  status: HRGrowthPlanStatus;
  next_review_date: string | null;
  created_at: string;
  updated_at: string;
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
  framework: {
    period: string;
    scored_employees: number;
    avg_monthly_score: number;
    excellent_count: number;
    strong_count: number;
    acceptable_count: number;
    below_expectation_count: number;
    below_70_count: number;
    below_60_count: number;
    bonus_eligible_count: number;
    poor_count: number;
    rating_distribution: Record<HRRatingBand, number>;
    avg_score_by_department: Record<HRDepartment, number>;
    headcount_by_department: Record<HRDepartment, number>;
    reward_eligible_by_department: Record<HRDepartment, number>;
    accountability_by_department: Record<HRDepartment, number>;
    roadmap_health_by_department: Record<HRDepartment, HRRoadmapHealth | null>;
    active_kpi_cards: number;
    pending_kpi_approvals: number;
    pending_score_reviews: number;
    pending_reward_approvals: number;
    overdue_tasks: number;
    rewards_this_month: number;
    open_accountability: number;
    growth_reviews_due: number;
    roadmaps_at_risk: number;
    trends: {
      total_employees_delta: number;
      avg_score_delta: number;
      excellent_delta: number;
      strong_delta: number;
      below_70_delta: number;
      below_60_delta: number;
    };
  };
  performance_alerts: Array<{
    id: string;
    type: string;
    label: string;
    due_on: string | null;
    severity: "low" | "medium" | "high";
    href: string | null;
  }>;
  alerts: Array<{
    id: string;
    type: string;
    label: string;
    due_on: string | null;
    severity: "low" | "medium" | "high";
  }>;
};

export type AtRiskEmployee = {
  id: number;
  full_name: string;
  department: HRDepartment;
  job_title: string | null;
  latest_score: number;
  months_below_threshold: number;
  href: string;
};

export type ActivityItem = {
  id: string;
  label: string;
  actor: string | null;
  occurred_at: string;
  href: string | null;
};

export type OverviewBundle = {
  period: string;
  summary: HRDashboardSummary;
  at_risk_employees: AtRiskEmployee[];
  recent_activity: ActivityItem[];
  notification_count: number;
};
