import { NextResponse } from "next/server";

import { suggestEmployeeNames } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";

const SUGGEST_RATE_LIMIT = 60;
const SUGGEST_WINDOW_MS = 60_000;

export async function GET(request: Request) {
  const limited = enforceRateLimit(
    request,
    "checkin-suggest",
    SUGGEST_RATE_LIMIT,
    SUGGEST_WINDOW_MS
  );
  if (limited) {
    return limited;
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ names: [] });
  }

  try {
    const names = await suggestEmployeeNames(query);
    return NextResponse.json({ names });
  } catch (error) {
    console.error("Failed to suggest employee names", error);
    return NextResponse.json(
      { error: "Failed to load name suggestions." },
      { status: 500 }
    );
  }
}
