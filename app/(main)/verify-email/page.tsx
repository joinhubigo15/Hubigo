"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Button from "@/app/components/ui/Button";
import { resendVerificationRequest, verifyEmailRequest } from "@/app/lib/api";
import { ApiClientError } from "@/app/lib/auth-context";

type Status = "verifying" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>(() => (token ? "verifying" : "error"));
  const [errorMsg, setErrorMsg] = useState<string | null>(() =>
    token ? null : "This verification link is missing its token."
  );
  const [resendEmail, setResendEmail] = useState("");
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) return;
    verifyEmailRequest(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setErrorMsg(
          err instanceof ApiClientError ? err.message : "Something went wrong. Please try again."
        );
      });
  }, [token]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    await resendVerificationRequest(resendEmail).catch(() => {});
    setResent(true);
  }

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-secondary-500">Verifying your email...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-sm text-center text-secondary-600 bg-success-light border border-success/20 rounded-[var(--radius-md)] px-4 py-6">
          Your email has been verified. You&apos;re all set.
        </div>
        <Link href="/login">
          <Button variant="primary" size="lg" className="w-full">
            Continue to Log In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-center text-secondary-600 bg-error-light border border-error/20 rounded-[var(--radius-md)] px-4 py-6">
        {errorMsg}
      </div>

      {resent ? (
        <p className="text-xs text-center text-secondary-500">
          If that email is registered and unverified, a new link is on its way.
        </p>
      ) : (
        <form onSubmit={handleResend} className="flex flex-col gap-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-secondary-500">
            Resend verification link
          </label>
          <input
            type="email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            required
            placeholder="name@domain.com"
            className="w-full px-3.5 py-2.5 bg-bg border border-border-light rounded-[var(--radius-md)] text-sm text-secondary outline-none focus:border-primary transition-colors"
          />
          <Button variant="outline" size="md" className="w-full">
            Resend Link
          </Button>
        </form>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="bg-white rounded-[var(--radius-2xl)] border border-border-light p-8 shadow-md flex flex-col gap-6">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-[var(--radius-md)] bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-xl font-bold text-secondary">
                Hub<span className="gradient-text">igo</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-secondary">Email Verification</h1>
          </div>

          <Suspense fallback={<div className="h-32" />}>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
