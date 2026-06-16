import { CheckinForm } from "@/components/checkin-form";

export default function CheckinPage() {
  return (
    <div className="min-h-screen bg-muted">
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-8 sm:px-6">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">Abonten Technologies</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground">
            Office attendance
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Enter your name and record a check-in or check-out.
          </p>
        </div>

        <CheckinForm />
      </main>
    </div>
  );
}
