import { redirect } from "next/navigation";

import { SignupForm } from "@/components/signup-form";
import { auth } from "@/auth";
import { isSignupOpen, listEmployeesForSignup } from "@/lib/auth-users";
import { isValidAdminSession } from "@/lib/session";

export default async function SignupPage() {
  if (!isSignupOpen()) {
    redirect("/login");
  }

  const session = await auth();
  if (isValidAdminSession(session)) {
    redirect("/admin");
  }

  const employees = await listEmployeesForSignup();

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
            Set up your login
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a personal account with your email, employee profile, and job level. You will
            keep full access to the same HR workspace.
          </p>
        </div>

        <SignupForm employees={employees} />
      </div>
    </main>
  );
}
