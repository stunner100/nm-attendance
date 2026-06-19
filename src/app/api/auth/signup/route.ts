import { NextResponse } from "next/server";

import { createSignupUser, isSignupOpen } from "@/lib/auth-users";
import { HR_JOB_LEVELS, type HRJobLevel } from "@/lib/types";

export async function POST(request: Request) {
  if (!isSignupOpen()) {
    return NextResponse.json({ error: "Sign-up is closed." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const email = typeof record.email === "string" ? record.email : "";
  const password = typeof record.password === "string" ? record.password : "";
  const employeeId = Number(record.employeeId);
  const jobLevel = typeof record.jobLevel === "string" ? record.jobLevel : "";

  if (!HR_JOB_LEVELS.includes(jobLevel as HRJobLevel)) {
    return NextResponse.json({ error: "Select a valid job level." }, { status: 400 });
  }

  try {
    const user = await createSignupUser({
      email,
      password,
      employeeId,
      jobLevel: jobLevel as HRJobLevel,
    });

    return NextResponse.json({
      ok: true,
      email: user.email,
      employeeName: user.employeeName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
