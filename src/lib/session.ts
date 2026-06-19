import type { Session } from "next-auth";

import { getAuthSessionVersion } from "@/lib/auth-users";

export function isValidAdminSession(session: Session | null): boolean {
  if (!session?.user || session.user.role !== "admin") {
    return false;
  }

  const requiredVersion = getAuthSessionVersion();
  const tokenVersion =
    typeof session.sessionVersion === "string" ? session.sessionVersion : "";

  return tokenVersion === requiredVersion;
}
