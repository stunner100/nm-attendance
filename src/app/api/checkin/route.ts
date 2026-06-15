import { NextResponse } from "next/server";

import { CheckinRejectedError, insertAttendance } from "@/lib/db";

type CheckinPayload = {
  name?: unknown;
  scanToken?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  location?: unknown;
};

const CHECKIN_TIMEZONE = process.env.CHECKIN_TIMEZONE || "Africa/Accra";

function asLatitude(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "number" || Number.isNaN(value) || value < -90 || value > 90) {
    return null;
  }

  return value;
}

function asLongitude(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (
    typeof value !== "number" ||
    Number.isNaN(value) ||
    value < -180 ||
    value > 180
  ) {
    return null;
  }

  return value;
}

function getPunctualityMessage(timestamp: string): string {
  const checkedAt = new Date(timestamp);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: CHECKIN_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(checkedAt);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  const isLate = hour * 60 + minute > 8 * 60;

  return isLate ? "You are late" : "You are on time";
}

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
