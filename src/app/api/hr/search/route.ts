import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import { searchHRRecords } from "@/lib/hr/search";

export async function GET(request: Request) {
  const { response } = await requireAdminApi();
  if (response) {
    return response;
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchHRRecords(query, 8);
  return NextResponse.json({ results });
}
