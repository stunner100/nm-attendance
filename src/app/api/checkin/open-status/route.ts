import { NextResponse } from "next/server";

import { CheckinRejectedError, getEmployeeCheckinStatus } from "@/lib/db";

function parseEmployeeId(value: string | null): number | null {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = parseEmployeeId(searchParams.get("employeeId"));

  if (!employeeId) {
    return NextResponse.json({ error: "Please select a valid employee." }, { status: 400 });
  }

  try {
    const status = await getEmployeeCheckinStatus(employeeId);
    return NextResponse.json({
      hasOpenCheckin: status.hasOpenCheckin,
      hasAttendanceToday: status.hasAttendanceToday,
    });
  } catch (error) {
    if (
      error instanceof CheckinRejectedError ||
      (error instanceof Error && error.name === "CheckinRejectedError")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Failed to check open check-in status", error);
    return NextResponse.json(
      { error: "Unable to verify check-in status. You can still try checking out." },
      { status: 500 }
    );
  }
}
