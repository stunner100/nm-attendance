"use client";

import { FormEvent, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, Variants, useReducedMotion } from "framer-motion";
import { MapPin, Clock, AlertTriangle, CheckCircle2, Loader2, User, Search } from "lucide-react";
import confetti from "canvas-confetti";

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

type CheckinFormProps = {
  scanToken: string;
};

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const jumpVariants: Variants = {
  jump: {
    y: [0, -30, 0, -15, 0, -5, 0],
    scale: [1, 1.1, 1, 1.05, 1, 1.02, 1],
    transition: {
      duration: 0.8,
      times: [0, 0.15, 0.3, 0.45, 0.6, 0.8, 1],
    },
  },
};

const shakeVariants: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, -5, 5, -2, 2, 0],
    transition: {
      duration: 0.6,
    },
  },
};

export function CheckinForm({ scanToken }: CheckinFormProps) {
  const shouldReduceMotion = useReducedMotion();
  const activeJumpVariants = shouldReduceMotion ? { jump: { opacity: 1 } } : jumpVariants;
  const activeShakeVariants = shouldReduceMotion ? { shake: { opacity: 1 } } : shakeVariants;

  const [name, setName] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("loading");
  const [employees, setEmployees] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [punctualityMessage, setPunctualityMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  
  // Autocomplete state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredEmployees = employees.filter(e => 
    e.toLowerCase().includes(name.toLowerCase())
  );

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
    if (!navigator.geolocation) {
      setGpsStatus("denied");
      setCoordinates(null);
      return;
    }

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
        timeout: 10_000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await fetch("/api/employees", { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as { names?: string[] };
        setEmployees(Array.isArray(data.names) ? data.names : []);
      } catch {
        setEmployees([]);
      }
    };

    void loadEmployees();
  }, []);

  useEffect(() => {
    if (submittedAt) {
      const timer = setTimeout(() => setIsAnimating(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [submittedAt]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Please enter a name.");
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
        
        // Haptic error
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
        return;
      }

      const data = (await response.json().catch(() => ({}))) as {
        timestamp?: string;
        punctualityMessage?: string;
      };
      
      const isLateResponse = data.punctualityMessage === "You are late";
      
      // Haptic feedback
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        if (isLateResponse) {
          navigator.vibrate([200, 100, 200]); // Warning buzz
        } else {
          navigator.vibrate([100]); // Success tick
        }
      }

      // Confetti for on-time
      if (!isLateResponse && !shouldReduceMotion) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#14b8a6', '#34d399']
        });
      }

      setSubmittedAt(data.timestamp ?? new Date().toISOString());
      setPunctualityMessage(
        typeof data.punctualityMessage === "string" ? data.punctualityMessage : null
      );
      setIsAnimating(true);
    } catch {
      setError("Network error while submitting check-in.");
    } finally {
      setSubmitting(false);
    }
  };

  const isLate = punctualityMessage === "You are late";
  const isOnTime = punctualityMessage === "You are on time";

  if (submittedAt) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full"
      >
        <Card className="overflow-hidden border-2 shadow-2xl">
          <motion.div
            variants={isOnTime ? activeJumpVariants : activeShakeVariants}
            animate={isAnimating ? (isOnTime ? "jump" : "shake") : ""}
            className={`relative ${
              isLate
                ? "bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-red-950 dark:via-orange-950 dark:to-amber-950/50"
                : "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950 dark:via-green-950 dark:to-teal-950/50"
            }`}
          >
            {/* Decorative circles */}
            <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 ${
              isLate ? "bg-red-400" : "bg-emerald-400"
            }`} />
            <div className={`absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-15 ${
              isLate ? "bg-orange-400" : "bg-teal-400"
            }`} />

            <CardHeader className="relative z-10 text-center pb-12 pt-10">
              <motion.div
                variants={itemVariants}
                className="mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  background: isLate
                    ? "linear-gradient(135deg, #ef4444 0%, #f97316 100%)"
                    : "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
                }}
              >
                <AnimatePresence mode="wait">
                  {isLate ? (
                    <motion.div
                      key="late"
                      initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0, rotate: -180 }}
                      animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, rotate: 0 }}
                      transition={{ type: "spring", duration: 0.6 }}
                    >
                      <AlertTriangle className="w-12 h-12 text-white" strokeWidth={2.5} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="ontime"
                      initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0, rotate: 180 }}
                      animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, rotate: 0 }}
                      transition={{ type: "spring", duration: 0.6 }}
                    >
                      <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div variants={itemVariants}>
                <CardTitle className={`text-3xl font-bold tracking-tight ${
                  isLate ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"
                }`}>
                  {isLate ? "You're Late!" : "You're On Time!"}
                </CardTitle>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-4">
                <div className="flex items-center justify-center gap-2 text-lg font-medium text-foreground">
                  <User className="w-5 h-5" />
                  <span>{name}</span>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-3">
                <CardDescription className="flex items-center justify-center gap-2 text-base dark:text-slate-300">
                  <Clock className="w-4 h-4" />
                  <span>Checked in at {new Date(submittedAt).toLocaleTimeString()}</span>
                </CardDescription>
              </motion.div>

              {punctualityMessage ? (
                <motion.div
                  variants={itemVariants}
                  animate={isAnimating && !shouldReduceMotion ? "pulse" : ""}
                  className={`mt-6 px-6 py-3 rounded-full inline-flex items-center gap-2 font-semibold text-sm shadow-md ${
                    isLate
                      ? "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-100 dark:border dark:border-red-800"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-100 dark:border dark:border-emerald-800"
                  }`}
                >
                  {isLate ? (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>Please remember to arrive on time tomorrow!</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Great job being punctual!</span>
                    </>
                  )}
                </motion.div>
              ) : null}

              <motion.div variants={itemVariants} className="mt-8 text-sm text-muted-foreground dark:text-slate-400">
                You may now close this tab.
              </motion.div>

            </CardHeader>
          </motion.div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full"
    >
      <Card className="overflow-hidden border-2 shadow-xl">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-100 dark:via-slate-200 dark:to-slate-100">
          <CardHeader className="text-center pb-8 pt-10">
            <motion.div
              variants={itemVariants}
              className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur flex items-center justify-center"
            >
              <Clock className="w-10 h-10 text-white dark:text-slate-900" />
            </motion.div>

            <motion.div variants={itemVariants}>
              <CardTitle className="text-2xl font-bold text-white dark:text-slate-900 tracking-tight">
                Office Check-In
              </CardTitle>
            </motion.div>

            <motion.div variants={itemVariants}>
              <CardDescription className="text-slate-300 dark:text-slate-600 mt-2 text-sm">
                Scan the QR code, enter your name, and submit your attendance
              </CardDescription>
            </motion.div>
          </CardHeader>
        </div>

        <CardContent className="pt-6 pb-8">
          {gpsStatus === "denied" ? (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto" }}
              className="mb-6 rounded-xl border-2 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 p-4"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">Location access unavailable</p>
                  <p className="mt-1 text-amber-700 dark:text-amber-300">
                    You can still submit your attendance without GPS verification.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : gpsStatus === "loading" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground py-4"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Requesting location access...</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 flex items-center gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800 p-4"
            >
              <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="text-sm text-emerald-700 dark:text-emerald-300">
                GPS location enabled and ready
              </span>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={onSubmit}>
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-sm font-semibold text-foreground" htmlFor="name">
                Full Name
              </label>
              
              <div className="relative" ref={wrapperRef}>
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (event.target.value.length > 0) {
                      setIsDropdownOpen(true);
                    } else {
                      setIsDropdownOpen(false);
                    }
                  }}
                  onFocus={() => {
                    if (employees.length > 0) setIsDropdownOpen(true);
                  }}
                  autoComplete="off"
                  required
                  className="pl-12 h-14 text-lg rounded-xl border-2 focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
                />
                
                {/* Custom Autocomplete Dropdown */}
                <AnimatePresence>
                  {isDropdownOpen && employees.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full mt-2 left-0 right-0 z-50 rounded-xl border bg-popover shadow-xl overflow-hidden"
                    >
                      <div className="max-h-60 overflow-y-auto p-1">
                        {filteredEmployees.length > 0 ? (
                          filteredEmployees.map((employee) => (
                            <div
                              key={employee}
                              onClick={() => {
                                setName(employee);
                                setIsDropdownOpen(false);
                              }}
                              className="flex items-center gap-2 px-4 py-3 text-sm rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Search className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-foreground">{employee}</span>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                            No matching employees found.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <AnimatePresence>
              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800 p-4"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <motion.div variants={itemVariants}>
              <Button
                disabled={submitting}
                type="submit"
                className="w-full h-14 text-lg font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Check In
                  </span>
                )}
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}