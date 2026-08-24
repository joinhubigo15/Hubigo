import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "hubigo_admin_session";
const PUBLIC_ADMIN_ROUTES = new Set(["/admin/login", "/admin/forgot-password", "/admin/reset-password"]);

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // www.findhubigo.com now serves the app directly (Railway custom domain + cert), but the
  // canonical host everywhere else (SITE_URL, sitemap, JSON-LD) is the bare apex — redirect here
  // so Google never sees the same content under two hostnames.
  if (hostname === "www.findhubigo.com") {
    const url = request.nextUrl.clone();
    url.hostname = "findhubigo.com";
    return NextResponse.redirect(url, 301);
  }
// 1. Skip middleware entirely for static assets, images, and system internal files
  const isStaticAsset = 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/static') ||
    pathname.includes('.') || // matches favicon.ico, images, sitemaps etc.
    pathname === '/';

  // 2. Only enforce restrictions if it's explicitly an API data route
  if (pathname.startsWith('/api/v1')) {
    
    // Block any request using the 'node' user agent
    const userAgent = request.headers.get("user-agent") || "";
    const isNodeAgent = userAgent.toLowerCase().includes("node");

    if (isNodeAgent) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Block requests that bypass Cloudflare proxy mapping headers
    if (!request.headers.get('cf-connecting-ip')) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
