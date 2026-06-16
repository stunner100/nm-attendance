"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, ExternalLink, Download, Trash2 } from "lucide-react";

import { getCheckinPunctualityLabel } from "@/lib/attendance-punctuality";
import { buildOpenStreetMapUrl } from "@/lib/geo-coords";
import {
  formatCoordinatesLabel,
  looksLikeCoordinatesLabel,
} from "@/lib/reverse-geocode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AttendanceRow } from "@/lib/types";

type AttendanceTableProps = {
  initialRecords: AttendanceRow[];
  initialDate?: string;
  title?: string;
  description?: string;
  maxRows?: number;
  basePath?: string;
  viewAllHref?: string;
};

function resolveLocationLabel(record: AttendanceRow, kind: "checkin" | "checkout"): string {
  if (kind === "checkin") {
    const stored = record.location?.trim();
    if (stored && !looksLikeCoordinatesLabel(stored)) {
      return stored;
    }

    return (
      formatCoordinatesLabel(record.latitude, record.longitude) ||
      "—"
    );
  }

  const stored = record.checkout_location?.trim();
  if (stored && !looksLikeCoordinatesLabel(stored)) {
    return stored;
  }

  return (
    formatCoordinatesLabel(record.checkout_latitude, record.checkout_longitude) ||
    "—"
  );
}

function LocationLine({
  prefix,
  locationText,
  latitude,
  longitude,
}: {
  prefix: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
}) {
  const mapUrl = buildOpenStreetMapUrl(latitude, longitude);

  return (
    <p>
      <span className="text-xs font-medium text-muted-foreground">{prefix}: </span>
      {locationText}
      {mapUrl ? (
        <>
          {" "}
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-xs font-medium text-neutral-600 underline-offset-2 hover:text-neutral-950 hover:underline"
          >
            View on map
            <ExternalLink className="h-3 w-3" />
          </a>
        </>
      ) : null}
    </p>
  );
}

export function AttendanceTable({
  initialRecords,
  initialDate,
  title = "Attendance records",
  description,
  maxRows,
  basePath = "/admin",
  viewAllHref,
}: AttendanceTableProps) {
  const router = useRouter();
  const visibleRecords =
    typeof maxRows === "number" ? initialRecords.slice(0, maxRows) : initialRecords;

  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const onDateChange = (value: string) => {
    if (!value) {
      router.push(basePath);
      return;
    }

    router.push(`${basePath}?date=${value}`);
  };

  const handleExportCsv = async () => {
    try {
      const dateQuery = initialDate ? `&date=${encodeURIComponent(initialDate)}` : "";
      const a = document.createElement("a");
      a.href = `/api/admin/export-attendance?format=csv${dateQuery}`;
      a.download = `attendance-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const handleClearAll = async () => {
    if (
      !confirm(
        "Are you sure you want to delete ALL data (attendance, HR, recruitment, payroll, training, performance, compliance)? This cannot be undone."
      )
    ) {
      return;
    }

    const confirmPhrase = window.prompt(
      'Type "DELETE ALL DATA" to confirm permanent deletion of all operational data.'
    );
    if (confirmPhrase !== "DELETE ALL DATA") {
      return;
    }

    try {
      const res = await fetch("/api/admin/clear-all-data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmPhrase }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to clear data");
      }
      router.refresh();
    } catch (err) {
      console.error("Clear failed", err);
      alert("Failed to clear data. Please try again.");
    }
  };

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-neutral-400" />
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          </div>
          <CardDescription>
            {description ??
              `${initialRecords.length} record${initialRecords.length === 1 ? "" : "s"} found${
                initialDate ? ` for ${initialDate}` : ""
              }.`}
          </CardDescription>
        </div>

        <div className="flex w-full max-w-lg items-end gap-3 flex-wrap">
          <div className="flex-1 space-y-1 min-w-[140px]">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="date-filter">
              Filter by date
            </label>
            <Input
              id="date-filter"
              type="date"
              value={initialDate ?? ""}
              onChange={(event) => onDateChange(event.target.value)}
            />
          </div>
          {viewAllHref ? (
            <Link
              className="flex items-center gap-1 pb-2 text-sm font-semibold text-neutral-600 transition-colors hover:text-neutral-950"
              href={viewAllHref}
            >
              View all
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : null}
          <Button onClick={handleExportCsv} size="sm">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handleClearAll} variant="destructive" size="sm">
            <Trash2 className="h-4 w-4" />
            Clear All Data
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {typeof maxRows === "number" && initialRecords.length > visibleRecords.length ? (
          <p className="mb-3 text-xs text-muted-foreground">
            Showing {visibleRecords.length} most recent records out of {initialRecords.length}.
          </p>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No attendance records for this filter.
                </TableCell>
              </TableRow>
            ) : (
              visibleRecords.map((record) => {
                const hasCheckout = typeof record.checkout_timestamp === "string";
                const punctuality = getCheckinPunctualityLabel(record.timestamp);
                const isLate = punctuality === "Late";
                const checkInLocation = resolveLocationLabel(record, "checkin");
                const checkOutLocation = hasCheckout
                  ? resolveLocationLabel(record, "checkout")
                  : null;

                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-600">
                        <Clock className="h-3.5 w-3.5 text-neutral-400" />
                        {formatter.format(new Date(record.timestamp))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {hasCheckout ? (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-600">
                          <Clock className="h-3.5 w-3.5 text-neutral-400" />
                          {formatter.format(new Date(record.checkout_timestamp as string))}
                        </div>
                      ) : (
                        <Badge variant="outline" className="border-amber-200 text-amber-700">
                          Not checked out
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          isLate
                            ? "border-amber-200 bg-amber-50 text-amber-800"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }
                      >
                        {punctuality}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="space-y-1 text-sm text-neutral-700">
                        <LocationLine
                          prefix="In"
                          locationText={checkInLocation}
                          latitude={record.latitude}
                          longitude={record.longitude}
                        />
                        {checkOutLocation ? (
                          <LocationLine
                            prefix="Out"
                            locationText={checkOutLocation}
                            latitude={record.checkout_latitude}
                            longitude={record.checkout_longitude}
                          />
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
