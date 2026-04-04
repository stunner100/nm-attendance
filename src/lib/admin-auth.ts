import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

import { auth } from "@/auth";

export async function requireAdminPage(callbackUrl: string): Promise<Session> {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return session;
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

  if (session.user?.role !== "admin") {
    return {
      session,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, response: null };
}
