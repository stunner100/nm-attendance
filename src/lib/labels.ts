const LABEL_MAP: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  intern: "Intern",
  contractor: "Contractor",
  warning_issued: "Warning Issued",
  resolved: "Resolved",
  escalated: "Escalated",
  issues_flagged: "Issues Flagged",
  pending: "Pending",
  processed: "Processed",
  approved: "Approved",
  rejected: "Rejected",
  in_progress: "In Progress",
  assigned: "Assigned",
  completed: "Completed",
  active: "Active",
  hired: "Hired",
  on_time: "On Time",
  failed: "Failed",
  late: "Late",
  terminated: "Terminated",
  voluntary: "Voluntary",
  involuntary: "Involuntary",
  open: "Open",
  done: "Done",
  screened: "Screened",
  interviewed: "Interviewed",
  applied: "Applied",
  offered: "Offered",
  withdrawn: "Withdrawn",
  hod: "HOD",
  pip: "PIP",
  mid_level: "Mid-Level",
  kpi: "KPI",
  on_track: "On Track",
  at_risk: "At Risk",
  delayed: "Delayed",
  below_expectation: "Below Expectation",
  poor: "Poor",
  long_term: "Long Term",
  scheduled: "Scheduled",
  submitted: "Submitted",
  reviewed: "Reviewed",
  archived: "Archived",
  draft: "Draft",
};

export function humanizeLabel(value: string): string {
  if (LABEL_MAP[value] !== undefined) {
    return LABEL_MAP[value];
  }
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function labelValue(value: string, label: string): string {
  if (LABEL_MAP[value] !== undefined) {
    return LABEL_MAP[value];
  }
  return label;
}
