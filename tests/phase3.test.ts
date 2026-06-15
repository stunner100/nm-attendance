import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";

import {
  CHECKIN_SCAN_TOKEN_TTL_MINUTES,
  createRawCheckinScanToken,
  hashCheckinScanToken,
} from "../src/lib/checkin-tokens";

describe("checkin-tokens", () => {
  it("hashes tokens deterministically with sha256", () => {
    const token = "abc123";
    const expected = createHash("sha256").update(token).digest("hex");
    assert.equal(hashCheckinScanToken(token), expected);
  });

  it("creates unique 64-character hex tokens", () => {
    const first = createRawCheckinScanToken();
    const second = createRawCheckinScanToken();

    assert.equal(first.length, 64);
    assert.equal(second.length, 64);
    assert.notEqual(first, second);
    assert.match(first, /^[a-f0-9]{64}$/);
  });

  it("exposes a 30-minute scan token TTL", () => {
    assert.equal(CHECKIN_SCAN_TOKEN_TTL_MINUTES, 30);
  });
});
