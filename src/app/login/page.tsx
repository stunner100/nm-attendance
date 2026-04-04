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
  if (session?.user?.role === "admin") {
    redirect(callbackUrl);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-emerald-50">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600">
            <span className="text-lg font-bold text-white">NM</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            NM HR System
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage HR operations and attendance.
          </p>
        </div>

        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </main>
  );
}
