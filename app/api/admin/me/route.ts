import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const COOKIE_NAME = "hubigo_admin_session";

/** Lets client components hydrate admin state without ever reading the httpOnly cookie
 * themselves — this route reads it server-side and asks the backend to validate the session. */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
  }

  const backendRes = await fetch(`${API_URL}/api/v1/admin/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await backendRes.json().catch(() => null);

  if (!backendRes.ok || !data?.success) {
    const res = NextResponse.json(data ?? { success: false, message: "Session expired" }, { status: backendRes.status });
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  return NextResponse.json(data);
}
