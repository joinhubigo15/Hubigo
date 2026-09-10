import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function proxyV1Request(req: NextRequest, paramsPromise: Promise<{ path: string[] }>) {
  const { path } = await paramsPromise;
  const rawBackend = (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).trim();

  const currentOrigin = req.nextUrl.origin;
  const isVercel = process.env.VERCEL === "1";

  // Prevent self-referencing infinite loops if backend URL is not set or points back to this frontend
  const isSelfReferencing =
    !rawBackend ||
    rawBackend.includes(req.nextUrl.hostname) ||
    rawBackend.startsWith("/") ||
    (isVercel && rawBackend.includes("localhost"));

  if (isSelfReferencing) {
    if (path[0] === "auth" && path[1] === "google") {
      return NextResponse.redirect(new URL("/login?error=google_auth_failed", currentOrigin));
    }
    return NextResponse.json(
      {
        success: false,
        message: "Backend API service URL is not configured.",
        error: { code: "BACKEND_NOT_CONFIGURED" },
      },
      { status: 503 }
    );
  }

  const backendOrigin = rawBackend.replace(/\/$/, "");
  const targetUrl = `${backendOrigin}/api/v1/${path.join("/")}${req.nextUrl.search}`;

  // Forward incoming headers, omitting host to avoid header mismatch
  const reqHeaders = new Headers(req.headers);
  reqHeaders.delete("host");

  let body: ArrayBuffer | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = await req.arrayBuffer();
    } catch {
      // no body
    }
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers: reqHeaders,
      body: body && body.byteLength > 0 ? body : undefined,
      redirect: "manual",
      cache: "no-store",
    });

    // Handle backend redirects (e.g. Passport Google OAuth 302 -> accounts.google.com)
    if ([301, 302, 303, 307, 308].includes(backendRes.status)) {
      const location = backendRes.headers.get("location");
      if (location) {
        const redirectRes = NextResponse.redirect(new URL(location, req.url), backendRes.status);
        const setCookie = backendRes.headers.get("set-cookie");
        if (setCookie) {
          redirectRes.headers.set("set-cookie", setCookie);
        }
        return redirectRes;
      }
    }

    const resHeaders = new Headers();
    backendRes.headers.forEach((val, key) => {
      if (key.toLowerCase() !== "transfer-encoding") {
        resHeaders.append(key, val);
      }
    });

    const resBuffer = await backendRes.arrayBuffer();
    return new NextResponse(resBuffer, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: resHeaders,
    });
  } catch (error) {
    console.error(`[/api/v1 proxy error] ${req.method} ${targetUrl}:`, error);

    if (path[0] === "auth" && path[1] === "google") {
      return NextResponse.redirect(new URL("/login?error=google_auth_failed", req.url));
    }

    return NextResponse.json(
      {
        success: false,
        message: "API service is temporarily unavailable. Please try again shortly.",
        error: { code: "BACKEND_UNAVAILABLE" },
      },
      { status: 503 }
    );
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyV1Request(req, context.params);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyV1Request(req, context.params);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyV1Request(req, context.params);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyV1Request(req, context.params);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyV1Request(req, context.params);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
