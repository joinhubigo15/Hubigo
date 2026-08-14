import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const COOKIE_NAME = "hubigo_admin_session";

export const dynamic = "force-dynamic";

async function proxy(req: NextRequest, path: string[]) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
  }

  const backendPath = `/api/v1/admin/${path.join("/")}`;
  const search = req.nextUrl.search;
  const backendUrl = `${API_URL}${backendPath}${search}`;

  const method = req.method;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

  let body: BodyInit | undefined;
  if (method === "POST" || method === "PATCH" || method === "PUT" || method === "DELETE") {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.startsWith("multipart/form-data")) {
      headers["Content-Type"] = contentType;
      body = await req.arrayBuffer();
    } else if (req.body) {
      const text = await req.text();
      if (text) {
        headers["Content-Type"] = "application/json";
        body = text;
      }
    }
  }

  const backendRes = await fetch(backendUrl, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  const data = await backendRes.json().catch(() => null);
  return NextResponse.json(data ?? { success: false, message: "Invalid response from server" }, {
    status: backendRes.status,
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(req, path);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(req, path);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(req, path);
}
