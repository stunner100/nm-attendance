import { NextResponse } from "next/server";

import { isValidResetRequestEmail, processPasswordResetRequest } from "@/lib/password-reset";

const GENERIC_SUCCESS_MESSAGE =
  "If an account exists for that email, your request has been received. An administrator will follow up shortly.";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const email = typeof record.email === "string" ? record.email.trim().toLowerCase() : "";

  if (!isValidResetRequestEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    await processPasswordResetRequest(email);
  } catch (error) {
    console.error("Password reset request failed:", error);
  }

  return NextResponse.json({
    ok: true,
    message: GENERIC_SUCCESS_MESSAGE,
  });
}
