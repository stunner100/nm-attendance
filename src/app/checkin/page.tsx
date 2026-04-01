import { CheckinForm } from "@/components/checkin-form";
import { issueCheckinScanToken } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  const scanToken = await issueCheckinScanToken();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Background ambient glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 dark:bg-teal-500/5 blur-[120px] pointer-events-none" />
      
      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
      />

      <main className="relative z-10 w-full max-w-xl flex-1 flex flex-col justify-center px-4 py-10 sm:px-6">
        <CheckinForm scanToken={scanToken} />
      </main>
    </div>
  );
}

