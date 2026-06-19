import { NextResponse } from "next/server";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import {
  addEmployeeNames,
  getEmployeeNames,
  removeEmployeeName,
} from "@/lib/db";
import { isValidAdminSession } from "@/lib/session";
import { normalizeRosterNames, splitRosterNames } from "@/lib/roster";

type EmployeeMutationPayload = {
  name?: unknown;
  names?: unknown;
  text?: unknown;
};

function isAdminSession(session: Session | null): boolean {
  return isValidAdminSession(session);
}

function extractRosterNames(payload: EmployeeMutationPayload): string[] {
  if (typeof payload.text === "string") {
    return splitRosterNames(payload.text);
  }

  if (typeof payload.name === "string") {
    return splitRosterNames(payload.name);
  }

  if (typeof payload.names === "string") {
    return splitRosterNames(payload.names);
  }

  if (Array.isArray(payload.names)) {
    return normalizeRosterNames(
      payload.names.filter((value): value is string => typeof value === "string")
    );
  }

  return [];
}

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const names = await getEmployeeNames();
    return NextResponse.json({ names });
  } catch (error) {
    console.error("Failed to load employee names", error);
    return NextResponse.json(
      { error: "Failed to load employee names." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: EmployeeMutationPayload;

  try {
    payload = (await request.json()) as EmployeeMutationPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const names = extractRosterNames(payload);
  if (names.length === 0) {
    return NextResponse.json(
      { error: "Provide at least one roster name." },
      { status: 400 }
    );
  }

  try {
    const addedNames = await addEmployeeNames(names);
    const roster = await getEmployeeNames();
    return NextResponse.json({ names: roster, addedNames });
  } catch (error) {
    console.error("Failed to add roster names", error);
    return NextResponse.json(
      { error: "Failed to add roster names." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: EmployeeMutationPayload;

  try {
    payload = (await request.json()) as EmployeeMutationPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  try {
    const removed = await removeEmployeeName(name);
    if (!removed) {
      return NextResponse.json({ error: "Name not found." }, { status: 404 });
    }

    const roster = await getEmployeeNames();
    return NextResponse.json({ names: roster, removed: true });
  } catch (error) {
    console.error("Failed to remove roster name", error);
    return NextResponse.json(
      { error: "Failed to remove roster name." },
      { status: 500 }
    );
  }
}
