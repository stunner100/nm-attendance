import { NextResponse } from "next/server";

import { listActiveHrEmployeesForCheckin } from "@/lib/db";

export async function GET() {
  try {
    const employees = await listActiveHrEmployeesForCheckin();
    return NextResponse.json({ employees });
  } catch (error) {
    console.error("Failed to load check-in employees", error);
    return NextResponse.json(
      { error: "Failed to load employee list." },
      { status: 500 }
    );
  }
}
