import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "hubigo_admin_session";
const PUBLIC_ADMIN_ROUTES = new Set(["/admin/login", "/admin/forgot-password", "/admin/reset-password"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const secret = process.env.ADMIN_JWT_SECRET;
  let isValidSession = false;

  if (token && secret) {
    try {
      await jwtVerify(token, new TextEncoder().encode(secret));
      isValidSession = true;
    } catch {
      isValidSession = false;
    }
  }

  const isPublicRoute = PUBLIC_ADMIN_ROUTES.has(pathname);

  if (!isValidSession && !isPublicRoute) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const res = NextResponse.redirect(loginUrl);
    if (token) res.cookies.delete(COOKIE_NAME); // stale/invalid token — clear it
    return res;
  }

  if (isValidSession && pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
