import { NextResponse } from "next/server";

import { issueCheckinScanToken } from "@/lib/db";

export async function GET() {
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
