import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";
import { isSignupOpen } from "@/lib/auth-users";
import { isValidAdminSession } from "@/lib/session";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

function getSafeCallbackUrl(callbackUrl?: string): string {
  if (!callbackUrl || !callbackUrl.startsWith("/")) {
    return "/admin";
  }

  return callbackUrl;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = getSafeCallbackUrl(params.callbackUrl);
  const signupOpen = isSignupOpen();

  const session = await auth();
  if (isValidAdminSession(session)) {
    redirect(callbackUrl);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpg"
            alt="Abonten Technologies"
            className="mb-4 h-12 w-auto object-contain"
          />
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Abonten Technologies
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to manage HR operations and attendance.
          </p>
        </div>

        <LoginForm callbackUrl={callbackUrl} signupOpen={signupOpen} />
      </div>
    </main>
  );
}
