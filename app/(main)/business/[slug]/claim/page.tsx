"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Sparkles,
  Award,
  BarChart3,
  MessageSquare,
  Users,
  AlertCircle,
  HelpCircle,
  Mail,
  RefreshCw,
  Store,
  Star,
  MapPin,
  Check,
  FileCheck,
  ShieldAlert,
  Upload,
  Paperclip,
  Trash2,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth, ApiClientError } from "@/app/lib/auth-context";
import { getBusinessBySlug, type BusinessDetail } from "@/app/lib/search-api";
import { submitClaimDocumentRequest } from "@/app/lib/api";

const FALLBACK_LOGO =
  "https://pub-e457284fdd7844e5b0bcc12b89e4a198.r2.dev/fallback-images/claim-page-fallback-logo.jpg";

const DOC_TYPES = [
  { value: "gst", label: "GST Registration Certificate" },
  { value: "msme", label: "MSME / Udyam Certificate" },
  { value: "trade_license", label: "Trade License / Shop Act License" },
  { value: "utility_bill", label: "Business Utility Bill (Electricity / Water / Landline)" },
  { value: "company_registration", label: "Company Registration Certificate (RoC / Partnership)" },
  { value: "other", label: "Other Official Business Document" },
];

const ALLOWED_FILE_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB, matches the backend's multer limit
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function errMsg(err: unknown, fallback: string) {
  return err instanceof ApiClientError ? err.message : fallback;
}

