"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  LogOut,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmployeeCombobox } from "@/components/employee-combobox";
import type { GpsStatus } from "@/lib/types";
import { buildOpenStreetMapUrl } from "@/lib/geo-coords";
import { reverseGeocode } from "@/lib/reverse-geocode";

type Coordinates = {
  lat: number;
  lng: number;
};

type CheckinEmployee = {
  id: number;
  fullName: string;
  department: string;
};

type TokenStatus = "loading" | "ready" | "error";
type AttendanceAction = "checkin" | "checkout";
type EmployeeLoadStatus = "loading" | "ready" | "error";
type OpenCheckinStatus = "idle" | "loading" | "open" | "none" | "error";

const NO_ACTIVE_CHECKIN_PATTERN = /no active check-in found/i;

function formatSubmitError(message: string, action: AttendanceAction): string {
  if (action === "checkout" && NO_ACTIVE_CHECKIN_PATTERN.test(message)) {
    return "You don't have an open check-in yet. Switch to Check in, record your arrival, then return here to check out.";
  }

  return message;
}

export function CheckinForm() {
  const [action, setAction] = useState<AttendanceAction>("checkin");
  const [scanToken, setScanToken] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("loading");
  const [employees, setEmployees] = useState<CheckinEmployee[]>([]);
  const [employeeLoadStatus, setEmployeeLoadStatus] = useState<EmployeeLoadStatus>("loading");
  const [employeeId, setEmployeeId] = useState("");
  const [openCheckinStatus, setOpenCheckinStatus] = useState<OpenCheckinStatus>("idle");
  const [hasAttendanceToday, setHasAttendanceToday] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [submittedAction, setSubmittedAction] = useState<AttendanceAction | null>(null);
  const [punctualityMessage, setPunctualityMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formattedSubmittedTime, setFormattedSubmittedTime] = useState<string | null>(null);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => String(employee.id) === employeeId) ?? null,
    [employeeId, employees]
  );

  const currentMapUrl = useMemo(
    () =>
      coordinates
        ? buildOpenStreetMapUrl(coordinates.lat, coordinates.lng)
        : null,
    [coordinates]
  );

  async function fetchScanTokenValue(): Promise<string> {
    const response = await fetch("/api/checkin/token", {
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as {
      scanToken?: string;
      error?: string;
    };

    if (!response.ok || typeof data.scanToken !== "string") {
      throw new Error(data.error ?? "Unable to prepare check-in.");
    }

    return data.scanToken;
  }

  async function refreshScanToken() {
    setTokenStatus("loading");
    setScanToken(null);

    try {
      const nextScanToken = await fetchScanTokenValue();
      setScanToken(nextScanToken);
      setTokenStatus("ready");
    } catch (tokenError) {
      console.error("Failed to prepare scan token", tokenError);
      setScanToken(null);
      setTokenStatus("error");
    }
  }

  useEffect(() => {
    let active = true;

    const prepareScanToken = async () => {
      try {
        const nextScanToken = await fetchScanTokenValue();

        if (!active) {
          return;
        }

        setScanToken(nextScanToken);
        setTokenStatus("ready");
      } catch (tokenError) {
        if (!active) {
          return;
        }

        console.error("Failed to prepare scan token", tokenError);
        setScanToken(null);
        setTokenStatus("error");
      }
    };

    void prepareScanToken();

    return () => {
      active = false;
    };
  }, []);

  async function refreshEmployees() {
    setEmployeeLoadStatus("loading");

    try {
      const response = await fetch("/api/checkin/employees", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as {
        employees?: CheckinEmployee[];
        error?: string;
      };

      if (!response.ok || !Array.isArray(data.employees)) {
        throw new Error(data.error ?? "Unable to load employee list.");
      }

      setEmployees(data.employees);
      setEmployeeLoadStatus("ready");
    } catch (loadError) {
      console.error("Failed to load employees", loadError);
      setEmployees([]);
      setEmployeeLoadStatus("error");
    }
  }

  useEffect(() => {
    void refreshEmployees();
  }, []);

  useEffect(() => {
    if (!employeeId) {
      setOpenCheckinStatus("idle");
      setHasAttendanceToday(false);
      return;
    }

    let active = true;
    const controller = new AbortController();

    const loadEmployeeAttendanceStatus = async () => {
      setOpenCheckinStatus("loading");
      setHasAttendanceToday(false);

      try {
        const response = await fetch(
          `/api/checkin/open-status?employeeId=${encodeURIComponent(employeeId)}`,
          { cache: "no-store", signal: controller.signal }
        );
        const data = (await response.json().catch(() => ({}))) as {
          hasOpenCheckin?: boolean;
          hasAttendanceToday?: boolean;
          error?: string;
        };

        if (!active) {
          return;
        }

        if (
          !response.ok ||
          typeof data.hasOpenCheckin !== "boolean" ||
          typeof data.hasAttendanceToday !== "boolean"
        ) {
          setOpenCheckinStatus("error");
          return;
        }

        setOpenCheckinStatus(data.hasOpenCheckin ? "open" : "none");
        setHasAttendanceToday(data.hasAttendanceToday);
      } catch (statusError) {
        if (!active || (statusError instanceof DOMException && statusError.name === "AbortError")) {
          return;
        }

        setOpenCheckinStatus("error");
      }
    };

    void loadEmployeeAttendanceStatus();

    return () => {
      active = false;
      controller.abort();
    };
  }, [employeeId]);

  useEffect(() => {
    void requestLocation();
  }, []);

  useEffect(() => {
    if (!submittedAt) {
      setFormattedSubmittedTime(null);
      return;
    }

    setFormattedSubmittedTime(
      new Date(submittedAt).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    );
  }, [submittedAt]);

  function requestLocation() {
    if (gpsStatus === "loading" || gpsStatus === "granted") {
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus("denied");
      setCoordinates(null);
      setLocationLabel(null);
      return;
    }

    setGpsStatus("loading");
    setLocationLabel(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setCoordinates({ lat, lng });
        setGpsStatus("granted");

        void reverseGeocode(lat, lng).then((label) => {
          if (label) {
            setLocationLabel(label);
          }
        });
      },
      () => {
        setGpsStatus("denied");
        setCoordinates(null);
        setLocationLabel(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 8_000,
        maximumAge: 60_000,
      }
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!employeeId) {
      setError("Please select your name from the list.");
      return;
    }

    if (action === "checkin" && openCheckinStatus === "open") {
      setError(
        "You already have an open check-in. Please check out before checking in again."
      );
      return;
    }

    if (!scanToken) {
      setError("Attendance action is not ready yet. Wait a moment and try again.");
      return;
    }

    if (gpsStatus !== "granted" || !coordinates) {
      setError("Location access is required. Please allow location access and try again.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const endpoint = action === "checkout" ? "/api/checkout" : "/api/checkin";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: Number.parseInt(employeeId, 10),
          scanToken,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          location: locationLabel,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(
          formatSubmitError(
            data.error ??
              (action === "checkout"
                ? "Unable to submit check-out."
                : "Unable to submit check-in."),
            action
          )
        );
        return;
      }

      const data = (await response.json().catch(() => ({}))) as {
        timestamp?: string;
        punctualityMessage?: string;
        statusMessage?: string;
      };

      setPunctualityMessage(
        typeof data.punctualityMessage === "string" ? data.punctualityMessage : null
      );
      setStatusMessage(
        typeof data.statusMessage === "string"
          ? data.statusMessage
          : action === "checkout"
            ? "Check-out recorded"
            : null
      );
      setSubmittedAction(action);
      setSubmittedAt(data.timestamp ?? new Date().toISOString());

      await refreshScanToken();
    } catch {
      setError(
        action === "checkout"
          ? "Network error while submitting check-out."
          : "Network error while submitting check-in."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleActionChange(nextAction: AttendanceAction) {
    setAction(nextAction);
    setError(null);
  }

  function handleEmployeeChange(nextEmployeeId: string) {
    setEmployeeId(nextEmployeeId);
    setError(null);
  }

  function resetForAnother(nextAction: AttendanceAction) {
    setSubmittedAt(null);
    setSubmittedAction(null);
    setPunctualityMessage(null);
    setStatusMessage(null);
    setError(null);
    setOpenCheckinStatus("idle");
    setHasAttendanceToday(false);
    setAction(nextAction);

    if (tokenStatus !== "ready") {
      void refreshScanToken();
    }
  }

  const isCheckout = submittedAction === "checkout";
  const isLate = submittedAction === "checkin" && punctualityMessage === "You are late";

  if (submittedAt) {
    const statusTone = isCheckout
      ? "border-sky-200 bg-sky-50 text-sky-800"
      : isLate
        ? "border-destructive/20 bg-destructive/10 text-destructive"
        : "border-primary/20 bg-primary/10 text-primary";

    return (
      <Card>
        <CardHeader className="space-y-4">
          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${statusTone}`}
          >
            {isCheckout ? (
              <LogOut className="h-4 w-4" />
            ) : isLate ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>{isCheckout ? statusMessage : punctualityMessage}</span>
          </div>

          <div>
            <CardTitle className="text-2xl sm:text-3xl">
              {isCheckout ? "Check-out complete" : isLate ? "You are late" : "You are on time"}
            </CardTitle>
            <CardDescription className="mt-2 text-base">
              {selectedEmployee?.fullName ?? "Employee"} {isCheckout ? "checked out" : "checked in"}
              {formattedSubmittedTime ? (
                <>
                  {" "}
                  at <span className="tabular-nums">{formattedSubmittedTime}</span>
                </>
              ) : null}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => resetForAnother("checkin")}>
            Record check-in
          </Button>
          <Button type="button" onClick={() => resetForAnother("checkout")}>
            Record check-out
          </Button>
        </CardContent>
      </Card>
    );
  }

  const submitBlockedReason =
    tokenStatus === "error"
      ? "Session not ready"
      : gpsStatus === "denied"
        ? "Location required"
        : gpsStatus === "loading" || gpsStatus === "idle"
          ? "Waiting for location"
          : null;

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="rounded-lg border border-border bg-muted p-1">
            <div className="grid min-w-0 grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => handleActionChange("checkin")}
                className={
                  action === "checkin"
                    ? "rounded-md bg-primary px-3 py-2 text-sm font-semibold whitespace-nowrap text-primary-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                    : "rounded-md bg-card px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                }
              >
                Check in
              </button>
              <button
                type="button"
                onClick={() => handleActionChange("checkout")}
                className={
                  action === "checkout"
                    ? "rounded-md bg-primary px-3 py-2 text-sm font-semibold whitespace-nowrap text-primary-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                    : "rounded-md bg-card px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                }
              >
                Check out
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="employee">
              Your name
            </label>

            <EmployeeCombobox
              id="employee"
              employees={employees}
              value={employeeId}
              onChange={handleEmployeeChange}
              loading={employeeLoadStatus === "loading"}
              loadError={employeeLoadStatus === "error"}
              disabled={employeeLoadStatus !== "ready"}
            />

            {employeeLoadStatus === "error" ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">
                  Could not load the employee list. Check your connection and try again.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void refreshEmployees()}
                  className="shrink-0 border-destructive/30 bg-card text-destructive hover:bg-destructive/5"
                >
                  Try again
                </Button>
              </div>
            ) : null}

            {action === "checkin" && employeeId ? (
              openCheckinStatus === "loading" ? (
                <p className="text-sm text-muted-foreground">Checking today&apos;s attendance...</p>
              ) : openCheckinStatus === "open" ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-medium">Open check-in already on record</p>
                  <p className="mt-1">
                    You are still checked in. Switch to Check out to close this session before
                    checking in again.
                  </p>
                </div>
              ) : hasAttendanceToday ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-medium">Already checked in today</p>
                  <p className="mt-1">
                    You have attendance on record for today. You can still check in again for
                    another session if needed.
                  </p>
                </div>
              ) : null
            ) : null}

            {action === "checkout" && employeeId ? (
              openCheckinStatus === "loading" ? (
                <p className="text-sm text-muted-foreground">Checking for an open check-in...</p>
              ) : openCheckinStatus === "none" ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-medium">No open check-in found</p>
                  <p className="mt-1">
                    Switch to Check in first, then come back here to check out.
                  </p>
                </div>
              ) : openCheckinStatus === "open" ? (
                <p className="text-sm text-muted-foreground">
                  Open check-in found. You can check out now.
                </p>
              ) : null
            ) : null}
          </div>

          <div className="rounded-lg border border-border bg-muted p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Location <span className="text-destructive">*</span>
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {gpsStatus === "granted"
                    ? locationLabel
                      ? locationLabel
                      : action === "checkout"
                        ? "Resolving your check-out location..."
                        : "Resolving your check-in location..."
                    : "Required. Tap the button to share your location."}
                </p>
                {currentMapUrl ? (
                  <a
                    href={currentMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-2 hover:underline"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    View on map
                  </a>
                ) : null}
              </div>

              <Button
                type="button"
                variant={gpsStatus === "granted" ? "secondary" : "default"}
                onClick={requestLocation}
                disabled={gpsStatus === "loading"}
                className="min-w-40 whitespace-nowrap"
              >
                {gpsStatus === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Getting location...
                  </>
                ) : gpsStatus === "granted" ? (
                  <>
                    <MapPin className="h-4 w-4" />
                    Location ready
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    Allow location
                  </>
                )}
              </Button>
            </div>

            {gpsStatus === "denied" ? (
              <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium">Location access blocked</p>
                    <p className="mt-1 text-destructive/90">
                      Enable location in your browser settings, then tap Allow location above to
                      retry.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {tokenStatus === "error" ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium">Unable to prepare check-in</p>
                    <p className="mt-1 text-destructive/90">
                      Check your connection and try again.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void refreshScanToken()}
                  className="shrink-0 border-destructive/30 bg-card text-destructive hover:bg-destructive/5"
                >
                  Try again
                </Button>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            </div>
          ) : null}

          <Button
            disabled={
              submitting ||
              tokenStatus !== "ready" ||
              employeeLoadStatus !== "ready" ||
              !employeeId ||
              gpsStatus !== "granted" ||
              !coordinates ||
              (action === "checkin" && openCheckinStatus === "open")
            }
            type="submit"
            className="h-12 w-full whitespace-nowrap text-base"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {action === "checkout" ? "Checking out..." : "Checking in..."}
              </>
            ) : submitBlockedReason ? (
              submitBlockedReason
            ) : tokenStatus === "ready" ? (
              <>
                {action === "checkout" ? (
                  <LogOut className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                {action === "checkout" ? "Check out" : "Check in"}
              </>
            ) : (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Getting ready...
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
