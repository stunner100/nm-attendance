import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";

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

  const session = await auth();
  if (session?.user.role === "admin") {
    redirect(callbackUrl);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">NM Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to manage attendance records.
        </p>
      </div>

      <LoginForm callbackUrl={callbackUrl} />
    </main>
  );
}
