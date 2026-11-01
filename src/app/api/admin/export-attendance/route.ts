import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { tablesToCsv } from "@/lib/admin-backup";
import { parseAttendanceMonth } from "@/lib/attendance-month";
import { getAllAttendance } from "@/lib/db";
import { isValidAdminSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isValidAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "json";
  const date = url.searchParams.get("date")?.trim() || undefined;
  const monthParam = url.searchParams.get("month")?.trim() || undefined;

  // `month=YYYY-MM` exports the full month: 1st through last day, inclusive.
  // It takes precedence over the single-day `date` filter.
  const monthRange = monthParam ? parseAttendanceMonth(monthParam) : null;
  if (monthParam && !monthRange) {
    return NextResponse.json(
      { error: "month must use format YYYY-MM" },
      { status: 400 }
    );
  }

  try {
    const records = monthRange
      ? await getAllAttendance({
          dateFrom: monthRange.startDate,
          dateTo: monthRange.endDate,
        })
      : await getAllAttendance({ date });

    await logAdminAction({
      action: "export_attendance",
      actorEmail: session.user.email,
      details: {
        format,
        date: date ?? null,
        month: monthRange?.month ?? null,
        dateFrom: monthRange?.startDate ?? null,
        dateTo: monthRange?.endDate ?? null,
        count: records.length,
      },
    });

    if (format === "csv") {
      const rows = records.map((record) => ({
        id: record.id,
        name: record.name,
        timestamp: record.timestamp,
        checkout_timestamp: record.checkout_timestamp,
        latitude: record.latitude,
        longitude: record.longitude,
        checkout_latitude: record.checkout_latitude,
        checkout_longitude: record.checkout_longitude,
        location: record.location,
        checkout_location: record.checkout_location,
        created_at: record.created_at,
      }));

      const filename = monthRange
        ? `attendance-${monthRange.month}.csv`
        : `attendance-export-${new Date().toISOString().split("T")[0]}.csv`;

      return new Response(tablesToCsv({ attendance: rows }), {
        headers: {
          "Content-Type": "text/csv;charset=utf-8;",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      records,
      ...(monthRange
        ? {
            month: monthRange.month,
            dateFrom: monthRange.startDate,
            dateTo: monthRange.endDate,
          }
        : {}),
    });
  } catch (error) {
    console.error("Failed to export attendance", error);
    return NextResponse.json(
      { error: "Failed to export attendance." },
      { status: 500 }
    );
  }
}
