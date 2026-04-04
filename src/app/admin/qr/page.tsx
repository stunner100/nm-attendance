import Link from "next/link";
import { Clock, QrCode, Printer } from "lucide-react";
import QRCode from "qrcode";

import { PrintButton } from "@/components/print-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function AdminQrPage() {
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
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
          <QrCode className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Check-in QR Code</h1>
          <p className="text-sm text-slate-500">Print and display this code at your office entrance.</p>
        </div>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <img
            src={qrDataUrl}
            alt="Attendance check-in QR code"
            className="h-auto w-full max-w-[300px]"
          />
          <p className="break-all text-center text-sm text-slate-500">{checkinUrl}</p>
          <PrintButton />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link href="/admin/attendance" className="flex-1">
          <Button variant="outline" className="w-full">
            <Clock className="mr-2 h-4 w-4" />
            View Attendance
          </Button>
        </Link>
        <Link href="/admin" className="flex-1">
          <Button variant="outline" className="w-full">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
