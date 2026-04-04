function LoadingCard({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 ${className}`.trim()} />;
}

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <section>
        <LoadingCard className="h-8 w-64" />
        <LoadingCard className="mt-2 h-4 w-96" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="col-span-2 rounded-xl bg-slate-900 p-6">
          <LoadingCard className="h-4 w-32 bg-slate-700" />
          <LoadingCard className="mt-3 h-8 w-64 bg-slate-700" />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <LoadingCard className="h-20 bg-slate-700" />
            <LoadingCard className="h-20 bg-slate-700" />
            <LoadingCard className="h-20 bg-slate-700" />
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <LoadingCard className="h-5 w-40" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-1.5">
                <LoadingCard className="h-4 w-full" />
                <LoadingCard className="h-2 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="rounded-xl bg-white p-5 shadow">
            <div className="flex items-center justify-between">
              <LoadingCard className="h-4 w-20" />
              <LoadingCard className="h-8 w-8 rounded-lg" />
            </div>
            <LoadingCard className="mt-4 h-9 w-16" />
            <LoadingCard className="mt-2 h-4 w-32" />
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow">
          <LoadingCard className="h-6 w-44" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <LoadingCard key={index} className="h-14 w-full" />
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <LoadingCard className="h-6 w-40" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <LoadingCard key={index} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
