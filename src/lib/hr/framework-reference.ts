import type { HRDepartment, HRRatingBand } from "@/lib/types";

export const SCORE_WEIGHTS = {
  kpi: 75,
  discipline: 10,
  attendance: 10,
  hygiene: 2.5,
  extracurricular: 2.5,
} as const;

export const SCORE_DIMENSIONS = [
  { key: "kpi", label: "KPI", weight: SCORE_WEIGHTS.kpi },
  { key: "discipline", label: "Discipline", weight: SCORE_WEIGHTS.discipline },
  { key: "attendance", label: "Attendance", weight: SCORE_WEIGHTS.attendance },
  {
    key: "hygiene",
    label: "Personal hygiene & appearance",
    weight: SCORE_WEIGHTS.hygiene,
  },
  {
    key: "extracurricular",
    label: "Extra curricular activities",
    weight: SCORE_WEIGHTS.extracurricular,
  },
] as const;

export function formatMonthlyScoreFormula(): string {
  return SCORE_DIMENSIONS.map((d) => `${d.label} ${d.weight}%`).join(", ");
}

export const RATING_BANDS: Array<{
  band: HRRatingBand;
  label: string;
  min: number;
  max: number;
  tone: string;
}> = [
  { band: "excellent", label: "Excellent", min: 90, max: 100, tone: "emerald" },
  { band: "strong", label: "Strong", min: 80, max: 89, tone: "blue" },
  { band: "acceptable", label: "Acceptable", min: 70, max: 79, tone: "amber" },
  {
    band: "below_expectation",
    label: "Below Expectation",
    min: 60,
    max: 69,
    tone: "orange",
  },
  { band: "poor", label: "Poor", min: 0, max: 59, tone: "rose" },
];

export function computeRating(total: number): HRRatingBand {
  if (total >= 90) return "excellent";
  if (total >= 80) return "strong";
  if (total >= 70) return "acceptable";
  if (total >= 60) return "below_expectation";
  return "poor";
}

export const REVIEW_TIMELINE: Array<{ cadence: string; focus: string }> = [
  {
    cadence: "Weekly",
    focus: "Department heads check task progress, blockers, and urgent issues.",
  },
  { cadence: "Monthly", focus: "Employee KPI score and performance review." },
  {
    cadence: "Monthly",
    focus:
      "Associates and mid-level employees present achievements, KPI progress, tasks, challenges, and next steps, then field questions.",
  },
  {
    cadence: "Monthly",
    focus:
      "Managers and HODs present department overviews, roadmap health, progress, blockers, risks, and priorities.",
  },
  {
    cadence: "Quarterly",
    focus:
      "Reward, promotion, training, salary review consideration, or improvement decision.",
  },
  {
    cadence: "Every 6-12 months",
    focus: "Long-term employee growth plan review.",
  },
];

export const REWARD_TIERS: Array<{
  tier: string;
  label: string;
  items: string[];
}> = [
  {
    tier: "weekly",
    label: "Weekly Rewards",
    items: [
      "Public recognition",
      "Appreciation from management",
      "Small incentives where applicable",
      "Recognition for completing tasks on time or solving urgent issues",
    ],
  },
  {
    tier: "monthly",
    label: "Monthly Rewards",
    items: [
      "Performance bonus eligibility for employees scoring 80 and above",
      "Higher bonus or special recognition for employees scoring 90 and above",
      "Department-based incentives where applicable",
      "Recognition for strong monthly KPI presentations and clear ownership",
    ],
  },
  {
    tier: "quarterly",
    label: "Quarterly Rewards",
    items: [
      "Salary review consideration",
      "Promotion consideration",
      "Expanded responsibility",
      "Training support",
      "Leadership/project ownership",
    ],
  },
  {
    tier: "long_term",
    label: "Long-Term Rewards (6-12 months)",
    items: [
      "Promotion",
      "Title change",
      "Salary review",
      "Leadership role",
      "Specialized responsibility",
      "Training and development support",
    ],
  },
];

export const ACCOUNTABILITY_LADDER: Array<{ stage: string; label: string; note: string }> = [
  { stage: "coaching", label: "Coaching", note: "First-time minor issues." },
  { stage: "verbal_warning", label: "Verbal warning", note: "Repeated issues." },
  {
    stage: "written_warning",
    label: "Written warning",
    note: "Continued underperformance or serious task failure.",
  },
  {
    stage: "pip",
    label: "Performance Improvement Plan",
    note: "Structured 2-4 week plan.",
  },
  { stage: "final_review", label: "Final review", note: "No improvement after PIP." },
  {
    stage: "reassignment",
    label: "Reassignment / role change / demotion",
    note: "Where applicable.",
  },
  {
    stage: "termination",
    label: "Termination process",
    note: "If performance does not improve.",
  },
  {
    stage: "investigation",
    label: "Immediate investigation",
    note: "For serious misconduct.",
  },
];

