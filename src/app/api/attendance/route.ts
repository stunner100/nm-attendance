import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getAllAttendance, clearAttendance } from "@/lib/db";
import { isValidAdminSession } from "@/lib/session";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isValidAdminSession(session)) {
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

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isValidAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (body.action === "clear") {
      const deletedCount = await clearAttendance();
      return NextResponse.json({ ok: true, deletedCount });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to clear attendance records", error);
    return NextResponse.json(
      { error: "Failed to clear attendance records." },
      { status: 500 }
    );
  }
}
