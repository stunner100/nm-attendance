import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateAnnualLeaveEntitlement,
  calculateLeaveRemaining,
  formatTenureLabel,
  getTenureFromHireDate,
} from "../src/lib/hr/leave-entitlement";

test("pro-rates first-year entitlement by months served", () => {
  assert.equal(
    calculateAnnualLeaveEntitlement("2025-10-01", new Date("2026-06-01T00:00:00Z")),
    10
  );
});

test("uses higher tiers after completed years", () => {
  assert.equal(
    calculateAnnualLeaveEntitlement("2025-01-01", new Date("2026-06-01T00:00:00Z")),
    18
  );
  assert.equal(
    calculateAnnualLeaveEntitlement("2024-01-01", new Date("2026-06-01T00:00:00Z")),
    21
  );
  assert.equal(
    calculateAnnualLeaveEntitlement("2020-01-01", new Date("2026-06-01T00:00:00Z")),
    24
  );
});

test("formats tenure labels for admins", () => {
  const tenure = getTenureFromHireDate("2023-04-15", new Date("2026-06-01T00:00:00Z"));
  assert.equal(formatTenureLabel(tenure), "3 years, 1 month");
});

test("calculates remaining leave days", () => {
  assert.equal(
    calculateLeaveRemaining({ annualDays: 18, carryDays: 2, usedDays: 5 }),
    15
  );
});
