import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import { getHRDashboardSummary } from "@/lib/hr-db";

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  try {
    const summary = await getHRDashboardSummary();
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Failed to load HR summary", error);
    return NextResponse.json(
      { error: "Failed to load HR summary." },
      { status: 500 }
    );
  }
}
