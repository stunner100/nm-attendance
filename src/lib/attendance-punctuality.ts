export const CHECKIN_TIMEZONE =
  process.env.CHECKIN_TIMEZONE || "Africa/Accra";

/** Minutes from midnight; on time through 8:30 AM inclusive. */
export const ON_TIME_CUTOFF_MINUTES = 8 * 60 + 30;

export type CheckinPunctuality = "on_time" | "late";

export function getCheckinPunctuality(timestamp: string): CheckinPunctuality {
  const checkedAt = new Date(timestamp);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: CHECKIN_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(checkedAt);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  const minutesFromMidnight = hour * 60 + minute;

  return minutesFromMidnight > ON_TIME_CUTOFF_MINUTES ? "late" : "on_time";
}

export function getCheckinPunctualityLabel(timestamp: string): "On time" | "Late" {
  return getCheckinPunctuality(timestamp) === "late" ? "Late" : "On time";
}

export type AttendancePunctualityDisplay = "On time" | "Late" | "Approved";

export function getAttendancePunctualityDisplay(record: {
  timestamp: string;
  approved_request_id: number | null;
}): AttendancePunctualityDisplay {
  const rawPunctuality = getCheckinPunctualityLabel(record.timestamp);
  if (rawPunctuality === "Late" && record.approved_request_id) {
    return "Approved";
  }
  return rawPunctuality;
}

export function getPunctualityMessage(timestamp: string): string {
  return getCheckinPunctuality(timestamp) === "late"
    ? "You are late"
    : "You are on time";
}
