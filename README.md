# NM Attendance

QR-based attendance check-in built with Next.js, NextAuth, and Postgres.

## Features

- Public check-in page with GPS capture when the browser allows it.
- Admin dashboard for reviewing attendance by date.
- Admin roster page for managing approved employee names.
- QR code page for printing the public check-in URL.
- Server-side roster checks so only approved names can submit attendance.

## Environment

Set these variables in `.env.local` and in production:

- `DATABASE_URL`
- `AUTH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_APP_URL` for a stable QR destination
- `ALLOWED_EMPLOYEE_NAMES` for a comma-, semicolon-, or newline-separated roster

If `ALLOWED_EMPLOYEE_NAMES` is omitted, the app will use existing roster entries already in the database.
If the roster table is empty, populate it before sending employees to the check-in page.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Routes

- `/checkin` public attendance form
- `/login` admin sign-in
- `/admin` attendance dashboard
- `/admin/roster` approved roster management
- `/admin/qr` printable QR code

## Notes

- Attendance timestamps are recorded on the server.
- The admin routes and attendance API require a signed-in admin session.
