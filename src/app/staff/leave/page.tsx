import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AdminFormAlert } from "@/components/hr/admin-form-alert";
import { StatusBadge } from "@/components/hr/status-badge";
import { StaffLeaveRequestForm } from "@/components/staff/staff-leave-request-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createLeaveRequest,
  listEmployeeLeaveRequests,
} from "@/lib/hr-db";
import {
  redirectWithFormError,
  redirectWithFormSuccess,
  readFormError,
  readFormSuccess,
} from "@/lib/hr/form-actions";
import { humanizeLabel } from "@/lib/labels";
import {
  HR_LEAVE_REQUEST_CATEGORIES,
  type HRLeaveRequestCategory,
} from "@/lib/types";

type StaffLeavePageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

const requestTypeOptions = [
  "Annual leave",
  "Sick leave",
  "Emergency leave",
  "Family responsibility",
  "Late arrival",
];

function daysBetweenInclusive(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1;
}

async function submitStaffRequestAction(formData: FormData): Promise<void> {
  "use server";

  const session = await auth();
  const employeeId = Number(session?.user?.employeeId ?? "");
  const submittedByEmail = session?.user?.email?.trim().toLowerCase() || null;

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/staff/leave")}`);
  }
  if (!Number.isFinite(employeeId) || employeeId <= 0) {
    redirectWithFormError("/staff/leave", "Your login is not linked to an employee profile.");
  }

  const requestCategory = String(formData.get("requestCategory") ?? "").trim();
  const leaveType = String(formData.get("leaveType") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDateInput = String(formData.get("endDate") ?? "").trim();
  const lateArrivalTime = String(formData.get("lateArrivalTime") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const coveragePlan = String(formData.get("coveragePlan") ?? "").trim();
  const contactNumber = String(formData.get("contactNumber") ?? "").trim();

  if (
    !HR_LEAVE_REQUEST_CATEGORIES.includes(
      requestCategory as HRLeaveRequestCategory
    )
  ) {
    redirectWithFormError("/staff/leave", "Select leave or late arrival.");
  }
  if (!startDate || !reason) {
    redirectWithFormError("/staff/leave", "Date and reason are required.");
  }

  const isLateArrival = requestCategory === "late_arrival";
  const endDate = isLateArrival ? startDate : endDateInput || startDate;
  const days = isLateArrival ? 0.25 : daysBetweenInclusive(startDate, endDate);

  if (!isLateArrival && days <= 0) {
    redirectWithFormError("/staff/leave", "Select a valid leave date range.");
  }
  if (isLateArrival && !lateArrivalTime) {
    redirectWithFormError("/staff/leave", "Expected arrival time is required for late arrival.");
  }

  await createLeaveRequest({
    employeeId,
    leaveType: isLateArrival ? "Late arrival" : leaveType || "Leave",
    requestCategory: requestCategory as HRLeaveRequestCategory,
    startDate,
    endDate,
    lateArrivalTime: isLateArrival ? lateArrivalTime : null,
    days,
    status: "pending",
    reason,
    coveragePlan: coveragePlan || null,
    contactNumber: contactNumber || null,
    submittedByEmail,
    source: "staff_self_service",
  });

  revalidatePath("/staff/leave");
  revalidatePath("/admin/payroll-leave");
  revalidatePath("/admin/attendance");
  redirectWithFormSuccess("/staff/leave", "Request submitted for HR approval.");
}

export default async function StaffLeavePage({ searchParams }: StaffLeavePageProps) {
  const params = await searchParams;
  const session = await auth();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/staff/leave")}`);
  }

  const employeeId = Number(session.user.employeeId ?? "");
  const requests =
    Number.isFinite(employeeId) && employeeId > 0
      ? await listEmployeeLeaveRequests(employeeId, { limit: 10 })
      : [];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Staff self-service</p>
          <h1 className="text-2xl font-medium text-foreground">Leave and Late Arrival</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/checkin">Record attendance</Link>
        </Button>
      </div>

      <AdminFormAlert message={readFormError(params)} />
      <AdminFormAlert message={readFormSuccess(params)} variant="success" />

      {!Number.isFinite(employeeId) || employeeId <= 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Employee profile required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your account is signed in, but it is not linked to an active employee profile.
              HR needs to link your login before you can submit requests.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Card>
            <CardHeader>
              <CardTitle>Submit request</CardTitle>
            </CardHeader>
            <CardContent>
              <StaffLeaveRequestForm
                action={submitStaffRequestAction}
                requestTypeOptions={requestTypeOptions}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent requests</CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No requests submitted yet.</p>
              ) : (
                <div className="divide-y divide-[var(--color-rule)] rounded-[var(--radius-md)] border border-[var(--color-rule)]">
                  {requests.map((request) => (
                    <div className="space-y-1 p-3" key={request.id}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">
                          {request.leave_type}
                        </p>
                        <StatusBadge status={request.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {humanizeLabel(request.request_category)} · {request.start_date}
                        {request.end_date !== request.start_date ? ` to ${request.end_date}` : ""}
                      </p>
                      {request.reviewer_note ? (
                        <p className="text-xs text-muted-foreground">
                          HR note: {request.reviewer_note}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
