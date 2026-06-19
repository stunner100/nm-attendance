import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { isValidAdminSession } from "@/lib/session";

export async function requireAdminPage(callbackUrl: string): Promise<Session> {
  const session = await auth();
  if (!isValidAdminSession(session)) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return session as Session;
}

export async function requireAdminApi():
  Promise<{ session: Session | null; response: NextResponse | null }> {
  const session = await auth();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isValidAdminSession(session)) {
    return {
      session,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, response: null };
}
