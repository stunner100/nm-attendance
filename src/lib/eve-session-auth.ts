import { getToken } from "next-auth/jwt";
import {
  ForbiddenError,
  localDev,
  vercelOidc,
  type AuthFn,
} from "eve/channels/auth";

import { getAuthSessionVersion } from "@/lib/auth-users";

export function adminSessionAuth(): AuthFn<Request> {
  return async (request) => {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    });

    if (!token) {
      return null;
    }

    const role = typeof token.role === "string" ? token.role : "";
    if (role !== "admin") {
      throw new ForbiddenError({ message: "Admin access required." });
    }

    const sessionVersion =
      typeof token.sessionVersion === "string" ? token.sessionVersion : "";
    if (sessionVersion !== getAuthSessionVersion()) {
      return null;
    }

    const principalId =
      (typeof token.sub === "string" && token.sub) ||
      (typeof token.email === "string" && token.email) ||
      "unknown-admin";

    const attributes: Record<string, string> = { role };
    if (typeof token.email === "string") {
      attributes.email = token.email;
    }
    if (typeof token.employeeId === "string") {
      attributes.employeeId = token.employeeId;
    }

    return {
      authenticator: "nextauth",
      principalId,
      principalType: "user" as const,
      attributes,
    };
  };
}

export const hrAdminEveAuth = [adminSessionAuth(), vercelOidc(), localDev()];
