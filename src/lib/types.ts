export type GpsStatus = "loading" | "granted" | "denied";

export type AttendanceRow = {
  id: number;
  name: string;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  created_at: string;
};
