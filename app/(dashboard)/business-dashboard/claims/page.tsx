"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileCheck, Clock, CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/app/lib/auth-context";
import { getMyClaimsRequest, type MyClaim } from "@/app/lib/api";

const DOC_TYPE_LABEL: Record<string, string> = {
  gst: "GST Registration Certificate",
  msme: "MSME / Udyam Certificate",
  trade_license: "Trade License / Shop Act License",
  utility_bill: "Business Utility Bill",
  company_registration: "Company Registration Certificate",
  other: "Other Official Document",
};

const STATUS_CONFIG: Record<MyClaim["status"], { label: string; icon: typeof Clock; className: string }> = {
  PENDING: { label: "Under Review", icon: Clock, className: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED: { label: "Approved", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "Rejected", icon: XCircle, className: "bg-rose-50 text-rose-700 border-rose-200" },
};

export default function MyClaimsPage() {
  const { accessToken } = useAuth();
  const [claims, setClaims] = useState<MyClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getMyClaimsRequest(accessToken)
      .then(setClaims)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load your claim history"))
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col font-sans flex-1 min-h-[calc(100vh-64px)] bg-white w-full">
      <div className="bg-white rounded-none border-b border-slate-200/90 p-5 shadow-none shadow-slate-200/50 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-none flex items-center gap-1">
            <FileCheck className="w-3 h-3 text-purple-600" />
            My Claims
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Business Claim Attempts</h1>
        <p className="text-xs text-slate-500 font-semibold">
          Every ownership claim you&apos;ve submitted, and what happened to it.
        </p>
      </div>

      {error && (
        <div className="bg-white rounded-none border-b border-rose-200 p-5 text-xs font-semibold text-rose-600  relative z-10">{error}</div>
      )}

      <div className="bg-white rounded-none border-b border-slate-200/90 p-0 lg:p-5 shadow-none shadow-slate-200/50 space-y-0 lg:space-y-3  relative z-10">
        {claims.length === 0 ? (
          <p className="text-xs text-slate-500 font-semibold p-8 text-center">
            You haven&apos;t submitted any business claims yet.
          </p>
        ) : (
          claims.map((claim) => {
            const status = STATUS_CONFIG[claim.status];
            const StatusIcon = status.icon;
            return (
              <div key={claim.id} className="p-5 lg:p-4 rounded-none border-b border-slate-200/90 bg-white lg:bg-[#f8fafc] space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-black text-sm text-slate-900">
                      {claim.business?.name ?? "Unknown business"}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      {claim.business?.city?.name ?? "—"} • Submitted {new Date(claim.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border shrink-0",
                      status.className
                    )}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
                  <span className="px-2 py-0.5 rounded-none bg-white border border-slate-200 text-slate-600">
                    {DOC_TYPE_LABEL[claim.docType] ?? claim.docType}
                  </span>
                  {claim.proofValue && <span>Reg. No: {claim.proofValue}</span>}
                </div>

                {claim.status === "APPROVED" && claim.business && (
                  <Link
                    href="/business-dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
                  >
                    <span>You have full owner access to this business</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}

                {claim.status === "REJECTED" && (
                  <div className="p-3 rounded-none bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                    {claim.adminNotes
                      ? `Reason: ${claim.adminNotes}`
                      : "No reason was provided. Contact support for details."}
                  </div>
                )}

                {claim.status === "PENDING" && (
                  <p className="text-xs text-slate-500 font-medium">
                    An admin is reviewing your submitted document — this usually takes 1–2 business days.
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
