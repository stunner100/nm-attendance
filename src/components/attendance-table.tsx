"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, MapPin, ExternalLink, Download, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
    <Card className="border-0 shadow-lg">
      <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-400" />
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
              className="flex items-center gap-1 pb-2 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
              href={viewAllHref}
            >
              View all
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : null}
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Clear All Data
          </button>
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
              <TableHead>GPS</TableHead>
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
                const hasGps =
                  typeof record.latitude === "number" &&
                  typeof record.longitude === "number";
                const hasCheckout = typeof record.checkout_timestamp === "string";

                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {formatter.format(new Date(record.timestamp))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {hasCheckout ? (
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
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
                          hasCheckout
                            ? "border-emerald-200 text-emerald-700"
                            : "border-sky-200 text-sky-700"
                        }
                      >
                        {hasCheckout ? "Completed" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {hasGps ? (
                        <Link
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
                          href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          View Map
                        </Link>
                      ) : (
                        <Badge variant="outline" className="border-slate-200 text-slate-500">
                          No GPS
                        </Badge>
                      )}
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
