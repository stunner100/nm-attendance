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
