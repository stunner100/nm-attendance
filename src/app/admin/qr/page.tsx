import Link from "next/link";
import { Clock } from "lucide-react";
import QRCode from "qrcode";

import { PrintButton } from "@/components/print-button";
import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
      <AdminPageIntro
        description="Print and display this code at your office entrance."
      />

      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <img
            src={qrDataUrl}
            alt="Attendance check-in QR code"
            className="h-auto w-full max-w-[300px]"
          />
          <p className="break-all text-center text-sm text-muted-foreground">{checkinUrl}</p>
          <PrintButton />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link href="/admin/attendance" className="flex-1">
          <Button variant="outline" className="w-full">
            <Clock className="mr-2 h-4 w-4" />
            View attendance
          </Button>
        </Link>
        <Link href="/admin" className="flex-1">
          <Button variant="outline" className="w-full">
            Back to overview
          </Button>
        </Link>
      </div>
    </div>
  );
}
