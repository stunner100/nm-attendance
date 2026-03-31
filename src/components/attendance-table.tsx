"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

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
};

export function AttendanceTable({
  initialRecords,
  initialDate,
}: AttendanceTableProps) {
  const router = useRouter();

  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const onDateChange = (value: string) => {
    if (!value) {
      router.push("/admin");
      return;
    }

    router.push(`/admin?date=${value}`);
  };

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle>Attendance records</CardTitle>
          <CardDescription>
            {initialRecords.length} record
            {initialRecords.length === 1 ? "" : "s"} found
            {initialDate ? ` for ${initialDate}` : ""}.
          </CardDescription>
        </div>

        <div className="w-full max-w-xs space-y-1">
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
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>GPS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No attendance records for this filter.
                </TableCell>
              </TableRow>
            ) : (
              initialRecords.map((record) => {
                const hasGps =
                  typeof record.latitude === "number" &&
                  typeof record.longitude === "number";

                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.name}</TableCell>
                    <TableCell>{formatter.format(new Date(record.timestamp))}</TableCell>
                    <TableCell>
                      {hasGps ? (
                        <Link
                          className="text-primary underline underline-offset-2"
                          href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Map
                        </Link>
                      ) : (
                        <Badge variant="outline">No GPS</Badge>
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
