import type {
  HRContractType,
  HRDepartment,
  HRDisciplinaryStatus,
  HREmploymentStatus,
  HRExitType,
  HRLeaveRequestStatus,
  HRPayrollStatus,
  HRPipStatus,
  HRRecruitmentStage,
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
