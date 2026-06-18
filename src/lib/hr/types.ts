import type {
  HRAccountabilityStage,
  HRAccountabilityStatus,
  HRContractType,
  HRDepartment,
  HRDisciplinaryStatus,
  HREmploymentStatus,
  HRExitType,
  HRGrowthPlanStatus,
  HRKpiCardStatus,
  HRLeaveRequestStatus,
  HRPayrollStatus,
  HRPipStatus,
  HRPresentationStatus,
  HRPresenterType,
  HRRecruitmentStage,
  HRRewardTier,
  HRRoadmapHealth,
  HRTaskStatus,
  HRTrainingStatus,
  HRWorkMode,
} from "@/lib/types";

export type CreateHREmployeeInput = {
  employeeCode?: string | null;
  fullName: string;
  workEmail?: string | null;
  department: HRDepartment;
  contractType: HRContractType;
  workMode?: HRWorkMode;
  employmentStatus?: HREmploymentStatus;
  managerEmployeeId?: number | null;
  hireDate?: string | null;
  probationEndDate?: string | null;
  contractEndDate?: string | null;
  exitDate?: string | null;
  exitType?: HRExitType | null;
};

export type UpdateHREmployeeInput = {
  employeeCode?: string | null;
  fullName: string;
  workEmail?: string | null;
  department: HRDepartment;
  contractType: HRContractType;
  workMode: HRWorkMode;
  employmentStatus: HREmploymentStatus;
  managerEmployeeId?: number | null;
  hireDate?: string | null;
  contractEndDate?: string | null;
  exitDate?: string | null;
  exitType?: HRExitType | null;
};

export type CreateRecruitmentRoleInput = {
  title: string;
  department: HRDepartment;
  hiringStage?: string | null;
  vacancies?: number;
  openedAt?: string | null;
};

export type CreateRecruitmentApplicantInput = {
  roleId: number;
  fullName: string;
  email?: string | null;
  employmentTrack: "intern" | "full_time";
  currentStage?: HRRecruitmentStage;
  appliedAt?: string | null;
};

export type CreateDisciplinaryCaseInput = {
  employeeId?: number | null;
  category: string;
  status: HRDisciplinaryStatus;
  summary: string;
  openedAt?: string | null;
  dueDate?: string | null;
};

export type CreatePolicyViolationInput = {
  employeeId?: number | null;
  category: string;
  severity: "low" | "medium" | "high";
  notes?: string | null;
  occurredOn?: string | null;
};

export type CreateFollowupActionInput = {
  employeeId?: number | null;
  actionType: string;
  status?: "pending" | "in_progress" | "done";
  dueDate?: string | null;
  notes?: string | null;
};

export type CreatePayrollCycleInput = {
  cycleMonth: string;
  status?: HRPayrollStatus;
  processedAt?: string | null;
  notes?: string | null;
};

export type CreatePayrollAnomalyInput = {
  payrollCycleId: number;
  employeeId?: number | null;
  anomalyType: string;
  status?: "open" | "resolved";
  details?: string | null;
};

export type UpsertLeaveBalanceInput = {
  employeeId: number;
  annualDays: number;
  usedDays?: number;
  carryDays?: number;
};

export type CreateLeaveRequestInput = {
  employeeId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status?: HRLeaveRequestStatus;
};

export type CreatePerformanceReviewInput = {
  employeeId: number;
  reviewPeriod: string;
  dueDate: string;
  reviewerEmployeeId?: number | null;
  notes?: string | null;
};

export type CreatePipInput = {
  employeeId: number;
  status: HRPipStatus;
  startDate: string;
  endDate?: string | null;
  progressNote?: string | null;
};

export type CreateKpiScoreInput = {
  employeeId: number;
  metricName: string;
  score: number;
  periodStart: string;
  periodEnd: string;
};

export type CreateTrainingModuleInput = {
  code: string;
  title: string;
  category: string;
  durationHours?: number;
};

export type CreateTrainingAssignmentInput = {
  employeeId: number;
  moduleId: number;
  status?: HRTrainingStatus;
  assignedAt?: string | null;
};

export type CreateOnboardingChecklistInput = {
  employeeId: number;
  itemName: string;
  status?: "pending" | "completed";
  dueDate?: string | null;
};

export type CreateKpiCardInput = {
  employeeId: number;
  period: string;
  roleTitle?: string | null;
  companyGoal?: string | null;
  companyGoalId?: number | null;
  departmentGoalId?: number | null;
  status?: HRKpiCardStatus;
};

export type CreateKpiCardItemInput = {
  cardId: number;
  kpiText: string;
  targetMeasure?: string | null;
  weight?: number;
};

export type CreateTaskInput = {
  employeeId: number;
  cardId?: number | null;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status?: HRTaskStatus;
  qualityNote?: string | null;
};

export type CreateMonthlyScoreInput = {
  employeeId: number;
  period: string;
  kpiScore: number;
  disciplineScore: number;
  attendanceScore: number;
  hygieneScore: number;
  extracurricularScore: number;
  notes?: string | null;
  scoredBy?: string | null;
};

export type CreatePresentationInput = {
  employeeId: number;
  period: string;
  presenterType: HRPresenterType;
  status?: HRPresentationStatus;
  achievements?: string | null;
  kpiResults?: string | null;
  tasksCompleted?: string | null;
  tasksDelayed?: string | null;
  challenges?: string | null;
  supportNeeded?: string | null;
  lessons?: string | null;
  nextPriorities?: string | null;
  roadmapHealth?: HRRoadmapHealth | null;
  keyWins?: string | null;
  blockers?: string | null;
  risks?: string | null;
  dependencies?: string | null;
  qaNotes?: string | null;
};

export type CreateRewardInput = {
  employeeId: number;
  tier: HRRewardTier;
  rewardType: string;
  description?: string | null;
  awardedOn?: string | null;
};

export type CreateAccountabilityActionInput = {
  employeeId: number;
  stage: HRAccountabilityStage;
  reason: string;
  issuedOn?: string | null;
  status?: HRAccountabilityStatus;
  notes?: string | null;
};

export type CreateGrowthPlanInput = {
  employeeId: number;
  currentRole?: string | null;
  currentResponsibilities?: string | null;
  requiredKpis?: string | null;
  skillsToImprove?: string | null;
  possibleNextRole?: string | null;
  promotionRequirements?: string | null;
  trainingNeeded?: string | null;
  reviewTimeline?: string | null;
  status?: HRGrowthPlanStatus;
  nextReviewDate?: string | null;
};
