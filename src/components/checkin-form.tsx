"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  LogOut,
  MapPin,
  Search,
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

type Coordinates = {
  lat: number;
  lng: number;
};

type TokenStatus = "loading" | "ready" | "error";
type AttendanceAction = "checkin" | "checkout";

export function CheckinForm() {
  const [action, setAction] = useState<AttendanceAction>("checkin");
  const [scanToken, setScanToken] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("loading");
  const [name, setName] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [employees, setEmployees] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [submittedAction, setSubmittedAction] = useState<AttendanceAction | null>(null);
  const [punctualityMessage, setPunctualityMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredEmployees = employees.filter((employee) =>
    employee.toLowerCase().includes(name.toLowerCase())
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

  useEffect(() => {
    void requestLocation();
  }, []);

  useEffect(() => {
    const query = name.trim();
    if (query.length < 2) {
      setEmployees([]);
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(
            `/api/checkin/suggest?q=${encodeURIComponent(query)}`,
            { cache: "no-store" }
          );
          if (!response.ok || !active) {
            return;
          }

          const data = (await response.json()) as { names?: string[] };
          if (active) {
            setEmployees(Array.isArray(data.names) ? data.names : []);
          }
        } catch {
          if (active) {
            setEmployees([]);
          }
        }
      })();
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [name]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function requestLocation() {
    if (gpsStatus === "loading" || gpsStatus === "granted") {
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus("denied");
      setCoordinates(null);
      return;
    }

    setGpsStatus("loading");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGpsStatus("granted");
      },
      () => {
        setGpsStatus("denied");
        setCoordinates(null);
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

    if (!name.trim()) {
      setError("Please enter a name.");
      return;
    }

    if (!scanToken) {
      setError("Attendance action is not ready yet. Wait a moment and try again.");
      return;
    }

    if (action === "checkin" && (gpsStatus !== "granted" || !coordinates)) {
      setError("Location access is required. Please allow location access and try again.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setIsDropdownOpen(false);

    try {
      const endpoint = action === "checkout" ? "/api/checkout" : "/api/checkin";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          scanToken,
          ...(action === "checkin"
            ? {
                latitude: coordinates?.lat ?? null,
                longitude: coordinates?.lng ?? null,
              }
            : {}),
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
              {name} {isCheckout ? "checked out" : "checked in"} at{" "}
              <span className="tabular-nums">{new Date(submittedAt).toLocaleTimeString()}</span>
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
        <CardDescription>Choose an action, enter your name, and submit.</CardDescription>
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
            <label className="text-sm font-medium" htmlFor="name">
              Full name
            </label>

            <div className="relative" ref={wrapperRef}>
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                name="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (event.target.value.trim().length >= 2) {
                    setIsDropdownOpen(true);
                  } else {
                    setIsDropdownOpen(false);
                  }
                }}
                onFocus={() => {
                  if (name.trim().length >= 2 && employees.length > 0) {
                    setIsDropdownOpen(true);
                  }
                }}
                autoComplete="off"
                required
                className="h-12 pl-10"
              />

              {isDropdownOpen && employees.length > 0 ? (
                <div className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-lg border border-border bg-card shadow-md">
                  <div className="max-h-60 overflow-y-auto p-1">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((employee) => (
                        <button
                          key={employee}
                          type="button"
                          onClick={() => {
                            setName(employee);
                            setIsDropdownOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-[background-color] hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                        >
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{employee}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-sm text-muted-foreground">
                        No matching names found.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Location {action === "checkin" ? <span className="text-destructive">*</span> : null}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {action === "checkout"
                    ? "Optional for check-out. You can proceed without GPS."
                    : gpsStatus === "granted"
                      ? "Your GPS coordinates will be attached to this check-in."
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
            disabled={submitting || tokenStatus !== "ready"}
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
