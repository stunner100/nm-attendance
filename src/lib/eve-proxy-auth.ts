import { SignJWT } from "jose";
import type { Session } from "next-auth";

import {
  HR_EVE_PROXY_AUDIENCE,
  HR_EVE_PROXY_ISSUER,
} from "@/lib/eve-proxy-auth-config";

const HR_EVE_PROXY_TTL_SECONDS = 10 * 60;

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET is required for Eve proxy authentication.");
  }
  return secret;
}

export async function createHrEveProxyToken(session: Session): Promise<string> {
  const principalId = session.user?.id?.trim() || session.user?.email?.trim();
  if (!principalId) {
    throw new Error("Admin session is missing a principal id.");
  }

  const email = session.user?.email?.trim().toLowerCase() ?? "";
  const employeeId = session.user?.employeeId?.trim() ?? "";

  const payload: Record<string, string> = {
    role: "admin",
  };
  if (email) {
    payload.email = email;
  }
  if (employeeId) {
    payload.employeeId = employeeId;
  }

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(HR_EVE_PROXY_ISSUER)
    .setAudience(HR_EVE_PROXY_AUDIENCE)
    .setSubject(principalId)
    .setIssuedAt()
    .setExpirationTime(`${HR_EVE_PROXY_TTL_SECONDS}s`)
    .sign(new TextEncoder().encode(getAuthSecret()));
}
