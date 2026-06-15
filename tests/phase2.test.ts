import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DATA_WIPE_CONFIRM_PHRASE,
  isDataWipeAllowed,
} from "../src/lib/admin-backup";
import {
  checkRateLimit,
  resetRateLimitsForTests,
} from "../src/lib/rate-limit";

describe("rate-limit", () => {
  it("allows requests under the limit", () => {
    resetRateLimitsForTests();

    const first = checkRateLimit({
      key: "test:ip",
      limit: 2,
      windowMs: 60_000,
    });
    const second = checkRateLimit({
      key: "test:ip",
      limit: 2,
      windowMs: 60_000,
    });

    assert.equal(first.allowed, true);
    assert.equal(second.allowed, true);
    assert.equal(second.remaining, 0);
  });

  it("blocks requests above the limit", () => {
    resetRateLimitsForTests();

    checkRateLimit({ key: "block:ip", limit: 1, windowMs: 60_000 });
    const blocked = checkRateLimit({
      key: "block:ip",
      limit: 1,
      windowMs: 60_000,
    });

    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfterMs > 0);
  });
});

describe("admin-backup", () => {
  it("exposes the wipe confirmation phrase", () => {
    assert.equal(DATA_WIPE_CONFIRM_PHRASE, "DELETE ALL DATA");
  });

  it("blocks production wipe unless explicitly enabled", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalAllowWipe = process.env.ALLOW_DATA_WIPE;

    Object.assign(process.env, { NODE_ENV: "production" });
    delete process.env.ALLOW_DATA_WIPE;
    assert.equal(isDataWipeAllowed(), false);

    Object.assign(process.env, { ALLOW_DATA_WIPE: "true" });
    assert.equal(isDataWipeAllowed(), true);

    Object.assign(process.env, {
      NODE_ENV: originalNodeEnv,
      ALLOW_DATA_WIPE: originalAllowWipe,
    });
  });
});
