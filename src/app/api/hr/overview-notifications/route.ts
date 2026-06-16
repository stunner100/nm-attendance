import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import { getOverviewBundle } from "@/lib/hr/overview";
import { normalizePeriod } from "@/lib/hr/framework-reference";

export async function GET(request: Request) {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  const url = new URL(request.url);
  const period = normalizePeriod(url.searchParams.get("period"));
  const bundle = await getOverviewBundle(period);

  return NextResponse.json({ count: bundle.notification_count });
}
