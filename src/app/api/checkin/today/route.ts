import { NextResponse } from "next/server";

import { getTodaysPublicAttendance } from "@/lib/db";

export async function GET() {
  try {
    const records = await getTodaysPublicAttendance();
    return NextResponse.json({ records });
  } catch (error) {
    console.error("Failed to load today's attendance", error);
    return NextResponse.json(
      { error: "Unable to load today's attendance." },
      { status: 500 }
    );
  }
}
