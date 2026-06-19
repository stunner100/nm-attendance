"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  LogOut,
  MapPin,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { GpsStatus } from "@/lib/types";
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

const selectClassName =
  "h-12 w-full rounded-[var(--radius-input)] border border-input bg-card px-3 py-2 text-base text-foreground transition-colors outline-none focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 md:text-sm";

export function CheckinForm() {
  const [action, setAction] = useState<AttendanceAction>("checkin");
  const [scanToken, setScanToken] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("loading");
  const [employees, setEmployees] = useState<CheckinEmployee[]>([]);
  const [employeeLoadStatus, setEmployeeLoadStatus] = useState<EmployeeLoadStatus>("loading");
  const [employeeId, setEmployeeId] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [submittedAction, setSubmittedAction] = useState<AttendanceAction | null>(null);
  const [punctualityMessage, setPunctualityMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => String(employee.id) === employeeId) ?? null,
    [employeeId, employees]
  );

  const filteredEmployees = useMemo(() => {
    const query = filterQuery.trim().toLowerCase();
    if (!query) {
      return employees;
    }

    return employees.filter((employee) => {
      const haystack = `${employee.fullName} ${employee.department}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [employees, filterQuery]);

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

  useEffect(() => {
    let active = true;

    const loadEmployees = async () => {
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

        if (!active) {
          return;
        }

        setEmployees(data.employees);
        setEmployeeLoadStatus("ready");
      } catch (loadError) {
        console.error("Failed to load employees", loadError);
        if (active) {
          setEmployees([]);
          setEmployeeLoadStatus("error");
        }
      }
    };

    void loadEmployees();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    void requestLocation();
  }, []);

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
          data.error ??
            (action === "checkout"
              ? "Unable to submit check-out."
              : "Unable to submit check-in.")
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

  function resetForAnother(nextAction: AttendanceAction) {
    setSubmittedAt(null);
    setSubmittedAction(null);
    setPunctualityMessage(null);
    setStatusMessage(null);
    setError(null);
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
              {selectedEmployee?.fullName ?? "Employee"} {isCheckout ? "checked out" : "checked in"}{" "}
              at <span className="tabular-nums">{new Date(submittedAt).toLocaleTimeString()}</span>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record attendance</CardTitle>
        <CardDescription>Choose an action, select your name, and submit.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="rounded-lg border border-border bg-muted p-1">
            <div className="grid min-w-0 grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setAction("checkin")}
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
                onClick={() => setAction("checkout")}
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
            <label className="text-sm font-medium" htmlFor="employee-filter">
              Your name
            </label>

            {employees.length > 8 ? (
              <Input
                id="employee-filter"
                placeholder="Search employees..."
                value={filterQuery}
                onChange={(event) => setFilterQuery(event.target.value)}
                autoComplete="off"
                className="h-11"
              />
            ) : null}

            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                id="employee"
                name="employee"
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                required
                disabled={employeeLoadStatus !== "ready" || filteredEmployees.length === 0}
                className={`${selectClassName} appearance-none pl-10`}
              >
                <option value="">
                  {employeeLoadStatus === "loading"
                    ? "Loading employees..."
                    : employeeLoadStatus === "error"
                      ? "Unable to load employees"
                      : filteredEmployees.length === 0
                        ? "No employees found"
                        : "Select your name"}
                </option>
                {filteredEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.department
                      ? `${employee.fullName} — ${employee.department}`
                      : employee.fullName}
                  </option>
                ))}
              </select>
            </div>

            {employeeLoadStatus === "error" ? (
              <p className="text-sm text-destructive">
                Could not load the employee list. Refresh the page and try again.
              </p>
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
          </div>

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
              !employeeId
            }
            type="submit"
            className="h-12 w-full whitespace-nowrap text-base"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {action === "checkout" ? "Checking out..." : "Checking in..."}
              </>
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
