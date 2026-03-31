import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

import { auth } from "@/auth";

type AuthenticatedRequest = NextRequest & {
  auth: Session | null;
};

function isAdminSession(session: Session | null): boolean {
  return session?.user.role === "admin";
}

function isProtectedPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export default auth((request: AuthenticatedRequest) => {
  const { pathname, search } = request.nextUrl;
  const isLoggedIn = isAdminSession(request.auth);
  const isLoginPage = pathname === "/login";

  if (isProtectedPath(pathname) && !isLoggedIn) {
    const callbackUrl = `${pathname}${search}`;
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin", request.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/login", "/admin/:path*"],
};
