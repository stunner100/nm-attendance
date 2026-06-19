import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getAdminContactEmail } from "../src/lib/auth-contact";
import { isEmailConfigured } from "../src/lib/email";
import { isValidResetRequestEmail } from "../src/lib/password-reset";

describe("auth-contact", () => {
  it("returns a trimmed admin email when configured", () => {
    const original = process.env.ADMIN_EMAIL;
    process.env.ADMIN_EMAIL = "  HR@Company.COM ";

    assert.equal(getAdminContactEmail(), "hr@company.com");

    if (original === undefined) {
      delete process.env.ADMIN_EMAIL;
    } else {
      process.env.ADMIN_EMAIL = original;
    }
  });

  it("returns null when admin email is missing or invalid", () => {
    const original = process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_EMAIL;
    assert.equal(getAdminContactEmail(), null);

    process.env.ADMIN_EMAIL = "not-an-email";
    assert.equal(getAdminContactEmail(), null);

    if (original === undefined) {
      delete process.env.ADMIN_EMAIL;
    } else {
      process.env.ADMIN_EMAIL = original;
    }
  });
});

describe("email", () => {
  it("detects Resend configuration", () => {
    const originalKey = process.env.RESEND_API_KEY;
    const originalFrom = process.env.RESEND_FROM;

    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;
    assert.equal(isEmailConfigured(), false);

    process.env.RESEND_API_KEY = "re_test";
    assert.equal(isEmailConfigured(), false);

    process.env.RESEND_FROM = "HR <hr@company.com>";
    assert.equal(isEmailConfigured(), true);

    if (originalKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalKey;
    }

    if (originalFrom === undefined) {
      delete process.env.RESEND_FROM;
    } else {
      process.env.RESEND_FROM = originalFrom;
    }
  });
});

describe("password-reset", () => {
  it("validates reset request emails", () => {
    assert.equal(isValidResetRequestEmail("user@company.com"), true);
    assert.equal(isValidResetRequestEmail("  user@company.com  "), true);
    assert.equal(isValidResetRequestEmail(""), false);
    assert.equal(isValidResetRequestEmail("not-an-email"), false);
  });
});
