import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";

import { auth } from "@/auth";
import { LogoutButton } from "@/components/logout-button";
import { PrintButton } from "@/components/print-button";

export default async function AdminQrPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    redirect("/login?callbackUrl=/admin/qr");
  }

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000")
  ).replace(/\/$/, "");
  const checkinUrl = `${appUrl}/checkin`;
  const qrDataUrl = await QRCode.toDataURL(checkinUrl, {
    width: 400,
    errorCorrectionLevel: "H",
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Office QR Code</h1>
          <p className="text-sm text-muted-foreground">
            Print and place this code where employees can scan it.
          </p>
          <p className="text-xs text-muted-foreground">
            Signed in as {session.user.email}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            className="text-sm font-medium text-primary underline underline-offset-2"
            href="/admin/roster"
          >
            Manage roster
          </Link>
          <Link
            className="text-sm font-medium text-primary underline underline-offset-2"
            href="/admin"
          >
            Back to dashboard
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <Image
          src={qrDataUrl}
          alt="Attendance check-in QR code"
          width={400}
          height={400}
          unoptimized
          className="mx-auto h-auto w-full max-w-[400px]"
        />
        <p className="mt-4 break-all text-center text-sm text-muted-foreground">{checkinUrl}</p>
      </div>

      <PrintButton />
    </main>
  );
}
