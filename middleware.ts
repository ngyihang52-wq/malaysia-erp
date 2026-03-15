import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("erp_token")?.value;
  const { pathname } = request.nextUrl;

  // If no token and trying to access protected routes, redirect to NexaCommerce landing
  if (!token && !pathname.startsWith("/login") && !pathname.startsWith("/api/auth")) {
    return NextResponse.redirect(new URL("http://localhost:5173"));
  }

  // If has token and on login page, redirect to dashboard
  if (token && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
