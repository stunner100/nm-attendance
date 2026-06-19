import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { exportAllTables, tablesToCsv } from "@/lib/admin-backup";
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

  try {
    const results = await exportAllTables();

    await logAdminAction({
      action: "export_all_data",
      actorEmail: session.user.email,
      details: { format },
    });

    if (format === "csv") {
      return new Response(tablesToCsv(results), {
        headers: {
          "Content-Type": "text/csv;charset=utf-8;",
          "Content-Disposition": `attachment; filename="abonten-technologies-backup-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to export data", error);
    return NextResponse.json(
      { error: "Failed to export data." },
      { status: 500 }
    );
  }
}
