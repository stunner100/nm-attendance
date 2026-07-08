import { getToken } from "next-auth/jwt";
import {
  ForbiddenError,
  localDev,
  vercelOidc,
  type AuthFn,
} from "eve/channels/auth";

import { getAuthSessionVersion, getAuthUserByEmail } from "@/lib/auth-users";

const SECURE_SESSION_COOKIE = "__Secure-authjs.session-token";
const SESSION_COOKIE = "authjs.session-token";

function usesSecureSessionCookie(): boolean {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

async function getAdminJwtFromRequest(request: Request) {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    return null;
  }

  const secureCookieCandidates = usesSecureSessionCookie()
    ? [true, false]
    : [false, true];

  for (const secureCookie of secureCookieCandidates) {
    const cookieName = secureCookie ? SECURE_SESSION_COOKIE : SESSION_COOKIE;
    const token = await getToken({
      req: request,
      secret,
      secureCookie,
      cookieName,
      salt: cookieName,
    });
    if (token) {
      return token;
    }
  }

  return null;
}

export function adminSessionAuth(): AuthFn<Request> {
  return async (request) => {
    const token = await getAdminJwtFromRequest(request);

    if (!token) {
      return null;
    }

    let role = typeof token.role === "string" ? token.role : "";
    const email =
      typeof token.email === "string" ? token.email.trim().toLowerCase() : "";

    if (role !== "admin" && email) {
      const user = await getAuthUserByEmail(email);
      if (user?.role === "admin") {
        role = "admin";
      }
    }

    if (role !== "admin") {
      throw new ForbiddenError({
        message: "Admin access required. Sign in with an HR admin account.",
      });
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
