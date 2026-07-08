import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import { createHrEveProxyToken } from "@/lib/eve-proxy-auth";

export async function GET() {
  const { session, response } = await requireAdminApi();
  if (response) {
    return response;
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = await createHrEveProxyToken(session);
    return new Response(token, {
      headers: {
        "cache-control": "no-store",
        "content-type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create Eve access token.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
