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
