# Abonten Technologies HR System

QR-based attendance check-in and admin HR operations platform built with Next.js, NextAuth, and Postgres.

## Features

- Public attendance page supporting both check-in and check-out.
- GPS capture for check-in when the browser allows it.
- Server-enforced one-time check-in scan tokens (30-minute token validity, single submission per scan).
- Admin HR dashboard with KPI cards and key alerts.
- HR modules for recruitment, headcount/org, compliance, payroll/leave, performance, training/onboarding.
- CSV import workflows (dry-run + commit) for employees, recruitment, leave, and payroll.
- Attendance module remains available inside `/admin`.

## Environment

Set these variables in `.env.local` and in production:

- `DATABASE_URL`
- `AUTH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_APP_URL` for a stable QR destination
- `ALLOWED_EMPLOYEE_NAMES` (optional) for pre-seeding roster autocomplete names

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Routes

- `/checkin` public attendance form
- `/login` admin sign-in
- `/admin` HR overview dashboard + attendance module
- `/admin/recruitment`
- `/admin/headcount`
- `/admin/compliance`
- `/admin/payroll-leave`
- `/admin/performance`
- `/admin/training`
- `/admin/imports`
- `/admin/roster` roster autocomplete management
- `/admin/qr` printable QR code

## Notes

- Check-in and check-out timestamps are recorded on the server.
- The HR admin routes and HR APIs require a signed-in admin session.
- Public check-in accepts any name; roster is convenience metadata only.
