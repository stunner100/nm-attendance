import { CHECKIN_TIMEZONE } from "./attendance-punctuality";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export type AttendanceMonthRange = {
  /** Normalised `YYYY-MM` value. */
  month: string;
  /** First day of the month, `YYYY-MM-DD` (inclusive). */
  startDate: string;
  /** Last day of the month, `YYYY-MM-DD` (inclusive). */
  endDate: string;
};

/**
 * Parses a `YYYY-MM` month value into its inclusive date range.
 * Returns `null` for anything that is not a real calendar month.
 */
export function parseAttendanceMonth(
  value: string | undefined | null
): AttendanceMonthRange | null {
  const month = value?.trim();
  if (!month || !MONTH_PATTERN.test(month)) {
    return null;
  }

  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;

  // Day 0 of the following month is the last day of this month,
  // which handles 28/29/30/31-day months (including leap years).
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const paddedLastDay = String(lastDay).padStart(2, "0");

  return {
    month,
    startDate: `${month}-01`,
    endDate: `${month}-${paddedLastDay}`,
  };
}

export function isValidAttendanceMonth(value: string | undefined | null): boolean {
  return parseAttendanceMonth(value) !== null;
}

/** Current `YYYY-MM` in the check-in timezone. */
export function getCurrentAttendanceMonth(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CHECKIN_TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  if (year && month) {
    return `${year}-${month}`;
  }

  return now.toISOString().slice(0, 7);
}
