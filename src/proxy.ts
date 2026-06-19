import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { isSignupOpen } from "@/lib/auth-users";
import { isValidAdminSession } from "@/lib/session";

type AuthenticatedRequest = NextRequest & {
  auth: Session | null;
};

function isProtectedPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export default auth((request: AuthenticatedRequest) => {
  const { pathname, search } = request.nextUrl;
  const isLoggedIn = isValidAdminSession(request.auth);
  const isLoginPage = pathname === "/login" || pathname.startsWith("/login/");
  const isSignupPage = pathname === "/signup";

  if (isProtectedPath(pathname) && !isLoggedIn) {
    if (isSignupOpen()) {
      const signupUrl = new URL("/signup", request.nextUrl);
      return NextResponse.redirect(signupUrl);
    }

    const callbackUrl = `${pathname}${search}`;
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin", request.nextUrl));
  }

  if (isSignupPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin", request.nextUrl));
  }

  if (isSignupPage && !isSignupOpen()) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/login", "/login/:path*", "/signup", "/admin", "/admin/:path*"],
};
