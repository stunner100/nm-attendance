"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ForgotPasswordFormProps = {
  adminEmail: string | null;
  emailConfigured: boolean;
};

export function ForgotPasswordForm({
  adminEmail,
  emailConfigured,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(payload.error ?? "Unable to submit your request. Please try again.");
        return;
      }

      setSuccess(
        payload.message ??
          "If an account exists for that email, your request has been received."
      );
      setEmail("");
    } catch {
      setError("Unable to submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Password resets are handled by your HR administrator. Contact them with your work
            email and employee name so they can verify your identity and issue a new password.
          </p>
          {adminEmail ? (
            <p>
              Administrator contact:{" "}
              <a
                className="font-medium text-foreground underline-offset-4 hover:underline"
                href={`mailto:${adminEmail}?subject=${encodeURIComponent("Password reset request")}`}
              >
                {adminEmail}
              </a>
            </p>
          ) : (
            <p>Ask your HR or IT team for the administrator contact for this system.</p>
          )}
        </div>

        {emailConfigured ? (
          <form className="space-y-4 border-t border-border pt-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="reset-email">
                Your work email
              </label>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            {error ? (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                {success}
              </p>
            ) : null}

            <Button className="h-11 w-full whitespace-nowrap" type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Request password reset"}
            </Button>

            <p className="text-xs text-muted-foreground">
              Submitting notifies your administrator. You will not receive an automatic reset link.
            </p>
          </form>
        ) : null}

        <Button asChild className="h-11 w-full whitespace-nowrap" type="button" variant="outline">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
