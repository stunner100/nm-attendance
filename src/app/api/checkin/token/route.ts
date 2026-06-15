import { NextResponse } from "next/server";

import { issueCheckinScanToken } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";

const TOKEN_RATE_LIMIT = 30;
const TOKEN_WINDOW_MS = 60_000;

export async function GET(request: Request) {
  const limited = enforceRateLimit(
    request,
    "checkin-token",
    TOKEN_RATE_LIMIT,
    TOKEN_WINDOW_MS
  );
  if (limited) {
    return limited;
  }

  try {
    const scanToken = await issueCheckinScanToken();
    return NextResponse.json({ scanToken });
  } catch (error) {
    console.error("Failed to issue check-in scan token", error);
    return NextResponse.json(
      { error: "Failed to prepare check-in. Please refresh and try again." },
      { status: 500 }
    );
  }
}
