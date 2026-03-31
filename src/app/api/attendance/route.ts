import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getAllAttendance } from "@/lib/db";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date")?.trim();

  if (dateParam && !DATE_REGEX.test(dateParam)) {
    return NextResponse.json(
      { error: "date must use format YYYY-MM-DD" },
      { status: 400 }
    );
  }

  try {
    const records = await getAllAttendance(dateParam || undefined);
    return NextResponse.json({ records });
  } catch (error) {
    console.error("Failed to load attendance records", error);
    return NextResponse.json(
      { error: "Failed to load attendance records." },
      { status: 500 }
    );
  }
}