export type DepartmentFramework = {
  focusAreas: string[];
  seriousIssues: string[];
};

export const DEPARTMENT_FRAMEWORK: Record<HRDepartment, DepartmentFramework> = {
  Operations: {
    focusAreas: [
      "Order monitoring",
      "Delivery performance",
      "Issue escalation",
      "Customer experience",
      "Vendor/rider/customer coordination",
      "Operational reporting",
      "No active order issue left unattended",
      "Order-related issues acted on or escalated within 10 minutes",
    ],
    seriousIssues: [
      "Leaving active orders unattended",
      "Failing to act on order issues within the agreed timeframe",
      "Not escalating delayed orders early",
      "Poor vendor, rider, and customer coordination",
      "Ignoring customer complaints or after-delivery feedback",
      "Failing to inform customers when an order will delay",
      "Allowing orders to exceed delivery targets without update or escalation",
      "Poor monitoring of vendor readiness before pickup",
      "Wrong order assignment or avoidable delivery confusion",
      "Failing to report vendor delays, missing items, or rider issues",
      "Fake order updates or false operational reports",
      "Collusion with vendors, riders, or customers against company interest",
      "Misuse of company funds, customer payments, or operational resources",
      "Sharing customer, vendor, rider, or company information without approval",
    ],
  },
  Product: {
    focusAreas: [
      "Product roadmap planning",
      "Product requirement documentation",
      "User feedback collection and analysis",
      "Feature prioritization",
      "Product testing and validation",
      "Coordination between operations, tech, marketing, and management",
      "Product launch readiness",
      "Product performance tracking",
      "Customer, vendor, rider, and internal staff experience improvement",
      "Clear communication of product changes and feature requirements",
    ],
    seriousIssues: [
      "Poorly defined product requirements that repeatedly cause confusion or rework",
      "Changing product scope without approval or proper communication",
      "Ignoring important user, customer, vendor, rider, or operations feedback",
      "Launching or approving features without proper testing or validation",
      "Failing to communicate product changes to tech, operations, marketing, or support",
      "Misrepresenting product progress or giving fake product updates",
      "Poor prioritization that delays important company goals",
      "Failing to document product decisions, requirements, or launch notes",
      "Sharing product roadmap, internal strategy, or user data without approval",
      "Making product decisions that seriously affect customer experience without review",
    ],
  },
  Marketing: {
    focusAreas: [
      "Campaign execution",
      "Content output",
      "Customer growth",
      "Brand visibility",
      "Promo performance",
      "Community marketing",
      "Campaign reporting",
    ],
    seriousIssues: [
      "Repeatedly missing campaign deadlines",
      "Posting unapproved brand content",
      "Misusing campaign budget",
      "Reporting fake campaign numbers",
      "Damaging the brand's reputation",
    ],
  },
  Tech: {
    focusAreas: [
      "Feature delivery",
      "Bug fixing",
      "Platform stability",
      "Code quality",
      "Documentation",
      "Automation/internal tools",
      "Security and data handling",
    ],
    seriousIssues: [
      "Repeatedly breaking production due to careless code",
      "Ignoring critical bugs",
      "Sharing company code or data without approval",
      "Misusing customer/vendor data",
      "Fake progress reports",
    ],
  },
  "Finance & Compliance": {
    focusAreas: [
      "Accurate financial records",
      "Budget control",
      "Payment reconciliation",
      "Cash control",
      "Monthly reporting",
      "Receipts, invoices, and approval documentation",
    ],
    seriousIssues: [
      "Unexplained money gaps",
      "Poor financial records",
      "Unauthorized spending",
      "Late payment records",
      "Fraud or false reporting",
    ],
  },
  "HR & Admin": {
    focusAreas: [
      "Recruitment",
      "Onboarding",
      "Attendance tracking",
      "Staff documentation",
      "Performance review coordination",
      "Staff welfare",
      "Fair policy enforcement",
    ],
    seriousIssues: [
      "Poor staff documentation",
      "Unfair treatment of employees",
      "Sharing confidential staff information",
      "Recruitment delays without proper updates",
      "Fake attendance or performance records",
    ],
  },
};

export function currentPeriod(date: Date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

const PERIOD_PATTERN = /^\d{4}-\d{2}$/;

export function normalizePeriod(value: string | undefined | null): string {
  const trimmed = value?.trim();
  if (trimmed && PERIOD_PATTERN.test(trimmed)) {
    return trimmed;
  }

  return currentPeriod();
}

export function previousPeriod(period: string): string {
  const [yearText, monthText] = normalizePeriod(period).split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return currentPeriod();
  }

  const date = new Date(Date.UTC(year, month - 1, 1));
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString().slice(0, 7);
}

export function formatPeriodLabel(period: string): string {
  const normalized = normalizePeriod(period);
  const [yearText, monthText] = normalized.split("-");
  const date = new Date(Date.UTC(Number(yearText), Number(monthText) - 1, 1));

  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

  return `${monthLabel} (${normalized})`;
}
