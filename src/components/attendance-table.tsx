"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, MapPin, ExternalLink } from "lucide-react";

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

        <div className="flex w-full max-w-sm items-end gap-3">
          <div className="flex-1 space-y-1">
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
              <TableHead>Timestamp</TableHead>
              <TableHead>GPS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  No attendance records for this filter.
                </TableCell>
              </TableRow>
            ) : (
              visibleRecords.map((record) => {
                const hasGps =
                  typeof record.latitude === "number" &&
                  typeof record.longitude === "number";

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
