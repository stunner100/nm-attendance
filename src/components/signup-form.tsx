"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HR_JOB_LEVELS } from "@/lib/types";
import { humanizeLabel } from "@/lib/labels";

export type SignupEmployeeOption = {
  id: number;
  fullName: string;
  department: string;
};

type SignupFormProps = {
  employees: SignupEmployeeOption[];
};

export function SignupForm({ employees }: SignupFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [jobLevel, setJobLevel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jobLevelOptions = useMemo(
    () =>
      HR_JOB_LEVELS.map((level) => ({
        value: level,
        label: humanizeLabel(level),
      })),
    []
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          employeeId: Number(employeeId),
          jobLevel,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to create account.");
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/admin",
      });

      if (signInResult?.error) {
        setError("Account created, but sign-in failed. Use the login page.");
        return;
      }

      router.push(signInResult?.url ?? "/admin");
      router.refresh();
    } catch {
      setError("Unable to create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="signup-email">
              Work email
            </label>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="signup-employee">
              I am
            </label>
            <select
              id="signup-employee"
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              required
              className="flex h-9 w-full rounded-[var(--radius-input)] border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/30"
            >
              <option value="">Select your name</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName} · {employee.department}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="signup-job-level">
              Job level
            </label>
            <select
              id="signup-job-level"
              value={jobLevel}
              onChange={(event) => setJobLevel(event.target.value)}
              required
              className="flex h-9 w-full rounded-[var(--radius-input)] border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/30"
            >
              <option value="">Select your level</option>
              {jobLevelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="signup-password">
              Password
            </label>
            <Input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="signup-confirm-password">
              Confirm password
            </label>
            <Input
              id="signup-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={submitting || employees.length === 0}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>

          {employees.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              All active employee profiles already have accounts. Contact HR if you need help.
            </p>
          ) : null}

          <p className="text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link href="/login" className="font-medium text-[var(--color-link)] hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
