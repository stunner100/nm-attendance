"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, ExternalLink, Download } from "lucide-react";

import { AttendanceRecordSummary } from "@/components/hr/attendance-record-summary";
import { AdminFormAlert } from "@/components/hr/admin-form-alert";
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
  const [exportError, setExportError] = useState<string | null>(null);
  const visibleRecords =
    typeof maxRows === "number" ? initialRecords.slice(0, maxRows) : initialRecords;

  const onDateChange = (value: string) => {
    if (!value) {
      router.push(basePath);
      return;
    }

    router.push(`${basePath}?date=${value}`);
  };

  const handleExportCsv = async () => {
    setExportError(null);

    try {
      const dateQuery = initialDate ? `&date=${encodeURIComponent(initialDate)}` : "";
      const res = await fetch(`/api/admin/export-attendance?format=csv${dateQuery}`);

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed to export attendance");
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `attendance-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Export failed", err);
      setExportError(
        err instanceof Error ? err.message : "Failed to export CSV. Please try again."
      );
    }
  };

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg font-medium">{title}</CardTitle>
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
              className="text-link flex items-center gap-1 pb-2 text-sm font-medium"
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
        </div>
      </CardHeader>

      <CardContent>
        <AdminFormAlert message={exportError} />
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
              visibleRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <AttendanceRecordSummary record={record} variant="table-cells" />
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
