import { CheckinForm } from "@/components/checkin-form";

export default function CheckinPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50">
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="hidden max-w-2xl space-y-6 lg:block">
            <div className="inline-flex items-center rounded-full border border-emerald-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-emerald-900 shadow-sm backdrop-blur">
              Abonten Technologies
            </div>
            <div className="space-y-4">
              <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-slate-950">
                Quick attendance for the office.
              </h1>
              <p className="max-w-lg text-lg leading-8 text-slate-600">
                Enter your name and tap Check In or Check Out.
              </p>
            </div>

            <div className="grid max-w-xl gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-medium text-slate-500">Fast</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">One tap action</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-medium text-slate-500">Simple</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">Just your name</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-medium text-slate-500">Instant</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">See your status</p>
              </div>
            </div>
          </section>

          <div className="mx-auto w-full max-w-xl">
            <CheckinForm />
          </div>
        </div>
      </main>
    </div>
  );
}
