import { CheckinForm } from "@/components/checkin-form";

export default function CheckinPage() {
  return (
    <div className="min-h-screen bg-muted">
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-8 sm:px-6">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">Abonten Technologies</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground">
            Record attendance
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Choose check-in or check-out, select your name, and submit.
          </p>
        </div>

        <CheckinForm />
      </main>
    </div>
  );
}
