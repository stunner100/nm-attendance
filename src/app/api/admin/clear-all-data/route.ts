import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { logAdminAction } from "@/lib/admin-audit";
import {
  DATA_WIPE_CONFIRM_PHRASE,
  deleteOperationalData,
  isDataWipeAllowed,
} from "@/lib/admin-backup";

type ClearPayload = {
  confirmPhrase?: unknown;
};

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isDataWipeAllowed()) {
    return NextResponse.json(
      { error: "Data wipe is disabled in production. Set ALLOW_DATA_WIPE=true to enable." },
      { status: 403 }
    );
  }

  let payload: ClearPayload = {};
  try {
    payload = (await request.json()) as ClearPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const confirmPhrase =
    typeof payload.confirmPhrase === "string" ? payload.confirmPhrase.trim() : "";

  if (confirmPhrase !== DATA_WIPE_CONFIRM_PHRASE) {
    return NextResponse.json(
      {
        error: `Confirmation phrase must be exactly "${DATA_WIPE_CONFIRM_PHRASE}".`,
      },
      { status: 400 }
    );
  }

  try {
    const deleted = await deleteOperationalData();
    await logAdminAction({
      action: "clear_all_data",
      actorEmail: session.user.email,
      details: { deleted },
    });
    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    console.error("Failed to clear all data", error);
    return NextResponse.json(
      { error: "Failed to clear all data." },
      { status: 500 }
    );
  }
}
