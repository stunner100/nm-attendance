import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { getAdminContactEmail } from "@/lib/auth-contact";
import { isEmailConfigured } from "@/lib/email";
import { isValidAdminSession } from "@/lib/session";

export default async function ForgotPasswordPage() {
  const session = await auth();
  if (isValidAdminSession(session)) {
    redirect("/admin");
  }

  const adminEmail = getAdminContactEmail();
  const emailConfigured = isEmailConfigured();

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
            Account recovery
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Need help signing in? Use the options below to reach your administrator.
          </p>
        </div>

        <ForgotPasswordForm adminEmail={adminEmail} emailConfigured={emailConfigured} />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
