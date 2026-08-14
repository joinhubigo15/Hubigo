"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, CheckCircle2, FileText, FileCheck, Clock, XCircle, AlertCircle, RefreshCw, Award, Building2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth, ApiClientError } from "@/app/lib/auth-context";
import {
  getMyBusinessRequest,
  getClaimStatusRequest,
  getVerificationStatusRequest,
  submitBusinessVerificationRequest,
  type OwnedBusiness,
  type ClaimStatus,
  type VerificationStatus,
} from "@/app/lib/api";

const METHOD_LABEL: Record<string, string> = {
  document: "Business Document Upload",
  phone: "Mobile OTP (Legacy)",
  gst: "GST Registration",
  msme: "MSME / Udyam Registration",
};

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
  };
  const icons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="w-3.5 h-3.5" />,
    APPROVED: <CheckCircle2 className="w-3.5 h-3.5" />,
    REJECTED: <XCircle className="w-3.5 h-3.5" />,
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border",
        styles[status] || "bg-slate-100 text-slate-600 border-slate-200"
      )}
    >
      {icons[status]}
      {status}
    </span>
  );
}

export default function BusinessVerificationPage() {
  const { accessToken } = useAuth();

  const [business, setBusiness] = useState<OwnedBusiness | null>(null);
  const [claim, setClaim] = useState<ClaimStatus | null>(null);
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [gstNumber, setGstNumber] = useState("");
  const [msmeNumber, setMsmeNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  async function loadAll() {
    if (!accessToken) return;
    setLoading(true);
    setLoadError("");
    try {
      const myBusiness = await getMyBusinessRequest(accessToken);
      setBusiness(myBusiness);
      if (myBusiness) {
        const [claimStatus, verificationStatus] = await Promise.all([
          getClaimStatusRequest(accessToken, myBusiness.id),
          getVerificationStatusRequest(accessToken, myBusiness.id),
        ]);
        setClaim(claimStatus);
        setVerification(verificationStatus);
      }
    } catch (err) {
      setLoadError(err instanceof ApiClientError ? err.message : "Couldn't load verification status");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount is intentional
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fetch when accessToken changes, not on every loadAll identity change
  }, [accessToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !business) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await submitBusinessVerificationRequest(accessToken, business.id, {
        gstNumber: gstNumber || undefined,
        msmeNumber: msmeNumber || undefined,
      });
      setSubmitSuccess(true);
      setGstNumber("");
      setMsmeNumber("");
      await loadAll();
    } catch (err) {
      setSubmitError(err instanceof ApiClientError ? err.message : "Couldn't submit for verification");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-6 text-center text-sm font-bold text-rose-600">
        {loadError}
      </div>
    );
  }

  if (!business) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center space-y-2">
        <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
        <p className="text-sm font-bold text-slate-700">You don&apos;t have a claimed business yet.</p>
        <p className="text-xs text-slate-500 font-medium">Claim a business listing to unlock verification.</p>
      </div>
    );
  }

  const hasPendingVerification = verification?.records.some((r) => r.status === "PENDING");

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm shadow-slate-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md flex items-center gap-1",
                verification?.isVerified
                  ? "text-emerald-700 bg-emerald-100/80"
                  : "text-slate-500 bg-slate-100"
              )}
            >
              <ShieldCheck className={cn("w-3.5 h-3.5", verification?.isVerified ? "text-emerald-600" : "text-slate-400")} />
              Verified Status: {verification?.isVerified ? "Approved" : "Not Verified"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Verification Center & Trust Badge
          </h1>
          <p className="text-xs text-slate-500 font-semibold">
            {business.name} — claim status, verification requests, and your Verified badge.
          </p>
        </div>
      </div>

      {/* Claim / Verification Summary Grid — Claim Status, Verification Status, Claimed Date, Verification Method, Badge Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Claim Status</span>
          <div>
            {claim?.isClaimed ? (
              <StatusPill status="APPROVED" />
            ) : claim?.latestClaim ? (
              <StatusPill status={claim.latestClaim.status} />
            ) : (
              <StatusPill status="PENDING" />
            )}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Verification Status</span>
          <div>
            {verification?.isVerified ? (
              <StatusPill status="APPROVED" />
            ) : hasPendingVerification ? (
              <StatusPill status="PENDING" />
            ) : (
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border bg-slate-100 text-slate-500 border-slate-200">
                Not Submitted
              </span>
            )}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Claimed Date</span>
          <p className="text-xs font-black text-slate-900">
            {claim?.claimedAt ? new Date(claim.claimedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Verification Method</span>
          <p className="text-xs font-black text-slate-900">
            {claim?.claimVerificationMethod ? METHOD_LABEL[claim.claimVerificationMethod] || claim.claimVerificationMethod : "—"}
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Badge Status</span>
          {verification?.isVerified ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border bg-emerald-100 text-emerald-700 border-emerald-200">
              <Award className="w-3.5 h-3.5" /> Verified
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border bg-slate-100 text-slate-500 border-slate-200">
              Not Shown
            </span>
          )}
        </div>
      </div>

      {/* Submitted Verification Documents */}
      {verification && verification.records.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-black text-slate-900">Submitted Registration Numbers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verification.records.map((r) => (
              <div key={r.id} className="p-4 bg-[#f8fafc] rounded-2xl border border-slate-200/90 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400">
                    {r.method === "gst" ? "GSTIN Certificate" : "MSME / Udyam Registration"}
                  </span>
                  <h4 className="font-black text-xs text-slate-900 truncate">{r.registrationNumber}</h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    Submitted {new Date(r.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <StatusPill status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit for Verification */}
      {!verification?.isVerified && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-5">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Get Verified Badge
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Submit your GST or MSME registration number for admin review. The badge activates only after approval.
            </p>
          </div>

          {submitSuccess ? (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold">
              <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Submitted — status is Pending Admin Review.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-600" /> GST Number
                  </label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    placeholder="29AAAAA0000A1Z5"
                    maxLength={15}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#f8fafc] text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-purple-600" /> MSME / Udyam Number
                  </label>
                  <input
                    type="text"
                    value={msmeNumber}
                    onChange={(e) => setMsmeNumber(e.target.value.toUpperCase())}
                    placeholder="UDYAM-KA-00-0000000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#f8fafc] text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {submitError ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting || (!gstNumber && !msmeNumber)}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Submit for Admin Approval
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
