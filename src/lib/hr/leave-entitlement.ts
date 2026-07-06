import type { HRDepartment } from "@/lib/types";

/** Annual leave tiers by completed years of service (after first year). */
export const LEAVE_ENTITLEMENT_TIERS = [
  { minYears: 0, maxYears: 1, annualDays: 15, label: "Under 1 year (pro-rated)" },
  { minYears: 1, maxYears: 2, annualDays: 18, label: "1–2 years" },
  { minYears: 2, maxYears: 5, annualDays: 21, label: "2–5 years" },
  { minYears: 5, maxYears: null, annualDays: 24, label: "5+ years" },
] as const;

export type TenureParts = {
  years: number;
  months: number;
  totalMonths: number;
};

export function getTenureFromHireDate(
  hireDate: string,
  asOf: Date = new Date()
): TenureParts | null {
  const hire = new Date(`${hireDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(hire.getTime())) {
    return null;
  }

  const asOfUtc = new Date(
    Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate())
  );
  if (asOfUtc < hire) {
    return { years: 0, months: 0, totalMonths: 0 };
  }

  let years = asOfUtc.getUTCFullYear() - hire.getUTCFullYear();
  let months = asOfUtc.getUTCMonth() - hire.getUTCMonth();
  const days = asOfUtc.getUTCDate() - hire.getUTCDate();

  if (days < 0) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = years * 12 + months;
  return { years, months, totalMonths };
}

export function formatTenureLabel(tenure: TenureParts | null): string {
  if (!tenure) {
    return "—";
  }
  if (tenure.totalMonths <= 0) {
    return "New hire";
  }
  if (tenure.years === 0) {
    return tenure.months === 1 ? "1 month" : `${tenure.months} months`;
  }
  if (tenure.months === 0) {
    return tenure.years === 1 ? "1 year" : `${tenure.years} years`;
  }
  const yearLabel = tenure.years === 1 ? "1 year" : `${tenure.years} years`;
  const monthLabel = tenure.months === 1 ? "1 month" : `${tenure.months} months`;
  return `${yearLabel}, ${monthLabel}`;
}

export function calculateAnnualLeaveEntitlement(
  hireDate: string,
  asOf: Date = new Date()
): number {
  const tenure = getTenureFromHireDate(hireDate, asOf);
  if (!tenure) {
    return 0;
  }

  if (tenure.totalMonths < 12) {
    const proRated = (15 * tenure.totalMonths) / 12;
    return Math.round(proRated * 4) / 4;
  }

  const completedYears = Math.floor(tenure.totalMonths / 12);
  if (completedYears < 2) {
    return 18;
  }
  if (completedYears < 5) {
    return 21;
  }
  return 24;
}

export function getEntitlementTierLabel(
  hireDate: string,
  asOf: Date = new Date()
): string {
  const tenure = getTenureFromHireDate(hireDate, asOf);
  if (!tenure) {
    return "Unknown";
  }
  if (tenure.totalMonths < 12) {
    return LEAVE_ENTITLEMENT_TIERS[0].label;
  }
  const completedYears = Math.floor(tenure.totalMonths / 12);
  if (completedYears < 2) {
    return LEAVE_ENTITLEMENT_TIERS[1].label;
  }
  if (completedYears < 5) {
    return LEAVE_ENTITLEMENT_TIERS[2].label;
  }
  return LEAVE_ENTITLEMENT_TIERS[3].label;
}

export function calculateLeaveRemaining(input: {
  annualDays: number;
  carryDays: number;
  usedDays: number;
}): number {
  return Math.round((input.annualDays + input.carryDays - input.usedDays) * 100) / 100;
}

export type HREmployeeLeaveOverview = {
  employee_id: number;
  full_name: string;
  department: HRDepartment;
  hire_date: string;
  balance_id: number | null;
  annual_days: number;
  carry_days: number;
  stored_used_days: number;
  approved_used_ytd: number;
  tenure_label: string;
  entitlement_tier: string;
  recommended_annual_days: number;
  remaining_days: number;
  is_allocated: boolean;
  allocation_matches_tenure: boolean;
};

export function buildEmployeeLeaveOverviewRow(input: {
  employee_id: number;
  full_name: string;
  department: HRDepartment;
  hire_date: string;
  balance_id: number | null;
  annual_days: number;
  carry_days: number;
  stored_used_days: number;
  approved_used_ytd: number;
  asOf?: Date;
}): HREmployeeLeaveOverview {
  const recommended = calculateAnnualLeaveEntitlement(input.hire_date, input.asOf);
  const tier = getEntitlementTierLabel(input.hire_date, input.asOf);
  const tenure = getTenureFromHireDate(input.hire_date, input.asOf);
  const usedDays = input.approved_used_ytd;
  const isAllocated = input.balance_id !== null;
  const annualForRemaining = isAllocated ? input.annual_days : recommended;
  const remaining = calculateLeaveRemaining({
    annualDays: annualForRemaining,
    carryDays: input.carry_days,
    usedDays,
  });
  const allocationMatches =
    isAllocated && Math.abs(input.annual_days - recommended) < 0.01;

  return {
    employee_id: input.employee_id,
    full_name: input.full_name,
    department: input.department,
    hire_date: input.hire_date,
    balance_id: input.balance_id,
    annual_days: input.annual_days,
    carry_days: input.carry_days,
    stored_used_days: input.stored_used_days,
    approved_used_ytd: input.approved_used_ytd,
    tenure_label: formatTenureLabel(tenure),
    entitlement_tier: tier,
    recommended_annual_days: recommended,
    remaining_days: remaining,
    is_allocated: isAllocated,
    allocation_matches_tenure: allocationMatches,
  };
}
