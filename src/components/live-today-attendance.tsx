"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, Loader2, RefreshCw, Users } from "lucide-react";

import { EmptyState } from "@/components/hr/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CHECKIN_TIMEZONE } from "@/lib/attendance-punctuality";
import { formatTime } from "@/lib/format-datetime";

export type PublicTodayAttendanceRecord = {
  id: number;
  name: string;
  timestamp: string;
  checkout_timestamp: string | null;
};

type LiveTodayAttendanceProps = {
  refreshToken?: number;
};

const POLL_INTERVAL_MS = 20_000;

function formatTodayLabel(): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: CHECKIN_TIMEZONE,
  }).format(new Date());
}

export function LiveTodayAttendance({ refreshToken = 0 }: LiveTodayAttendanceProps) {
  const [records, setRecords] = useState<PublicTodayAttendanceRecord[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [todayLabel, setTodayLabel] = useState("");
  const hasLoadedRef = useRef(false);

  const loadRecords = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setStatus((current) => (current === "ready" ? current : "loading"));
    }

    try {
      const response = await fetch("/api/checkin/today", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as {
        records?: PublicTodayAttendanceRecord[];
        error?: string;
      };

      if (!response.ok || !Array.isArray(data.records)) {
        throw new Error(data.error ?? "Unable to load today's attendance.");
      }

      setRecords(
        data.records.map((record) => ({
          id: record.id,
          name: record.name,
          timestamp: record.timestamp,
          checkout_timestamp: record.checkout_timestamp ?? null,
        }))
      );
      hasLoadedRef.current = true;
      setError(null);
      setStatus("ready");
    } catch (loadError) {
      if (options?.silent && hasLoadedRef.current) {
        return;
      }

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load today's attendance."
      );
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    setTodayLabel(formatTodayLabel());
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords, refreshToken]);

  useEffect(() => {
    const poll = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void loadRecords({ silent: true });
    };

    const intervalId = window.setInterval(poll, POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadRecords({ silent: true });
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [loadRecords]);

  const stillInCount = records.filter((record) => !record.checkout_timestamp).length;

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg font-medium">Today&apos;s attendance</CardTitle>
          </div>
          <CardDescription className="mt-1">
            {todayLabel || "Today"} · {CHECKIN_TIMEZONE}
          </CardDescription>
          {status === "ready" ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {records.length === 1
                ? "1 person checked in"
                : `${records.length} people checked in`}
              {records.length > 0 ? ` · ${stillInCount} still in` : ""}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void loadRecords()}
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </CardHeader>

      <CardContent>
        {status === "loading" && records.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading today&apos;s attendance...
          </div>
        ) : null}

        {status === "error" ? (
          <div className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button type="button" size="sm" variant="outline" onClick={() => void loadRecords()}>
              Try again
            </Button>
          </div>
        ) : null}

        {status === "ready" && records.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No check-ins yet today"
            description="As people check in, their name and times will show up here."
          />
        ) : null}

        {records.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell>{formatTime(record.timestamp)}</TableCell>
                  <TableCell>
                    {record.checkout_timestamp ? (
                      formatTime(record.checkout_timestamp)
                    ) : (
                      <span className="text-muted-foreground">Still in</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </CardContent>
    </Card>
  );
}
