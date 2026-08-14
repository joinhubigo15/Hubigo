import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const COOKIE_NAME = "hubigo_admin_session";
const COOKIE_MAX_AGE_SECONDS = Number(process.env.ADMIN_SESSION_TTL_HOURS ?? "12") * 60 * 60;

/**
 * Proxies admin login to the backend and, on success, sets an httpOnly cookie on the frontend's
 * own origin — middleware.ts (Edge runtime) can only see cookies set on localhost:3000, not
 * ones the backend (localhost:4000) would set, so this Route Handler is what makes real
 * server-side route protection possible instead of a client-side-only check.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
  }

  const backendRes = await fetch(`${API_URL}/api/v1/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json().catch(() => null);

  if (!backendRes.ok || !data?.success) {
    return NextResponse.json(data ?? { success: false, message: "Something went wrong" }, { status: backendRes.status });
  }

  const res = NextResponse.json(data);
  res.cookies.set(COOKIE_NAME, data.data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return res;
}
