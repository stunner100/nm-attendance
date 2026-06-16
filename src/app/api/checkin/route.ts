import { NextResponse } from "next/server";

import { getPunctualityMessage } from "@/lib/attendance-punctuality";
import { CheckinRejectedError, insertAttendance } from "@/lib/db";
import { asLatitude, asLongitude } from "@/lib/geo-coords";

type CheckinPayload = {
  name?: unknown;
  scanToken?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  location?: unknown;
};

export async function POST(request: Request) {
  let payload: CheckinPayload;

  try {
    payload = (await request.json()) as CheckinPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const scanToken =
    typeof payload.scanToken === "string" ? payload.scanToken.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  if (!scanToken) {
    return NextResponse.json(
      { error: "Please scan the QR code again before submitting." },
      { status: 400 }
    );
  }

  if (name.length > 120) {
    return NextResponse.json(
      { error: "Name must be 120 characters or fewer." },
      { status: 400 }
    );
  }

  const latitude = asLatitude(payload.latitude);
  const longitude = asLongitude(payload.longitude);
  if (latitude === null || longitude === null) {
    return NextResponse.json(
      { error: "Location is required for check-in. Please allow GPS access and try again." },
      { status: 400 }
    );
  }
  const location =
    typeof payload.location === "string" ? payload.location.trim().slice(0, 200) : null;
  const timestamp = new Date().toISOString();
  const punctualityMessage = getPunctualityMessage(timestamp);

  try {
    await insertAttendance({
      name,
      scanToken,
      timestamp,
      latitude,
      longitude,
      location: location || null,
    });
  } catch (error) {
    if (
      error instanceof CheckinRejectedError ||
      (error instanceof Error && error.name === "CheckinRejectedError")
    ) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Failed to insert attendance record", error);
    return NextResponse.json(
      { error: "Failed to save attendance. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, timestamp, punctualityMessage });
}
