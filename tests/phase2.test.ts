import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DATA_WIPE_CONFIRM_PHRASE,
  isDataWipeAllowed,
} from "../src/lib/admin-backup";

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
