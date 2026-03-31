import { CheckinForm } from "@/components/checkin-form";
import { issueCheckinScanToken } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  const scanToken = await issueCheckinScanToken();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Attendance Check-In</h1>
        <p className="text-sm text-muted-foreground">
          Scan, enter your name, and submit.
        </p>
      </div>

      <CheckinForm scanToken={scanToken} />
    </main>
  );
}
