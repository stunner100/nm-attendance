import { redirect } from "next/navigation";

export function redirectWithFormError(path: string, message: string): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}error=${encodeURIComponent(message)}`);
}

export function readFormError(
  searchParams: Record<string, string | string[] | undefined>
): string | null {
  const raw = searchParams.error;
  if (typeof raw === "string" && raw.trim()) {
    return raw.trim();
  }
  return null;
}

export function redirectWithFormSuccess(path: string, message: string): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}success=${encodeURIComponent(message)}`);
}

export function readFormSuccess(
  searchParams: Record<string, string | string[] | undefined>
): string | null {
  const raw = searchParams.success;
  if (typeof raw === "string" && raw.trim()) {
    return raw.trim();
  }
  return null;
}

export function readFormRecordId(formData: FormData, fieldName: string): number | null {
  const id = Number(String(formData.get(fieldName) ?? ""));
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  return id;
}

export function readPayrollLeaveFilters(formData: FormData): {
  cycleStatus: string;
  leaveStatus: string;
} {
  return {
    cycleStatus: String(formData.get("cycleStatus") ?? "").trim(),
    leaveStatus: String(formData.get("leaveStatus") ?? "").trim(),
  };
}

export function buildPayrollLeavePath(options: {
  cycleStatus?: string;
  leaveStatus?: string;
  error?: string;
  success?: string;
} = {}): string {
  const params = new URLSearchParams();
  const cycleStatus = options.cycleStatus?.trim();
  const leaveStatus = options.leaveStatus?.trim();

  if (cycleStatus) {
    params.set("cycleStatus", cycleStatus);
  }
  if (leaveStatus) {
    params.set("leaveStatus", leaveStatus);
  }
  if (options.error?.trim()) {
    params.set("error", options.error.trim());
  }
  if (options.success?.trim()) {
    params.set("success", options.success.trim());
  }

  const query = params.toString();
  return query ? `/admin/payroll-leave?${query}` : "/admin/payroll-leave";
}
