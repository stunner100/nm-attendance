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
