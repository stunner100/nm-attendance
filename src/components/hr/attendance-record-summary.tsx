import Link from "next/link";
import { Clock, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { TableCell } from "@/components/ui/table";
import {
  getAttendancePunctualityDisplay,
  type AttendancePunctualityDisplay,
} from "@/lib/attendance-punctuality";
import { formatDateTime } from "@/lib/format-datetime";
import { buildOpenStreetMapUrl } from "@/lib/geo-coords";
import { formatLocationWithCoordinates } from "@/lib/reverse-geocode";
import type { AttendanceRow } from "@/lib/types";

type AttendanceRecordSummaryProps = {
  record: AttendanceRow;
  variant: "card" | "table-cells";
};

function punctualityBadgeClassName(punctuality: AttendancePunctualityDisplay): string {
  return punctuality === "Late"
    ? "border-[var(--color-rule)] bg-[var(--color-signature-yellow)]/35 text-[var(--color-ink)]"
    : "border-[var(--color-rule)] bg-[var(--color-signature-mint)]/40 text-[var(--color-success)]";
}

function resolveLocationLabel(record: AttendanceRow, kind: "checkin" | "checkout"): string {
  if (kind === "checkin") {
    return formatLocationWithCoordinates(
      record.location,
      record.latitude,
      record.longitude
    );
  }

  return formatLocationWithCoordinates(
    record.checkout_location,
    record.checkout_latitude,
    record.checkout_longitude
  );
}

function PunctualityBadge({ punctuality }: { punctuality: AttendancePunctualityDisplay }) {
  return (
    <Badge variant="outline" className={punctualityBadgeClassName(punctuality)}>
      {punctuality}
    </Badge>
  );
}

function MapViewLink({
  label,
  locationText,
  latitude,
  longitude,
}: {
  label: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
}) {
  const mapUrl = buildOpenStreetMapUrl(latitude, longitude);

  if (!mapUrl) {
    return (
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <Badge variant="outline" className="text-muted-foreground">
            No GPS
          </Badge>
        </div>
        {locationText !== "—" ? (
          <p className="text-xs text-muted-foreground">{locationText}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Link
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link inline-flex items-center gap-1.5 text-sm font-medium underline-offset-2 hover:underline"
        >
          <MapPin className="h-3.5 w-3.5" />
          View on map
        </Link>
      </div>
      {locationText !== "—" ? (
        <p className="text-xs text-muted-foreground">{locationText}</p>
      ) : null}
    </div>
  );
}

export function AttendanceRecordSummary({ record, variant }: AttendanceRecordSummaryProps) {
  const punctuality = getAttendancePunctualityDisplay(record);
  const hasCheckout = typeof record.checkout_timestamp === "string";
  const hasApprovedCoverage = Boolean(record.approved_request_id);
  const checkInLocation = resolveLocationLabel(record, "checkin");
  const checkOutLocation = hasCheckout ? resolveLocationLabel(record, "checkout") : null;

  if (variant === "card") {
    return (
      <div className="rounded-[var(--radius-sm)] border border-[var(--color-rule)] px-3 py-2 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {formatDateTime(record.timestamp)}
          </div>
          <PunctualityBadge punctuality={punctuality} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {hasCheckout
            ? `Checked out ${formatDateTime(record.checkout_timestamp as string)}`
            : "Not checked out"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{checkInLocation}</p>
      </div>
    );
  }

  return (
    <>
      <TableCell>
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          {formatDateTime(record.timestamp)}
        </div>
      </TableCell>
      <TableCell>
        {hasCheckout ? (
          <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-600">
            <Clock className="h-3.5 w-3.5 text-neutral-400" />
            {formatDateTime(record.checkout_timestamp as string)}
          </div>
        ) : (
          <Badge
            variant="outline"
            className="border-[var(--color-rule)] bg-[var(--color-signature-yellow)]/35 text-[var(--color-ink)]"
          >
            Not checked out
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <PunctualityBadge punctuality={punctuality} />
        {hasApprovedCoverage ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {record.approved_request_type}
            {record.approved_late_arrival_time
              ? ` · ${record.approved_late_arrival_time.slice(0, 5)}`
              : ""}
          </p>
        ) : null}
      </TableCell>
      <TableCell className="max-w-xs">
        <div className="space-y-1 text-sm text-foreground">
          <MapViewLink
            label="In"
            locationText={checkInLocation}
            latitude={record.latitude}
            longitude={record.longitude}
          />
          {checkOutLocation ? (
            <MapViewLink
              label="Out"
              locationText={checkOutLocation}
              latitude={record.checkout_latitude}
              longitude={record.checkout_longitude}
            />
          ) : null}
        </div>
      </TableCell>
    </>
  );
}
