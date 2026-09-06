"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f8fafc" }}>
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ textAlign: "center", maxWidth: "420px", width: "100%" }}>
            <div style={{ width: "3rem", height: "3rem", borderRadius: "1rem", backgroundColor: "#f3e8ff", color: "#9333ea", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>Something went wrong</h1>
            <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              A temporary issue occurred loading this page. Please try refreshing or go back to home.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                onClick={() => reset()}
                style={{ flex: 1, padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "#9333ea", color: "#ffffff", border: "none", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }}
              >
                Refresh Page
              </button>
              <a
                href="/"
                style={{ flex: 1, padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "#e2e8f0", color: "#334155", textDecoration: "none", fontWeight: 700, fontSize: "0.875rem", display: "inline-block" }}
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
