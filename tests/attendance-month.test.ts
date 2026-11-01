import test from "node:test";
import assert from "node:assert/strict";

import {
  getCurrentAttendanceMonth,
  isValidAttendanceMonth,
  parseAttendanceMonth,
} from "../src/lib/attendance-month";

test("resolves a 31-day month from the 1st to the last day", () => {
  assert.deepEqual(parseAttendanceMonth("2026-01"), {
    month: "2026-01",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
  });
});

test("resolves a 30-day month from the 1st to the last day", () => {
  assert.deepEqual(parseAttendanceMonth("2026-04"), {
    month: "2026-04",
    startDate: "2026-04-01",
    endDate: "2026-04-30",
  });
});

test("resolves February in a non-leap year", () => {
  assert.equal(parseAttendanceMonth("2026-02")?.endDate, "2026-02-28");
});

test("resolves February in a leap year", () => {
  assert.equal(parseAttendanceMonth("2024-02")?.endDate, "2024-02-29");
});

test("rejects invalid month values", () => {
  for (const value of ["", "2026-13", "2026-00", "2026-2", "2026-02-01", "Feb 2026"]) {
    assert.equal(parseAttendanceMonth(value), null, value);
    assert.equal(isValidAttendanceMonth(value), false, value);
  }
  assert.equal(parseAttendanceMonth(undefined), null);
  assert.equal(parseAttendanceMonth(null), null);
});

test("trims surrounding whitespace", () => {
  assert.equal(parseAttendanceMonth(" 2026-11 ")?.month, "2026-11");
});

test("reports the current month for a given date", () => {
  assert.equal(
    getCurrentAttendanceMonth(new Date("2024-02-15T12:00:00Z")),
    "2024-02"
  );
});
