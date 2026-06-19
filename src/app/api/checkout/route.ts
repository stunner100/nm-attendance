import { NextResponse } from "next/server";

import { CheckinRejectedError, checkoutAttendance } from "@/lib/db";
import { asLatitude, asLongitude } from "@/lib/geo-coords";

type CheckoutPayload = {
  employeeId?: unknown;
  scanToken?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  location?: unknown;
};

function parseEmployeeId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

export async function POST(request: Request) {
  let payload: CheckoutPayload;

  try {
    payload = (await request.json()) as CheckoutPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const employeeId = parseEmployeeId(payload.employeeId);
  const scanToken =
    typeof payload.scanToken === "string" ? payload.scanToken.trim() : "";

  if (!employeeId) {
    return NextResponse.json({ error: "Please select your name from the list." }, { status: 400 });
  }

  if (!scanToken) {
    return NextResponse.json(
      { error: "Please scan the QR code again before submitting." },
      { status: 400 }
    );
  }

  const latitude = asLatitude(payload.latitude);
  const longitude = asLongitude(payload.longitude);
  if (latitude === null || longitude === null) {
    return NextResponse.json(
      {
        error:
          "Location is required for check-out. Please allow GPS access and try again.",
      },
      { status: 400 }
    );
  }

  const timestamp = new Date().toISOString();
  const location =
    typeof payload.location === "string" ? payload.location.trim().slice(0, 200) : null;

  try {
    await checkoutAttendance({
      employeeId,
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

    console.error("Failed to record check-out", error);
    return NextResponse.json(
      { error: "Failed to save check-out. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    timestamp,
    statusMessage: "Check-out recorded",
  });
}
