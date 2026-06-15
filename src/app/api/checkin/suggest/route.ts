import { NextResponse } from "next/server";

import { suggestEmployeeNames } from "@/lib/db";

export async function GET(request: Request) {
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
