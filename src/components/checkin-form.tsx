"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
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

export function CheckinForm() {
  const [scanToken, setScanToken] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("loading");
  const [name, setName] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [employees, setEmployees] = useState<string[]>([]);
  const [employeesLoaded, setEmployeesLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [punctualityMessage, setPunctualityMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredEmployees = employees.filter((employee) =>
    employee.toLowerCase().includes(name.toLowerCase())
  );

  useEffect(() => {
    let active = true;

    const prepareScanToken = async () => {
      try {
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

        if (!active) {
          return;
        }

        setScanToken(data.scanToken);
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
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!submittedAt || punctualityMessage !== "You are on time") {
      return;
    }

    let active = true;

    const triggerConfetti = async () => {
      try {
        const confettiModule = await import("canvas-confetti");
        if (!active) {
          return;
        }

        confettiModule.default({
          particleCount: 42,
          spread: 68,
          origin: { y: 0.62 },
          colors: ["#10b981", "#14b8a6", "#34d399"],
        });
      } catch (confettiError) {
        console.error("Failed to load confetti", confettiError);
      }
    };

    const timer = window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          void triggerConfetti();
        });
      });
    }, 260);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [punctualityMessage, submittedAt]);

  async function loadEmployees() {
    if (employeesLoaded) {
      return;
    }

    try {
      const response = await fetch("/api/employees", { cache: "no-store" });
      if (!response.ok) {
        setEmployeesLoaded(true);
        return;
      }

      const data = (await response.json()) as { names?: string[] };
      setEmployees(Array.isArray(data.names) ? data.names : []);
    } catch {
      setEmployees([]);
    } finally {
      setEmployeesLoaded(true);
    }
  }

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
      setError("Check-in is not ready yet. Wait a moment and try again.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setIsDropdownOpen(false);

    try {
      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          scanToken,
          latitude: coordinates?.lat ?? null,
          longitude: coordinates?.lng ?? null,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? "Unable to submit check-in.");
        return;
      }

      const data = (await response.json().catch(() => ({}))) as {
        timestamp?: string;
        punctualityMessage?: string;
      };

      setPunctualityMessage(
        typeof data.punctualityMessage === "string" ? data.punctualityMessage : null
      );
      setSubmittedAt(data.timestamp ?? new Date().toISOString());
    } catch {
      setError("Network error while submitting check-in.");
    } finally {
      setSubmitting(false);
    }
  }

  const isLate = punctualityMessage === "You are late";

  if (submittedAt) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="overflow-hidden border-0 shadow-xl">
          <div
            className={
              isLate
                ? "relative bg-gradient-to-br from-orange-50 via-red-50 to-white"
                : "relative bg-gradient-to-br from-emerald-50 via-teal-50 to-white"
            }
          >
            <CardHeader className="relative z-10 px-6 pb-12 pt-8 text-center sm:px-10">
              <div
                className={
                  isLate
                    ? "mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg"
                    : "mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg"
                }
              >
                {isLate ? (
                  <AlertTriangle className="h-10 w-10 text-white" strokeWidth={2.4} />
                ) : (
                  <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.4} />
                )}
              </div>

              <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {isLate ? "You are late" : "You are on time"}
              </CardTitle>
              <CardDescription className="mt-3 text-base text-slate-600 sm:text-lg">
                {name} checked in at {new Date(submittedAt).toLocaleTimeString()}
              </CardDescription>

              <div
                className={
                  isLate
                    ? "animate-in zoom-in-95 mt-6 inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/85 px-5 py-2.5 text-sm font-semibold text-red-700 shadow-sm duration-500"
                    : "animate-in zoom-in-95 mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/85 px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm duration-500"
                }
              >
                {isLate ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>{punctualityMessage}</span>
              </div>

              <p className="mt-8 text-sm text-slate-500">You may now close this tab.</p>
            </CardHeader>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-xl">
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
        <CardHeader className="relative z-10 px-6 pb-8 pt-8 text-center sm:px-8 sm:pt-9">
          <div className="mx-auto mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-3xl bg-white/10 shadow-inner">
            <Clock className="h-9 w-9 text-white" />
          </div>
          <CardTitle className="text-3xl font-semibold tracking-tight text-white">
            Office Check-In
          </CardTitle>
          <CardDescription className="mt-3 text-base leading-7 text-slate-300">
            Enter your name and tap Check In.
          </CardDescription>
        </CardHeader>
      </div>

      <CardContent className="space-y-5 px-5 py-6 sm:px-8 sm:py-8">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900" htmlFor="name">
              Full Name
            </label>

            <div className="relative" ref={wrapperRef}>
              <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                id="name"
                name="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (event.target.value.length > 0 && employeesLoaded) {
                    setIsDropdownOpen(true);
                  } else {
                    setIsDropdownOpen(false);
                  }
                }}
                onFocus={() => {
                  void loadEmployees();
                  if (employees.length > 0) {
                    setIsDropdownOpen(true);
                  }
                }}
                autoComplete="off"
                required
                className="h-14 rounded-2xl border-slate-200 bg-white pl-12 text-lg shadow-sm transition-colors focus:border-emerald-400"
              />

              {isDropdownOpen && employees.length > 0 ? (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="max-h-60 overflow-y-auto p-1.5">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((employee) => (
                        <button
                          key={employee}
                          type="button"
                          onClick={() => {
                            setName(employee);
                            setIsDropdownOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm transition-colors hover:bg-slate-50"
                        >
                          <Search className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-800">{employee}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-sm text-slate-500">
                        No matching names found.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900">Add location</p>
                <p className="mt-1 text-sm text-slate-600">
                  Optional. Your GPS coordinates will be attached to this check-in.
                </p>
              </div>

              <Button
                type="button"
                variant={gpsStatus === "granted" ? "secondary" : "outline"}
                onClick={requestLocation}
                disabled={gpsStatus === "loading"}
                className="min-w-40"
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
                    Use my location
                  </>
                )}
              </Button>
            </div>
          </div>

          {error ? (
            <div className="animate-in fade-in slide-in-from-top-1 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 duration-300">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-medium">{error}</p>
              </div>
            </div>
          ) : null}

          <Button
            disabled={submitting || tokenStatus !== "ready"}
            type="submit"
            className="h-14 w-full rounded-2xl bg-slate-950 text-lg font-semibold shadow-lg shadow-slate-200 transition-transform hover:translate-y-[-1px] hover:bg-slate-900"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Checking in...
              </>
            ) : tokenStatus === "ready" ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Check In
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
