import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const COOKIE_NAME = "hubigo_admin_session";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (token) {
    await fetch(`${API_URL}/api/v1/admin/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null);
  }

  const res = NextResponse.json({ success: true, message: "Logged out", data: null });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
