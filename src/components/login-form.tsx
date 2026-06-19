"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type LoginFormProps = {
  callbackUrl: string;
  signupOpen?: boolean;
};

export function LoginForm({ callbackUrl, signupOpen = false }: LoginFormProps) {
  const router = useRouter();
  const safeCallbackUrl = useMemo(
    () => (callbackUrl.startsWith("/") ? callbackUrl : "/admin"),
    [callbackUrl]
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: safeCallbackUrl,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      router.push(result?.url ?? safeCallbackUrl);
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Link
                className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                href="/login/forgot-password"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="pr-10"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error ? (
            <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button className="h-11 w-full whitespace-nowrap" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>

          {signupOpen ? (
            <Button
              asChild
              className="h-11 w-full whitespace-nowrap"
              type="button"
              variant="outline"
            >
              <Link href="/signup">Create your account</Link>
            </Button>
          ) : null}

          <p className="text-center text-xs text-muted-foreground">
            {signupOpen
              ? "First time here? Use Create your account above to set up your login."
              : "Contact your system administrator for login credentials."}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
