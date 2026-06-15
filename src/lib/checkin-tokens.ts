import { createHash, randomBytes } from "crypto";

export const CHECKIN_SCAN_TOKEN_TTL_MINUTES = 30;

export function hashCheckinScanToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createRawCheckinScanToken(): string {
  return randomBytes(32).toString("hex");
}