export default function ClaimBusinessPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";
  const router = useRouter();
  const { user, accessToken, initializing } = useAuth();
  const isBusinessAccount =
    !!user && (user.role === "business_owner" || user.role === "admin" || user.role === "super_admin");

  useEffect(() => {
    if (initializing) return;
    if (!user) {
      router.replace(`/login?reason=business_required&next=${encodeURIComponent(`/business/${slug}/claim`)}`);
    } else if (!isBusinessAccount) {
      router.replace("/login?reason=business_required");
    }
  }, [initializing, user, isBusinessAccount, slug, router]);

  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Claim form state — contact details default to the logged-in claimant's own account (not the
  // business record, which has no email field and often no phone for scraped listings) but stay
  // freely editable, since Google sign-in doesn't always provide a phone number. Modeled as an
  // "override" rather than state synced from a prop via effect: until the person types something,
  // the field just renders the account's value directly — no effect needed to keep it in sync.
  const [contactPhoneOverride, setContactPhoneOverride] = useState<string | null>(null);
  const [contactEmailOverride, setContactEmailOverride] = useState<string | null>(null);
  const contactPhone = contactPhoneOverride ?? user?.phone ?? "";
  const contactEmail = contactEmailOverride ?? user?.email ?? "";
  const [docType, setDocType] = useState(DOC_TYPES[0].value);
  const [docNumber, setDocNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    getBusinessBySlug(slug, accessToken ?? undefined)
      .then((b) => {
        if (cancelled) return;
        setBusiness(b);
        setLoadError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(errMsg(err, "Business not found"));
      })
      .finally(() => {
        if (!cancelled) setLoadingBusiness(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, accessToken]);

  function handleFileChange(selected: File | null) {
    setFileError("");
    if (!selected) {
      setFile(null);
      return;
    }
    if (!ALLOWED_FILE_TYPES.has(selected.type)) {
      setFileError("Only JPG, PNG, or PDF files are allowed");
      return;
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setFileError("File must be smaller than 5MB");
      return;
    }
    setFile(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!business || !accessToken) return;
    setFormError("");

    const cleanPhone = contactPhone.trim();
    const cleanEmail = contactEmail.trim();

    if (!INDIAN_PHONE_REGEX.test(cleanPhone)) {
      setFormError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setFormError("Enter a valid email address");
      return;
    }
    if (!docType) {
      setFormError("Select a document type");
      return;
    }
    if (!file) {
      setFormError("Please attach a business proof document");
      return;
    }

    setSubmitting(true);
    try {
      await submitClaimDocumentRequest(
        accessToken,
        business.id,
        { contactPhone: cleanPhone, contactEmail: cleanEmail, docType, docNumber: docNumber.trim() || undefined },
        file
      );
      setSubmitted(true);
    } catch (err) {
      setFormError(errMsg(err, "Couldn't submit document — please try again"));
    } finally {
      setSubmitting(false);
    }
  }

  if (initializing || !user || !isBusinessAccount || loadingBusiness) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-semibold mt-3">Loading business details...</p>
      </div>
    );
  }

  if (loadError || !business) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mb-3" />
        <p className="text-sm font-bold text-slate-800">{loadError || "Business not found"}</p>
        <Link href="/" className="text-xs font-bold text-purple-600 hover:underline mt-2">
          Back to Hubigo
        </Link>
      </div>
    );
  }

  if (business.isClaimed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <ShieldCheck className="w-8 h-8 text-emerald-500 mb-3" />
        <p className="text-sm font-bold text-slate-800">This business has already been claimed.</p>
        <Link href={`/business/${slug}`} className="text-xs font-bold text-purple-600 hover:underline mt-2">
          Back to Business Details
        </Link>
      </div>
    );
  }

  const categoryName = business.categories.find((c) => c.isPrimary)?.category.name ?? business.categories[0]?.category.name ?? null;

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans pb-20 selection:bg-purple-100 selection:text-purple-900">

      {/* TOP SUB-HEADER BAR */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 sm:h-14 flex items-center justify-between">
          <Link
            href={`/business/${slug}`}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-purple-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Business Details</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Business Claim Portal</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 space-y-6 lg:space-y-8">

        {/* PAGE HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/80 border border-purple-200 text-purple-800 text-xs font-extrabold shadow-2xs">
            <Store className="w-3.5 h-3.5 text-purple-600" />
            <span>Business Ownership Transfer</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
            Claim Your Business Listing
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Take ownership of your business listing to manage information, update business details, respond to reviews, receive customer leads, and access business analytics.
          </p>
        </div>

        {/* STEP PROGRESS INDICATOR */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-8 h-0.5 bg-purple-600 -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: submitted ? "100%" : "0%" }}
            />

            <div className="relative z-10 flex flex-col items-center gap-1.5 bg-white px-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold transition-all shadow-xs bg-purple-600 text-white shadow-purple-200">
                {submitted ? <Check className="w-5 h-5 stroke-[3]" /> : "1"}
              </div>
              <span className="text-[11px] font-extrabold transition-colors text-purple-700">
                Ownership Verification
              </span>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-1.5 bg-white px-2">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold transition-all shadow-xs",
                  submitted ? "bg-purple-600 text-white shadow-purple-200" : "bg-slate-100 text-slate-400 border border-slate-200"
                )}
              >
                2
              </div>
              <span className={cn("text-[11px] font-extrabold transition-colors", submitted ? "text-purple-700" : "text-slate-400")}>
                Submitted for Review
              </span>
            </div>
          </div>
        </div>

        {/* MAIN TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* LEFT COLUMN: BUSINESS SNAPSHOT & BENEFITS */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-4">
              <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                Claim Target Listing
              </span>

              <div className="flex items-start gap-3.5 pt-1">
                <img
                  src={business.logoUrl || FALLBACK_LOGO}
                  alt={business.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-xs"
                />
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-base text-slate-900 truncate">{business.name}</h3>
                    {business.isVerified && <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />}
                  </div>
                  {categoryName && <p className="text-xs text-purple-700 font-bold">{categoryName}</p>}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    <span className="text-amber-500 font-bold flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-current" /> {business.avgRating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 font-medium space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{business.address}</span>
                </div>
              </div>
            </div>

            {/* Why Claim Your Business */}
            <div className="bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-purple-500/20 space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                <Sparkles className="w-5 h-5" />
                <span>Benefits of Claiming Ownership</span>
              </div>

              <div className="space-y-3.5 text-xs font-semibold text-slate-200">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-xs">Business Analytics Dashboard</h4>
                    <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
                      Track profile views, customer call taps, WhatsApp clicks, and search impressions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-xs">Direct Review Responses</h4>
                    <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
                      Respond directly to customer reviews with verified owner badges.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-xs">Receive Customer Leads</h4>
                    <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
                      Get real-time phone, email, and WhatsApp lead alerts directly to your phone.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-xs">Update Business Info & Media</h4>
                    <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
                      Modify operating hours, add menu items, upload photos, and post special offers.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verified Badge Benefits */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm border-b border-slate-100 pb-2.5">
                <Award className="w-5 h-5 text-emerald-600" />
                <span>Verified Badge Upgrade Benefits</span>
              </div>

              <ul className="space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Official Green Verified Badge on your listing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Increased Customer Trust & Higher Inquiry Conversion</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Eligible for &quot;Verified Businesses&quot; Search Filter</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Higher Search Placement & Credibility Boost</span>
                </li>
              </ul>
            </div>
          </div>

          {/* RIGHT COLUMN: CLAIM FORM / SUCCESS STATE */}
          <div className="lg:col-span-7">
            {!submitted ? (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="space-y-2 border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-950 flex items-center gap-2">
                      <Upload className="w-5 h-5 text-purple-600" />
                      <span>Verify Business Ownership</span>
                    </h2>
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded uppercase">
                      Mandatory
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Confirm your contact details and upload an official business registration document to claim ownership of this listing.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="p-5 rounded-2xl border border-slate-200 bg-[#f8fafc] space-y-4">
                    {/* Contact details — auto-filled from account, editable */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-800 block">
                          Your Mobile Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhoneOverride(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          placeholder="Enter your mobile number"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-800 block">
                          Your Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmailOverride(e.target.value)}
                          placeholder="Enter your email address"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    {/* Document Category / Type Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-800 block">
                        Document Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                      >
                        {DOC_TYPES.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* File Upload Dropzone */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-800 block">
                        Attach Document File <span className="text-rose-500">*</span>
                      </label>

                      {!file ? (
                        <label className="border-2 border-dashed border-purple-200 hover:border-purple-500 bg-purple-50/50 hover:bg-purple-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                          />
                          <div className="w-12 h-12 rounded-2xl bg-white border border-purple-200 text-purple-600 flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                            <Upload className="w-6 h-6" />
                          </div>
                          <p className="text-xs font-extrabold text-slate-900">Click to upload or drag & drop file</p>
                          <p className="text-[11px] text-slate-500 font-medium mt-1">Accepts JPG, PNG, or PDF (Max 5MB)</p>
                        </label>
                      ) : (
                        <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                              <Paperclip className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-slate-900 truncate">{file.name}</p>
                              <p className="text-[10px] text-slate-400 font-semibold">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleFileChange(null)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {fileError ? <p className="text-[11px] font-bold text-rose-600">{fileError}</p> : null}
                    </div>

                    {/* Optional Doc Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-800 block">
                        Document Registration Number <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                        placeholder="e.g. GSTIN: 29AAAAA0000A1Z5"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {formError ? (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Submitting Document for Admin Approval...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Submit Document for Admin Approval</span>
                      </>
                    )}
                  </button>

                  <div className="p-3.5 bg-slate-100 rounded-2xl text-[11px] text-slate-600 font-medium flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Our verification team will review your uploaded business document and approve listing ownership within 12-24 hours.</span>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-xl text-center space-y-6 relative overflow-hidden">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 border-4 border-white shadow-xl flex items-center justify-center mx-auto">
                    <FileCheck className="w-10 h-10 stroke-[2.5]" />
                  </div>
                </div>

                <div className="space-y-2 relative z-10 max-w-lg mx-auto">
                  <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full inline-block">
                    Status: Pending Admin Review
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Document Submitted!</h2>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed pt-1">
                    Your business document for {business.name} has been received. Our team will review it and assign
                    listing ownership within 12-24 hours — you&apos;ll be able to manage the listing from your
                    dashboard as soon as it&apos;s approved.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2 relative z-10">
                  <Link
                    href="/business-dashboard"
                    className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <span>Go to Dashboard</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/business/${slug}`}
                    className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-colors"
                  >
                    Back to Business Details
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SUPPORT SECTION */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                <span>Can&apos;t verify your business?</span>
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                If you&apos;re unable to submit a matching document, contact Hubigo Support for manual assistance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <a
                href="mailto:joinhubigo@gmail.com"
                className="px-4 py-2.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-2"
              >
                <Mail className="w-4 h-4 text-purple-600" />
                <span>joinhubigo@gmail.com</span>
              </a>

              <a
                href="tel:+918618406401"
                className="px-4 py-2.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-2"
              >
                <Phone className="w-4 h-4 text-purple-600" />
                <span>+91 86184 06401</span>
              </a>
            </div>
          </div>

          <div className="p-3.5 bg-[#f8fafc] border border-slate-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-slate-600 font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="font-extrabold text-slate-900 block">Manual Support Verification Option</strong>
              Our dedicated support team will manually review submitted ownership proof (such as utility bills or business cards) and approve your claim via the Hubigo Admin Panel.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
