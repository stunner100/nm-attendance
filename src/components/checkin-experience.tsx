"use client";

import { useState } from "react";

import { CheckinForm } from "@/components/checkin-form";
import { LiveTodayAttendance } from "@/components/live-today-attendance";

export function CheckinExperience() {
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <div className="space-y-6">
      <CheckinForm onRecorded={() => setRefreshToken((value) => value + 1)} />
      <LiveTodayAttendance refreshToken={refreshToken} />
    </div>
  );
}
