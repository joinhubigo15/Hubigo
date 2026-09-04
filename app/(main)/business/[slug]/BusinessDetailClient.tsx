"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  MapPin,
  Heart,
  Share2,
  Phone,
  MessageSquare,
  Navigation,
  Globe,
  Clock,
  CircleDollarSign,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  Mail,
  Image as ImageIcon,
  Copy,
  Check,
  ExternalLink,
  Flag,
  Edit3,
  Store,
  Briefcase,
  UtensilsCrossed,
  RefreshCw,
  Package,
  Building2,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import VerifiedBadge from "@/app/components/ui/VerifiedBadge";
import FaqAccordion from "@/app/components/business/FaqAccordion";
import { deriveBusinessFaqs } from "@/app/lib/business-faqs";
import {
  getBusinessBySlug,
  postBusinessReview,
  searchBusinesses,
  trackBusinessInteraction,
  type BusinessDetail,
  type BusinessSummary,
} from "@/app/lib/search-api";
import { useAuth, ApiClientError } from "@/app/lib/auth-context";
import { startConversationWithBusiness } from "@/app/lib/business-dashboard-api";
import {
  saveBusinessRequest,
  removeSavedBusinessRequest,
  getSavedBusinessesRequest,
  submitBusinessSuggestionRequest,
  submitBusinessReportRequest,
} from "@/app/lib/api";

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

const RATING_LABELS: Record<number, string> = {
  1: "Terrible 😞",
  2: "Poor 🙁",
  3: "Average 😐",
  4: "Very Good 😊",
  5: "Excellent! 🌟",
};

function dayLabel(day: string) {
  return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
}

function formatTime(time: string | null) {
  if (!time) return null;
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr} ${period}`;
}

/** The scraper stores hours as a JSON string of day -> time-range labels (e.g.
 * '{"Monday":["11 AM–10 PM"]}') rather than plain text — parse it into a Mon-Sun list instead of
 * dumping raw JSON on the page. Returns null if the string isn't parseable in that shape. */
function parseOpenHoursRaw(raw: string | null): { day: string; text: string }[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const rows = DAY_ORDER.map((key) => {
      const match = Object.keys(parsed).find((k) => k.toLowerCase() === key);
      const value = match ? parsed[match] : undefined;
      if (value === undefined) return null;
      const text = Array.isArray(value) ? value.join(", ") : String(value);
      return { day: dayLabel(key), text: text || "Closed" };
    }).filter((r): r is { day: string; text: string } => Boolean(r));
    return rows.length > 0 ? rows : null;
  } catch {
    return null;
  }
}

/** BusinessHours rows are seeded structurally in a later phase — most listings only have the
 * scraped openHoursRaw text for now. Computes today's open/closed state only when structured
 * hours actually exist; otherwise the UI falls back to showing the raw text. */
function useTodayHours(hours: BusinessDetail["hours"]) {
  return useMemo(() => {
    if (hours.length === 0) return { isOpenNow: null as boolean | null, closesAt: null as string | null, sorted: [] };
    const now = new Date();
    const todayKey = DAY_ORDER[(now.getDay() + 6) % 7]; // JS: 0=Sun -> align to Monday-first
    const todayRow = hours.find((h) => h.day.toLowerCase() === todayKey);
    let isOpenNow: boolean | null = null;
    let closesAt: string | null = null;
    if (todayRow && !todayRow.isClosed && todayRow.openTime && todayRow.closeTime) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const [oh, om] = todayRow.openTime.split(":").map(Number);
      const [ch, cm] = todayRow.closeTime.split(":").map(Number);
      isOpenNow = nowMinutes >= oh * 60 + om && nowMinutes <= ch * 60 + cm;
      closesAt = formatTime(todayRow.closeTime);
    } else if (todayRow?.isClosed) {
      isOpenNow = false;
    }
    const sorted = DAY_ORDER.map((key) => hours.find((h) => h.day.toLowerCase() === key)).filter(
      (h): h is BusinessDetail["hours"][number] => Boolean(h),
    );
    return { isOpenNow, closesAt, sorted };
  }, [hours]);
}

function BusinessDetailSkeleton() {
  return (
    <div className="bg-[#f8fafc] min-h-screen animate-pulse">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-4 space-y-4">
        <div className="h-64 lg:h-96 bg-slate-200 rounded-2xl lg:rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-40 bg-slate-200 rounded-2xl" />
            <div className="h-56 bg-slate-200 rounded-2xl" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="h-48 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdaptiveBusinessDetailsPage({
  slug,
  initialBusiness,
}: {
  slug: string;
  initialBusiness: BusinessDetail;
}) {
  const router = useRouter();
  const { user, accessToken } = useAuth();

  const [business, setBusiness] = useState<BusinessDetail | null>(initialBusiness);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [similarBusinesses, setSimilarBusinesses] = useState<BusinessSummary[]>([]);

  const [isSaved, setIsSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveBusy, setSaveBusy] = useState(false);
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  const handleMessageClick = () => {
    if (!user || !accessToken) {
      router.push(`/login?next=${encodeURIComponent(`/business/${slug}`)}`);
      return;
    }
    setShowMessageBox(true);
  };

  const handleSendMessage = async () => {
    if (!accessToken || !business || !messageText.trim()) return;
    setMessageSending(true);
    try {
      await startConversationWithBusiness(accessToken, business.id, messageText.trim());
      setMessageSent(true);
      setMessageText("");
      setTimeout(() => {
        setShowMessageBox(false);
        setMessageSent(false);
      }, 1500);
    } finally {
      setMessageSending(false);
    }
  };
  const [activeNavTab, setActiveNavTab] = useState<"overview" | "categories" | "services" | "photos" | "amenities" | "reviews" | "faq" | "about">("overview");
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showWriteReviewModal, setShowWriteReviewModal] = useState(false);

  // SUGGEST EDIT MODAL STATE
  const [showSuggestEditModal, setShowSuggestEditModal] = useState(false);
  const [editType, setEditType] = useState("Incorrect Address or Location");
  const [editDetails, setEditDetails] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editSubmittedSuccess, setEditSubmittedSuccess] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // REPORT LISTING MODAL STATE
  const [showReportListingModal, setShowReportListingModal] = useState(false);
  const [reportReason, setReportReason] = useState("Fake or Fraudulent Business");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSubmittedSuccess, setReportSubmittedSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleOpenSuggestEdit = () => {
    setEditSubmittedSuccess(false);
    setEditError(null);
    setEditDetails("");
    setEditType("Incorrect Address or Location");
    setShowSuggestEditModal(true);
  };

  const handleOpenReportListing = () => {
    setReportSubmittedSuccess(false);
    setReportError(null);
    setReportDetails("");
    setReportReason("Fake or Fraudulent Business");
    setShowReportListingModal(true);
  };

  const handleSubmitEditSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDetails.trim()) {
      setEditError("Please provide details for the suggested correction.");
      return;
    }
    setIsSubmittingEdit(true);
    setEditError(null);
    try {
      if (accessToken && business) {
        await submitBusinessSuggestionRequest(accessToken, business.id, {
          type: editType,
          details: editDetails.trim(),
        });
      } else {
        await new Promise((r) => setTimeout(r, 600));
      }
      setEditSubmittedSuccess(true);
    } catch {
      setEditSubmittedSuccess(true);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleSubmitReportListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDetails.trim()) {
      setReportError("Please explain why this listing is being reported.");
      return;
    }
    setIsSubmittingReport(true);
    setReportError(null);
    try {
      if (accessToken && business) {
        await submitBusinessReportRequest(accessToken, business.id, {
          reason: reportReason,
          details: reportDetails.trim(),
        });
      } else {
        await new Promise((r) => setTimeout(r, 600));
      }
      setReportSubmittedSuccess(true);
    } catch {
      setReportSubmittedSuccess(true);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Write Review Modal Interactive Rating State
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [quickHoverRating, setQuickHoverRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewSubmittedSuccess, setReviewSubmittedSuccess] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [hoursDropdownOpen, setHoursDropdownOpen] = useState<boolean>(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState<boolean>(false);
  const reviewsCarouselRef = useRef<HTMLDivElement>(null);
  const scrollReviews = (direction: "left" | "right") => {
    if (!reviewsCarouselRef.current) return;
    const container = reviewsCarouselRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleWriteReviewClick = () => {
    if (!user || !accessToken) {
      router.push(`/login?next=${encodeURIComponent(`/business/${slug}`)}`);
      return;
    }
    setReviewError(null);
    setShowWriteReviewModal(true);
  };

  // Clicking a star in the summary row pre-selects that rating and jumps straight into the same
  // Write a Review modal/submit flow — still requires a comment (schema-enforced), just skips
  // having to re-pick the star count there.
  const handleQuickStarClick = (star: number) => {
    if (!user || !accessToken) {
      router.push(`/login?next=${encodeURIComponent(`/business/${slug}`)}`);
      return;
    }
    setReviewRating(star);
    setReviewError(null);
    setShowWriteReviewModal(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !business) return;
    setIsSubmittingReview(true);
    setReviewError(null);
    try {
      const posted = await postBusinessReview(business.id, reviewRating, reviewComment.trim(), accessToken);
      // Appends straight to the visible list — no admin moderation queue, it's live immediately.
      setBusiness((prev) => (prev ? { ...prev, reviews: [posted, ...prev.reviews] } : prev));
      setReviewSubmittedSuccess(true);
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Something went wrong posting your review. Please try again."
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // page.tsx (server) already fetched this exact business and passed it as `initialBusiness` —
  // skip the redundant client fetch on mount rather than re-requesting data we already have.
  // Note: this means a logged-in visitor's view is no longer separately attributed via this
  // client-side call (accessToken previously let the backend tie the fetch to the visitor for
  // competitor-lead routing) — the server-rendered fetch that produced initialBusiness is
  // unauthenticated. Flagged as a known, deliberate trade-off of the SSR conversion, not
  // something this pass tries to preserve.
  const initialDataSlugRef = useRef<string | null>(slug);
  useEffect(() => {
    if (!slug) return;
    if (slug === initialDataSlugRef.current) return;
    setLoading(true);
    setLoadError("");
    getBusinessBySlug(slug, accessToken ?? undefined)
      .then((data) => setBusiness(data))
      .catch(() => setLoadError("We couldn't find that business listing."))
      .finally(() => setLoading(false));
  }, [slug, accessToken]);

  const handleCallClick = () => {
    if (slug) trackBusinessInteraction(slug, "CALL", accessToken ?? undefined).catch(() => {});
  };
  const [addressDropdownOpen, setAddressDropdownOpen] = useState(false);
  const handleWhatsAppClick = () => {
    if (slug) trackBusinessInteraction(slug, "WHATSAPP", accessToken ?? undefined).catch(() => {});
  };

  const primaryCategory = business?.categories.find((c) => c.isPrimary)?.category ?? business?.categories[0]?.category;
  // isOpenNow/closesAt come from the API (server-computed, with a raw-hours-text fallback since
  // structured BusinessHours rows aren't populated yet — see backend/src/utils/business-hours.ts).
  const isOpenNow = business?.isOpenNow ?? null;
  const closesAt = business?.closesAt ?? null;
  const { sorted: sortedHours } = useTodayHours(business?.hours ?? []);
  const parsedRawHours = useMemo(() => parseOpenHoursRaw(business?.openHoursRaw ?? null), [business]);
  // Same pure deriver the server page uses for FAQPage JSON-LD — kept identical so the visible
  // accordion below can never drift from the structured data a crawler sees.
  const faqs = useMemo(() => (business ? deriveBusinessFaqs(business) : []), [business]);
  const galleryImages = useMemo(
    () => (business?.media ?? []).filter((m) => m.type === "image"),
    [business],
  );
  // Compile all healthcare subcategories, specializations, departments, and services
  const derivedSubcategories = useMemo(() => {
    if (!business) return [];
    const set = new Set<string>();

    // 1. Attached categories (non-primary or parent's child)
    business.categories.forEach((c) => {
      if (c.category.parent) {
        set.add(c.category.name);
      } else if (!c.isPrimary) {
        set.add(c.category.name);
      }
    });

    // 2. Keywords attached to business
    if (business.keywords) {
      business.keywords.forEach((kw) => {
        if (kw && kw.trim()) set.add(kw.trim());
      });
    }

    // 3. Services attached to business
    if (business.services) {
      business.services.forEach((s) => {
        if (s.name && s.name.trim()) set.add(s.name.trim());
      });
    }

    // 4. Extract healthcare specialties from name & description
    const text = `${business.name} ${business.description || ""}`.toLowerCase();
    const specialtyMap: [RegExp, string][] = [
      [/dental|dentist|teeth|orthodont/i, "Dental & Oral Care"],
      [/pediatr|child|infant|baby/i, "Pediatrics & Child Health"],
      [/eye|ophthalm|vision|cataract/i, "Eye Care & Ophthalmology"],
      [/gynaec|gynec|obstetr|pcod|pregnancy|women|maternity/i, "Obstetrics & Gynaecology"],
      [/orthoped|bone|joint|spine/i, "Orthopedics & Joint Care"],
      [/derma|skin|hair|cosmet/i, "Dermatology & Skin Care"],
      [/cardio|heart/i, "Cardiology & Heart Care"],
      [/ent|ear|nose|throat/i, "ENT (Ear, Nose, Throat)"],
      [/neuro|brain|nerve/i, "Neurology & Brain Health"],
      [/physio|rehab|physical therapy/i, "Physiotherapy & Rehabilitation"],
      [/ayurved|panchakarma/i, "Ayurvedic Medicine"],
      [/homeopath/i, "Homeopathy"],
      [/diagnost|lab|scan|x-ray|ultrasound|mri|blood test/i, "Diagnostic & Pathology Labs"],
      [/surge|operat/i, "Surgical Care"],
      [/cancer|oncol/i, "Oncology & Cancer Care"],
      [/psychiat|mental|counsel/i, "Mental Health & Psychiatry"],
      [/emergenc|icu|casualty|24\/?7/i, "24/7 Emergency & ICU Care"],
      [/general physician|clinic|opd|consultant/i, "General Medicine & Consultation"],
      [/diabetes|endocrin/i, "Diabetology & Endocrinology"],
      [/gastro|liver|digest/i, "Gastroenterology"],
      [/urolog|kidney|dialysis|nephro/i, "Urology & Nephrology"],
    ];

    for (const [regex, label] of specialtyMap) {
      if (regex.test(text)) {
        set.add(label);
      }
    }

    return Array.from(set);
  }, [business]);

  const avatarImageUrl = business?.logoUrl ?? business?.media.find((m) => m.type === "badge")?.url ?? null;

  useEffect(() => {
    if (!business) return;
    const subcategorySlug = primaryCategory?.slug;
    if (!subcategorySlug) return;
    searchBusinesses({ subcategory: subcategorySlug, city: business.city.slug, limit: 4 })
      .then((res) => setSimilarBusinesses(res.items.filter((b) => b.slug !== business.slug).slice(0, 3)))
      .catch(() => setSimilarBusinesses([]));
  }, [business, primaryCategory?.slug]);

  useEffect(() => {
    if (!business || !accessToken) return;
    let cancelled = false;
    getSavedBusinessesRequest(accessToken)
      .then((list) => {
        if (cancelled) return;
        const match = list.find((b) => b.listingId === business.id);
        setIsSaved(Boolean(match));
        setSavedId(match?.id ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [business, accessToken]);

  async function toggleSave() {
    if (!business) return;
    if (!user || !accessToken) {
      router.push(`/login?next=${encodeURIComponent(`/business/${slug}`)}`);
      return;
    }
    setSaveBusy(true);
    try {
      if (isSaved && savedId) {
        await removeSavedBusinessRequest(accessToken, savedId);
        setIsSaved(false);
        setSavedId(null);
      } else {
        const created = await saveBusinessRequest(accessToken, {
          listingId: business.id,
          name: business.name,
          category: primaryCategory?.name,
          city: business.city.name,
          imageUrl: business.coverImageUrl ?? undefined,
          rating: business.avgRating,
        });
        setIsSaved(true);
        setSavedId(created.id);
      }
    } catch (err) {
      if (!(err instanceof ApiClientError)) console.error(err);
    } finally {
      setSaveBusy(false);
    }
  }

  const copyAddress = () => {
    if (!business) return;
    navigator.clipboard.writeText(business.address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const shareListing = () => {
    if (!business) return;
    if (navigator.share) {
      navigator.share({ title: business.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Listing link copied!");
    }
  };

  if (loading) return <BusinessDetailSkeleton />;

  if (loadError || !business) {
    return (
      <div className="bg-[#f8fafc] min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-black text-slate-900">Listing not found</h1>
          <p className="text-sm text-slate-500">{loadError || "This business listing doesn't exist or has been removed."}</p>
          <Link href="/search" className="inline-block text-sm font-bold text-purple-600 hover:underline">
            ← Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.name + " " + business.address)}`;

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans selection:bg-purple-100 selection:text-purple-900 pb-20 lg:pb-16">

      <div className="max-w-7xl mx-auto px-0 sm:px-4 lg:max-w-none lg:px-0 pt-0 space-y-3 lg:space-y-0">

        {/* ========================================================= */}
        {/* 1. HERO & HEADER SECTION */}
        {/* ========================================================= */}
        <section className="bg-white rounded-none border border-slate-200/90 lg:border-0 overflow-hidden shadow-2xs lg:shadow-none">

          {/* Full-Width Cover Photo Banner */}
          <div className="relative h-44 sm:h-60 lg:h-80 w-full bg-slate-900 overflow-hidden group">
            {business.coverImageUrl ? (
              <Image
                src={business.coverImageUrl}
                alt={`${business.name} in ${business.city.name}`}
                fill
                priority
                sizes="100vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-95"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                <Store className="w-12 h-12 text-slate-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-black/30" />

            {/* Top Navigation & Action Controls Overlay */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
              <button
                onClick={() => router.back()}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-none bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-slate-800 hover:bg-white transition-colors cursor-pointer"
                aria-label="Back to search results"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSave}
                  disabled={saveBusy}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-none bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-slate-800 hover:bg-white hover:text-rose-500 transition-colors cursor-pointer disabled:opacity-60"
                  title="Save to Favourites"
                >
                  <Heart className={cn("w-4 h-4", isSaved && "fill-rose-500 text-rose-500")} />
                </button>
                <button
                  onClick={shareListing}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-none bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-slate-800 hover:bg-white transition-colors cursor-pointer"
                  title="Share Listing"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Photo Counter Pill (Bottom Right) */}
            {business.isClaimed && galleryImages.length > 0 && (
              <button
                onClick={() => setLightboxIndex(0)}
                className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-none border border-white/20 flex items-center gap-1.5 hover:bg-purple-600 transition-colors cursor-pointer shadow-md"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>1/{galleryImages.length} Photos</span>
              </button>
            )}
          </div>

          {/* Business Details Block */}
          <div className="p-3.5 sm:p-5 lg:p-6 space-y-2.5">
            {/* Title + Premium Gold Badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                <h1 className="text-sm sm:text-base lg:text-xl font-black text-slate-900 tracking-tight leading-snug break-words">
                  {business.name}
                </h1>
                {business.isVerified && <VerifiedBadge size="sm" />}
              </div>

              {business.planTier !== "basic" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs shrink-0">
                  <span>👑</span>
                  <span>{business.planTier === "elite" ? "Elite" : "Premium"}</span>
                </span>
              )}
            </div>

            {/* Category & Sector Header Badge */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200/80">
                <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>
                  {primaryCategory?.parent
                    ? `${primaryCategory.parent.name} • ${primaryCategory.name}`
                    : primaryCategory?.name ?? "Healthcare Service"}
                </span>
              </span>
            </div>

            {/* Rating & Locality Row */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 flex-wrap">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-extrabold text-slate-900">
                  {business.avgRating > 0 ? business.avgRating.toFixed(1) : "New"}
                </span>
              </div>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 font-semibold flex items-center gap-0.5">
                <MapPin className="w-3.5 h-3.5 text-purple-600" />
                <span>{business.areaName || business.locality?.name || business.city.name}</span>
              </span>
            </div>

            {/* Status Row */}
            {isOpenNow !== null && (
              <div className="pt-0.5">
                <span className={cn("text-xs font-black", isOpenNow ? "text-emerald-600" : "text-rose-500")}>
                  {isOpenNow ? `Open • Closes at ${closesAt || "9:00 PM"}` : "Closed Now"}
                </span>
              </div>
            )}

            {/* ACTION BUTTONS GRID */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-4 pt-3 border-t border-slate-100 w-full lg:grid lg:grid-cols-4 lg:gap-2 max-w-md mx-auto sm:mx-0">
              {/* Call */}
              <a
                href={business.phone ? `tel:${business.phone}` : "#"}
                onClick={handleCallClick}
                className="flex flex-col items-center gap-1 group cursor-pointer shrink-0 min-w-[56px] lg:min-w-[64px]"
              >
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-none bg-blue-50 group-hover:bg-blue-100 text-blue-600 border border-blue-100 flex items-center justify-center transition-colors shadow-2xs">
                  <Phone className="w-4 h-4 fill-current" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 group-hover:text-blue-600">Call</span>
              </a>

              {/* WhatsApp */}
              <a
                href={business.whatsappPhone ? `https://wa.me/${business.whatsappPhone.replace(/[^0-9]/g, "")}` : "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppClick}
                className="flex flex-col items-center gap-1 group cursor-pointer shrink-0 min-w-[56px] lg:min-w-[64px]"
              >
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-none bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 border border-emerald-100 flex items-center justify-center transition-colors shadow-2xs">
                  <MessageSquare className="w-4 h-4 fill-current" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 group-hover:text-emerald-600">WhatsApp</span>
              </a>

              {/* Directions */}
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 group cursor-pointer shrink-0 min-w-[56px] lg:min-w-[64px]"
              >
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-none bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 border border-indigo-100 flex items-center justify-center transition-colors shadow-2xs">
                  <Navigation className="w-4 h-4 fill-current" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 group-hover:text-indigo-600">Directions</span>
              </a>

              {/* Website */}
              <a
                href={business.website ? (business.website.startsWith("http") ? business.website : `https://${business.website}`) : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 group cursor-pointer shrink-0 min-w-[56px] lg:min-w-[64px]"
              >
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-none bg-purple-50 group-hover:bg-purple-100 text-purple-600 border border-purple-100 flex items-center justify-center transition-colors shadow-2xs">
                  <Globe className="w-4 h-4" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 group-hover:text-purple-600">Website</span>
              </a>

              {/* Enquire — mobile only; desktop relies on the sticky blue "Enquire Now" bar instead */}
              <button
                onClick={handleMessageClick}
                className="lg:hidden flex flex-col items-center gap-1 group cursor-pointer shrink-0 min-w-[56px]"
              >
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-none bg-purple-50 group-hover:bg-purple-100 text-purple-600 border border-purple-100 flex items-center justify-center transition-colors shadow-2xs">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 group-hover:text-purple-600">Enquire</span>
              </button>
            </div>

          </div>

          {/* Navigation Tabs Bar - Slidable horizontal scroll bar */}
          <div className="w-full bg-slate-50/90 border-t border-slate-200/90 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1 px-3 sm:px-6 min-w-max">
              {(["overview", "categories", "services", "photos", "amenities", "reviews", "faq"] as const)
                .filter((tab) => tab !== "faq" || faqs.length > 0)
                .map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveNavTab(tab);
                    const el = document.getElementById(`section-${tab}`);
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={cn(
                    "py-3 font-semibold transition-all border-b-2 tracking-tight cursor-pointer text-xs px-3.5 sm:px-5 text-center shrink-0 rounded-none whitespace-nowrap",
                    activeNavTab === tab
                      ? "border-blue-600 text-blue-600 font-bold"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  )}
                >
                  {(tab as string) === "faq" ? "FAQ" : (tab as string) === "amenities" ? "Amenities & Facilities" : (tab as string) === "payments" ? "Payment Methods" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

        </section>


        {/* MAIN BODY GRID: 8 COLS LEFT + 4 COLS STICKY RIGHT SIDEBAR ON DESKTOP */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start">

          {/* LEFT COLUMN CONTENT */}
          <div className="lg:col-span-8 flex flex-col space-y-0">

            {/* ========================================================= */}
            {/* 2. OVERVIEW & ADDRESS SECTION */}
            {/* ========================================================= */}
            {/* ========================================================= */}
            {/* 2. BUSINESS SUMMARY CARD */}
            {/* ========================================================= */}
            <section id="section-overview" className="bg-white rounded-none border border-slate-200/90 lg:border-0 p-4 lg:p-6 space-y-4 shadow-2xs lg:shadow-none">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-800">Business Summary</h2>
                <p className="text-xs leading-relaxed text-slate-600 font-medium mt-1">
                  {business.description || "No description available for this business yet."}
                </p>
              </div>

              {/* Rows List */}
              <div className="space-y-2 pt-1">
                {/* 1. Address Row */}
                {business.address && (
                  <div className="border border-slate-200/80 rounded-none bg-slate-50/50">
                    <button
                      onClick={() => setAddressDropdownOpen(!addressDropdownOpen)}
                      className="w-full flex items-start justify-between gap-3 p-3 text-left transition-colors hover:bg-slate-50 cursor-pointer"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <span className="text-xs leading-normal font-semibold text-slate-700 break-words line-clamp-2">
                          {business.address}
                        </span>
                      </div>
                      <ChevronDown className={cn("w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 mt-0.5", addressDropdownOpen && "rotate-180")} />
                    </button>
                    {addressDropdownOpen && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-100 flex gap-2 animate-in fade-in-50 duration-200">
                        <button
                          onClick={copyAddress}
                          className="px-3 py-1.5 bg-white border border-purple-200 hover:border-purple-300 text-purple-700 font-bold text-[11px] rounded-none shadow-2xs transition-colors cursor-pointer"
                        >
                          {copiedAddress ? "Copied! ✓" : "Copy Address 📋"}
                        </button>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-none shadow-2xs transition-colors flex items-center gap-1"
                        >
                          Open in Maps 🗺️
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Working Hours Row */}
                {(() => {
                  const dayIndex = new Date().getDay(); // 0 = Sunday, 1 = Monday ... 6 = Saturday
                  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
                  const todayKey = dayNames[dayIndex];

                  if (sortedHours.length > 0) {
                    const todayRow = sortedHours.find((h) => h.day.toLowerCase() === todayKey) || sortedHours[0];
                    const todayText = todayRow.isClosed
                      ? "Closed Today"
                      : `${formatTime(todayRow.openTime) ?? "—"} - ${formatTime(todayRow.closeTime) ?? "—"}`;

                    return (
                      <div className="border border-slate-200/80 rounded-none bg-slate-50/50">
                        <button
                          onClick={() => setHoursDropdownOpen(!hoursDropdownOpen)}
                          className="w-full flex items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-slate-50 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Clock className={cn("w-4 h-4 shrink-0", isOpenNow ? "text-emerald-600" : "text-rose-600")} />
                            <span className="text-xs leading-normal font-semibold text-slate-700 truncate">
                              <span className={cn("font-extrabold mr-1.5", isOpenNow ? "text-emerald-600" : "text-rose-600")}>
                                {isOpenNow ? `Opens at: ${formatTime(todayRow.openTime) ?? "09:30 AM"}` : "Closed Now"}
                              </span>
                              ({dayLabel(todayRow.day)})
                            </span>
                          </div>
                          <ChevronDown className={cn("w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200", hoursDropdownOpen && "rotate-180")} />
                        </button>
                        {hoursDropdownOpen && (
                          <div className="px-3 pb-3 pt-1 border-t border-slate-100 space-y-1 text-xs font-medium animate-in fade-in-50 duration-200">
                            {sortedHours.map((h) => {
                              const isToday = h.day.toLowerCase() === todayKey;
                              return (
                                <div
                                  key={h.day}
                                  className={cn(
                                    "flex items-center justify-between py-1 px-2 rounded-none",
                                    isToday ? "bg-purple-50 font-bold text-purple-900" : "text-slate-600 hover:bg-slate-50"
                                  )}
                                >
                                  <span>{dayLabel(h.day)}</span>
                                  <span>{h.isClosed ? "Closed" : `${formatTime(h.openTime) ?? "—"} - ${formatTime(h.closeTime) ?? "—"}`}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (parsedRawHours && parsedRawHours.length > 0) {
                    const todayRow = parsedRawHours.find((h) => h.day.toLowerCase() === todayKey) || parsedRawHours[0];
                    return (
                      <div className="border border-slate-200/80 rounded-none bg-slate-50/50">
                        <button
                          onClick={() => setHoursDropdownOpen(!hoursDropdownOpen)}
                          className="w-full flex items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-slate-50 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Clock className={cn("w-4 h-4 shrink-0", isOpenNow ? "text-emerald-600" : "text-rose-600")} />
                            <span className="text-xs leading-normal font-semibold text-slate-700 truncate">
                              <span className={cn("font-extrabold mr-1.5", isOpenNow ? "text-emerald-600" : "text-rose-600")}>
                                {isOpenNow ? "Open Now" : "Closed Now"}
                              </span>
                              ({dayLabel(todayRow.day)}): {todayRow.text}
                            </span>
                          </div>
                          <ChevronDown className={cn("w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200", hoursDropdownOpen && "rotate-180")} />
                        </button>
                        {hoursDropdownOpen && (
                          <div className="px-3 pb-3 pt-1 border-t border-slate-100 space-y-1 text-xs font-medium animate-in fade-in-50 duration-200">
                            {parsedRawHours.map((h) => {
                              const isToday = h.day.toLowerCase() === todayKey;
                              return (
                                <div
                                  key={h.day}
                                  className={cn(
                                    "flex items-center justify-between py-1 px-2 rounded-none",
                                    isToday ? "bg-purple-50 font-bold text-purple-900" : "text-slate-600 hover:bg-slate-50"
                                  )}
                                >
                                  <span>{dayLabel(h.day)}</span>
                                  <span>{h.text}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return null;
                })()}

                {/* 3. Website Row */}
                {business.website && (
                  <div className="border border-slate-200/80 rounded-none bg-slate-50/50">
                    <a
                      href={business.website.startsWith("http") ? business.website : `https://${business.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="text-xs leading-normal font-semibold text-slate-700 truncate">
                          {business.website}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </a>
                  </div>
                )}

                {/* 4. Phone Row */}
                {business.phone && (
                  <div className="border border-slate-200/80 rounded-none bg-slate-50/50 flex items-center justify-between gap-3 p-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                      <a href={`tel:${business.phone}`} onClick={handleCallClick} className="text-xs leading-normal font-semibold text-slate-700 hover:text-purple-600 transition-colors">
                        {business.phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </section>


            {/* ========================================================= */}
            {/* CATEGORIES & HEALTHCARE SPECIALTIES SECTION */}
            {/* ========================================================= */}
            <section id="section-categories" className="bg-white rounded-none border border-slate-200/90 lg:border-0 p-4 lg:p-6 space-y-4 shadow-2xs lg:shadow-none mt-4 lg:mt-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-800 leading-tight">
                      Categories & Medical Specialties
                    </h2>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      Medical services, departments & subcategories
                    </p>
                  </div>
                </div>
              </div>

              {/* Primary Category, Sector & Healthcare Subcategories List */}
              <div className="space-y-4 pt-1">
                {(() => {
                  const primaryCat = business.categories.find((c) => c.isPrimary) ?? business.categories[0];
                  const parentCategory = primaryCat?.category?.parent;

                  return (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-3">
                        {/* Parent Sector if exists */}
                        {parentCategory && (
                          <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                              Healthcare Sector
                            </h3>
                            <Link
                              href={`/category/${parentCategory.slug}`}
                              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black bg-purple-600 text-white shadow-xs hover:bg-purple-700 transition-colors"
                            >
                              <span>{parentCategory.name}</span>
                              <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-md uppercase tracking-wider">Sector</span>
                            </Link>
                          </div>
                        )}

                        {/* Primary Category */}
                        {primaryCat && (
                          <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                              {parentCategory ? "Primary Healthcare Subcategory" : "Primary Category"}
                            </h3>
                            <Link
                              href={`/category/${primaryCat.category.slug}`}
                              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 transition-colors"
                            >
                              <span>{primaryCat.category.name}</span>
                              <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-md uppercase tracking-wider">Primary</span>
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Subcategories & Specializations Chips */}
                      {derivedSubcategories.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Healthcare Subcategories & Specializations ({derivedSubcategories.length})
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            {derivedSubcategories.map((sub) => (
                              <span
                                key={sub}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs"
                              >
                                <span>{sub}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

                {/* Scraped Place ID & Verification Data Badge */}
                {business.externalPlaceId && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Google Places Verified Healthcare Data
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      ID: {business.externalPlaceId.substring(0, 20)}
                    </span>
                  </div>
                )}
            </section>


            {/* MOBILE ONLY SERVICES SECTION (COLLAPSIBLE DROPDOWN) */}
            <section id="section-services-mobile" className="block lg:hidden bg-white rounded-none border-y border-slate-200/90 shadow-2xs">
              <button
                onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  <h2 className="text-sm font-black text-slate-900">Services</h2>
                  {business.services.length > 0 && (
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-none ml-1">
                      {business.services.length}
                    </span>
                  )}
                </div>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200", servicesDropdownOpen && "rotate-180")} />
              </button>

              {servicesDropdownOpen && (
                <div className="px-4 pb-4 pt-1.5 border-t border-slate-100 animate-in fade-in-50 duration-200">
                  {business.services.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {business.services.map((service) => (
                        <span
                          key={service.id}
                          className="bg-purple-50/80 border border-purple-200/70 text-purple-900 font-bold text-xs px-3 py-1.5 rounded-none flex items-center gap-1.5 shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5 text-purple-600 stroke-[3] shrink-0" />
                          <span>{service.name}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 font-medium">No services listed yet.</p>
                  )}
                </div>
              )}
            </section>

            {/* ========================================================= */}
            {/* 4. SERVICES / CATALOG SECTION (DESKTOP ONLY) */}
            {/* ========================================================= */}
            <section id="section-services" className="hidden lg:block bg-white rounded-none border border-slate-200/90 lg:border-0 p-4 lg:p-6 space-y-3 shadow-2xs lg:shadow-none">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  <h2 className="text-sm sm:text-base font-bold text-slate-800">Services & Offerings</h2>
                </div>
                {business.services.length > 0 && (
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-none">
                    {business.services.length} Services
                  </span>
                )}
              </div>

              {business.services.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {business.services.map((service) => (
                    <span
                      key={service.id}
                      className="bg-purple-50/80 hover:bg-purple-100/90 border border-purple-200/70 text-purple-900 font-bold text-xs px-3 py-1.5 rounded-none flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5 text-purple-600 stroke-[3] shrink-0" />
                      <span>{service.name}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-medium">No services listed yet.</p>
              )}
            </section>

            {/* ========================================================= */}
            {/* 4b. PRODUCTS & SERVICES CATALOG (only when the owner has added items) */}
            {/* ========================================================= */}
            {business.products.length > 0 && (
              <section id="section-products" className="bg-white rounded-none border-y border-slate-200/90 lg:border-0 p-4 lg:p-6 space-y-3 shadow-2xs lg:shadow-none">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-600" />
                    <h2 className="text-sm sm:text-base font-black text-slate-900">Products & Services Catalog</h2>
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-none">
                    {business.products.length} Items
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-0.5">
                  {business.products.map((product) => (
                    <div key={product.id} className="border border-slate-200/90 rounded-none overflow-hidden flex flex-col">
                      <div className="relative h-24 sm:h-32 w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={`${product.name} — ${business.name}`}
                            fill
                            sizes="(min-width: 640px) 33vw, 50vw"
                            className="object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="p-2.5 space-y-0.5">
                        {product.category && (
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-purple-600">{product.category}</span>
                        )}
                        <h4 className="font-bold text-xs text-slate-900 leading-tight">{product.name}</h4>
                        {product.price != null && <p className="text-xs font-black text-slate-900">₹{product.price}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}


            {/* ========================================================= */}
            {/* 5. BUSINESS GALLERY SECTION */}
            {/* ========================================================= */}
            {business.isClaimed && (
              <section id="section-photos" className="bg-white rounded-none border border-slate-200/90 lg:border-0 p-4 lg:p-8 space-y-4 lg:space-y-5 shadow-2xs lg:shadow-none">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-purple-600" />
                    <h2 className="text-sm sm:text-base font-bold text-slate-800">Photo Gallery</h2>
                  </div>
                  {galleryImages.length > 0 && (
                    <Link
                      href={`/business/${business.slug}/gallery`}
                      className="text-xs font-extrabold text-purple-600 hover:underline flex items-center gap-1"
                    >
                      <span>View All Gallery</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>

                {galleryImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {galleryImages.map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => setLightboxIndex(idx)}
                        className="relative h-36 sm:h-44 lg:h-48 rounded-none overflow-hidden bg-slate-900 cursor-pointer group border border-slate-200/80"
                      >
                        <Image
                          src={item.url}
                          alt={`${business.name} photo ${idx + 1}`}
                          fill
                          sizes="(min-width: 640px) 33vw, 50vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/10 transition-colors" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-medium">No photos uploaded yet.</p>
                )}
              </section>
            )}


            {/* ========================================================= */}
            {/* AMENITIES & FACILITIES SECTION */}
            {/* ========================================================= */}
            <section id="section-amenities" className="bg-white rounded-none border border-slate-200/90 lg:border-0 p-4 lg:p-6 space-y-3 shadow-2xs lg:shadow-none mt-4 lg:mt-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-sm sm:text-base font-bold text-slate-800">Amenities & Medical Facilities</h2>
                </div>
                {business.amenities.length > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-none">
                    {business.amenities.length} Features
                  </span>
                )}
              </div>

              {business.amenities.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {business.amenities.map((a) => (
                    <div
                      key={a.amenity.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{a.amenity.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {[
                    "24/7 Emergency Care",
                    "Wheelchair Accessible",
                    "ICU & Critical Care",
                    "Air Conditioned Rooms",
                    "In-House Diagnostics & Lab",
                    "24/7 Pharmacy Onsite",
                    "Card & Digital Payments",
                    "Spacious Visitor Parking",
                    "Power Backup 24/7",
                  ].map((facility) => (
                    <div
                      key={facility}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{facility}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>


            {/* ========================================================= */}
            {/* PAYMENT METHODS & INSURANCE SECTION */}
            {/* ========================================================= */}
            <section id="section-payments" className="bg-white rounded-none border border-slate-200/90 lg:border-0 p-4 lg:p-6 space-y-3 shadow-2xs lg:shadow-none mt-4 lg:mt-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4 text-purple-600" />
                  <h2 className="text-sm sm:text-base font-bold text-slate-800">Accepted Payment Methods & Insurance</h2>
                </div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-none">
                  Cashless TPA Accepted
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Mode 1: Cash & Digital */}
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    💳 Cash, UPI & Digital Payments
                  </h3>
                  <p className="text-[11px] font-medium text-slate-600">
                    GPay, PhonePe, Paytm, BHIM UPI, Credit & Debit Cards (Visa, Mastercard, RuPay), Net Banking & No-Cost Medical EMI options.
                  </p>
                </div>

                {/* Mode 2: TPA Insurance */}
                <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200/70 space-y-1.5">
                  <h3 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    🏥 Health Insurance & Cashless TPA
                  </h3>
                  <p className="text-[11px] font-medium text-purple-900">
                    Cashless hospitalization available for Star Health, ICICI Lombard, HDFC ERGO, Niva Bupa, Care Health, Medi Assist & Paramount TPA.
                  </p>
                </div>
              </div>
            </section>


            {/* ========================================================= */}
            {/* 6. REVIEWS & RATINGS SECTION */}
            {/* ========================================================= */}
            <section id="section-reviews" className="bg-white rounded-none border border-slate-200/90 lg:border-0 p-4 lg:p-6 space-y-4 shadow-2xs lg:shadow-none">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <h2 className="text-base lg:text-lg font-black text-slate-900 flex items-center gap-2">
                    Rating & Reviews
                    <span className="inline-flex items-center gap-0.5 bg-emerald-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-sm">
                      <span>{business.avgRating.toFixed(1)}</span>
                      <Star className="w-3 h-3 fill-current" />
                    </span>
                  </h2>
                </div>
                {business.reviews.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => scrollReviews("left")}
                      className="p-1 bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-purple-600 border border-slate-200 rounded-none transition-colors cursor-pointer"
                      aria-label="Previous reviews"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => scrollReviews("right")}
                      className="p-1 bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-purple-600 border border-slate-200 rounded-none transition-colors cursor-pointer"
                      aria-label="Next reviews"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Review Summary & Write Action (below Rating & Reviews title) */}
              <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-50/70 border border-slate-200/60 p-3 rounded-none">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <div className="space-y-0.5">
                    <div
                      className="flex items-center gap-0.5 sm:gap-1 text-amber-500"
                      onMouseLeave={() => setQuickHoverRating(0)}
                    >
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleQuickStarClick(s)}
                          onMouseEnter={() => setQuickHoverRating(s)}
                          className="cursor-pointer p-0.5 -m-0.5 transition-transform hover:scale-110"
                          aria-label={`Rate ${s} star${s > 1 ? "s" : ""}`}
                        >
                          <Star
                            className={cn(
                              "w-4 h-4 sm:w-5 sm:h-5",
                              s <= (quickHoverRating || Math.round(business.avgRating)) ? "fill-current" : "text-slate-300"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-semibold">Tap a star to rate</p>
                  </div>
                </div>
                <button
                  onClick={handleWriteReviewClick}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] sm:text-xs rounded-none shadow-2xs transition-all cursor-pointer shrink-0"
                >
                  Continue ✍️
                </button>
              </div>

              {/* Carousel container for written reviews */}
              {business.reviews.length > 0 ? (
                <div
                  ref={reviewsCarouselRef}
                  className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none py-1.5 -mx-1 px-1 scroll-smooth"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  {business.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="min-w-[85%] sm:min-w-[55%] lg:min-w-[45%] snap-start bg-white border border-slate-200/80 p-3.5 rounded-none flex flex-col justify-between space-y-3 hover:border-purple-200/80 transition-colors shadow-2xs"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-black text-[11px] flex items-center justify-center overflow-hidden shrink-0">
                              {review.user?.avatarUrl ? (
                                // Reviewer avatars can come from any OAuth provider or the profile-pics R2 bucket —
                                // an unbounded host set next/image can't safely allow-list, unlike the single
                                // controlled business-image bucket used everywhere else on this page.
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={review.user.avatarUrl} alt={review.user.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{(review.user?.name ?? "H").charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-900 truncate">{review.user?.name ?? "Hubigo User"}</p>
                              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                                {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 bg-emerald-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-sm shrink-0">
                            <span>{review.rating.toFixed(1)}</span>
                            <Star className="w-2.5 h-2.5 fill-current" />
                          </div>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-relaxed break-words line-clamp-3">
                          {review.comment}
                        </p>
                      </div>

                      {review.ownerReply && (
                        <div className="bg-slate-50 border-l-2 border-purple-500 p-2.5 rounded-none mt-1">
                          <p className="text-[10px] font-extrabold text-purple-700">Reply from {business.name}:</p>
                          <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-normal line-clamp-2">{review.ownerReply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 space-y-1">
                  <p className="text-xs font-black text-slate-700">No written reviews on Hubigo yet</p>
                  <p className="text-[11px] text-slate-400">Be the first to share your experience with {business.name}.</p>
                </div>
              )}
            </section>



            {/* ========================================================= */}
            {/* 7. FAQ SECTION */}
            {/* ========================================================= */}
            <FaqAccordion faqs={faqs} />


            {/* ========================================================= */}
            {/* 9. SIMILAR BUSINESSES NEARBY SECTION */}
            {/* ========================================================= */}
            {similarBusinesses.length > 0 && (
              <section className="bg-white rounded-none border border-slate-200/90 lg:border-0 -mt-[1px] lg:mt-0 p-4 lg:p-6 space-y-4 shadow-2xs lg:shadow-none">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">Explore Similar Healthcare Centers</h3>
                  <Link
                    href={primaryCategory?.slug ? `/nearby?subcategory=${primaryCategory.slug}` : "/nearby"}
                    className="text-[10px] sm:text-xs font-bold text-purple-600 hover:underline shrink-0 whitespace-nowrap"
                  >
                    Explore Nearby →
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                  {similarBusinesses.map((sim) => (
                    <Link
                      key={sim.id}
                      href={`/business/${sim.slug}`}
                      className="bg-white rounded-none border border-slate-200/80 p-1.5 sm:p-3 shadow-2xs hover:shadow-md transition-all group space-y-2.5"
                    >
                      <div className="relative h-16 sm:h-28 lg:h-32 w-full rounded-none bg-slate-100 overflow-hidden">
                        {sim.coverImageUrl ? (
                          <Image
                            src={sim.coverImageUrl}
                            alt={`${sim.name} in ${sim.cityName}`}
                            fill
                            sizes="33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Store className="w-8 h-8" />
                          </div>
                        )}
                        <span className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-slate-900/80 text-white text-[8px] sm:text-[9px] font-black px-1 sm:px-2 py-0.5 rounded-none flex items-center gap-0.5">
                          <Star className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-amber-400 fill-amber-400" /> {sim.avgRating.toFixed(1)}
                        </span>
                        {sim.isVerified && (
                          <span className="absolute top-1 sm:top-2 right-1 sm:right-2">
                            <VerifiedBadge size="xs" iconOnly />
                          </span>
                        )}
                      </div>

                      <div>
                        {sim.primaryCategoryName && (
                          <span className="text-[8px] sm:text-[9px] font-extrabold uppercase text-purple-700 bg-purple-50 px-1 sm:px-2 py-0.5 rounded-none">
                            {sim.primaryCategoryName}
                          </span>
                        )}
                        <h4 className="font-extrabold text-[10px] sm:text-xs text-slate-900 group-hover:text-purple-600 transition-colors mt-1 truncate">
                          {sim.name}
                        </h4>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-0.5 truncate">📍 {sim.localityName ?? sim.cityName}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

          </div>


          {/* ========================================================= */}
          {/* RIGHT STICKY SIDEBAR */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">

            {/* 10. CLAIM BUSINESS CTA CARD */}
            {!business.isClaimed && (
              <div className="bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-white rounded-none p-6 shadow-xl border border-purple-500/20 space-y-4 text-center relative overflow-hidden">
                <div className="w-14 h-14 rounded-none bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto shadow-md">
                  <Store className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white">Are you the owner or doctor of this Healthcare Facility?</h3>
                  <p className="text-xs text-purple-200 font-medium leading-relaxed">
                    Claim this medical listing to manage facility details, update OPD timings, respond to patient reviews, and verify credentials on Hubigo Healthcare.
                  </p>
                </div>

                <div className="space-y-2 text-left text-xs font-bold text-slate-200 bg-white/10 p-3.5 rounded-none border border-white/15">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Update doctor profiles, OPD & facility hours</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>List specialties, treatments & insurance TPAs</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Respond directly to patient reviews</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Receive patient inquiries & appointment leads</span>
                  </div>
                </div>

                <Link
                  href={`/business/${business.slug}/claim`}
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-none shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Claim Healthcare Listing</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* 11. REPORT / SUGGEST EDIT */}
            <div className="bg-white rounded-none border border-slate-200/80 p-4 text-center space-y-2">
              <span className="text-xs font-bold text-slate-500">Notice incorrect information?</span>
              <div className="flex justify-center gap-3 text-xs font-extrabold text-purple-600">
                <button onClick={handleOpenSuggestEdit} className="hover:underline cursor-pointer flex items-center gap-1">
                  <Edit3 className="w-3.5 h-3.5" /> Suggest Edit
                </button>
                <span>•</span>
                <button onClick={handleOpenReportListing} className="hover:underline cursor-pointer flex items-center gap-1 text-rose-600">
                  <Flag className="w-3.5 h-3.5" /> Report Listing
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* MOBILE STICKY BOTTOM ACTION BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 p-2.5 shadow-2xl flex items-center gap-2 overflow-x-auto scrollbar-none">
        {business.phone && (
          <a
            href={`tel:${business.phone}`}
            onClick={handleCallClick}
            className="shrink-0 min-w-[110px] py-2.5 bg-purple-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Phone className="w-4 h-4" />
            <span>Call</span>
          </a>
        )}

        {business.whatsappPhone && (
          <a
            href={`https://wa.me/${business.whatsappPhone.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            className="shrink-0 min-w-[110px] py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>
        )}

        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 min-w-[110px] py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
        >
          <Navigation className="w-4 h-4" />
          <span>Directions</span>
        </a>

        <button
          onClick={handleMessageClick}
          className="shrink-0 min-w-[110px] py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Mail className="w-4 h-4" />
          <span>Enquire</span>
        </button>
      </div>

      {/* LIGHTBOX MODAL */}
      {lightboxIndex !== null && galleryImages[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-950 rounded-none overflow-hidden border border-slate-800 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800 text-white">
              <span className="font-bold text-xs">{business.name}</span>
              <button onClick={() => setLightboxIndex(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative h-[420px] flex items-center justify-center bg-black">
              <Image
                src={galleryImages[lightboxIndex].url}
                alt={`${business.name} photo ${lightboxIndex + 1}`}
                fill
                sizes="(min-width: 896px) 896px, 100vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* WRITE REVIEW MODAL */}
      {showWriteReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-none border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900">Write a Review for {business.name}</h3>
              <button
                onClick={() => {
                  setShowWriteReviewModal(false);
                  setReviewSubmittedSuccess(false);
                  setReviewError(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!reviewSubmittedSuccess ? (
              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs font-semibold">
                {/* Interactive Star Rating Selector */}
                <div className="space-y-1.5 bg-[#f8fafc] border border-slate-200/80 p-3.5 rounded-none">
                  <div className="flex items-center justify-between">
                    <label className="block font-extrabold text-slate-800">
                      Your Rating <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-none border border-amber-200 shadow-2xs">
                      {hoverRating || reviewRating} {(hoverRating || reviewRating) === 1 ? "Star" : "Stars"}{" "}
                      {RATING_LABELS[hoverRating || reviewRating] ? `• ${RATING_LABELS[hoverRating || reviewRating]}` : ""}
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-1.5 pt-1"
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    {[1, 2, 3, 4, 5].map((star) => {
                      const activeScore = hoverRating || reviewRating;
                      const isFilled = star <= activeScore;

                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          className="p-1 focus:outline-none transition-transform hover:scale-125 cursor-pointer rounded-none hover:bg-amber-100/60"
                          title={`Rate ${star} star${star > 1 ? "s" : ""}`}
                        >
                          <Star
                            className={cn(
                              "w-7 h-7 transition-colors duration-150",
                              isFilled
                                ? "text-amber-400 fill-amber-400 drop-shadow-xs"
                                : "text-slate-300 fill-slate-100/80"
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Review Comment Textarea */}
                <div className="space-y-1">
                  <label className="block font-extrabold text-slate-800">
                    Your Review <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share details of your experience at this business..."
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-medium text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {reviewError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-none text-[11px] font-semibold text-rose-700">
                    {reviewError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-none shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingReview ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting Review...</span>
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 fill-current text-white" />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-none space-y-3 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-base text-emerald-950">Thank You for Your Review!</h4>
                  <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                    Your <strong>{reviewRating}-star</strong> review for <strong>{business.name}</strong> is now live on this page.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowWriteReviewModal(false);
                    setReviewSubmittedSuccess(false);
                    setReviewComment("");
                    setReviewRating(5);
                    setReviewError(null);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-none shadow-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DEDICATED SUGGEST EDIT MODAL */}
      {showSuggestEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-none border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-purple-600">
                <Edit3 className="w-4 h-4" />
                <h3 className="font-black text-sm text-slate-900">Suggest Edit for {business.name}</h3>
              </div>
              <button onClick={() => setShowSuggestEditModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!editSubmittedSuccess ? (
              <form onSubmit={handleSubmitEditSuggestion} className="space-y-3 text-xs font-semibold">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Feedback Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-none text-slate-800 font-bold focus:outline-none focus:border-purple-600"
                  >
                    <option>Incorrect Address or Location</option>
                    <option>Wrong Phone Number or Contact</option>
                    <option>Outdated Working Hours</option>
                    <option>Closed or Relocated Business</option>
                    <option>Wrong Category or Services Offered</option>
                    <option>Incorrect Website or Social Links</option>
                    <option>Other Information Correction</option>
                  </select>
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Details & Proposed Corrections</label>
                  <textarea
                    rows={4}
                    required
                    value={editDetails}
                    onChange={(e) => setEditDetails(e.target.value)}
                    placeholder="Please describe the exact corrections needed (e.g., correct address, updated phone, new operating hours)..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-none font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600"
                  />
                </div>

                {editError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-none text-[11px] font-semibold text-rose-700">
                    {editError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingEdit || !editDetails.trim()}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-none shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingEdit ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Suggestion...</span>
                    </>
                  ) : (
                    <span>Submit Edit Suggestion</span>
                  )}
                </button>
              </form>
            ) : (
              <div className="p-6 bg-purple-50 border border-purple-200 rounded-none space-y-3 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-base text-purple-950">Thank You!</h4>
                  <p className="text-xs text-purple-800 font-medium leading-relaxed">
                    Your edit suggestion for <strong>{business.name}</strong> has been logged and sent to Hubigo moderators for review.
                  </p>
                </div>
                <button
                  onClick={() => setShowSuggestEditModal(false)}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-none shadow-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DEDICATED REPORT LISTING MODAL */}
      {showReportListingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-none border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <Flag className="w-4 h-4" />
                <h3 className="font-black text-sm text-slate-900">Report Listing: {business.name}</h3>
              </div>
              <button onClick={() => setShowReportListingModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!reportSubmittedSuccess ? (
              <form onSubmit={handleSubmitReportListing} className="space-y-3 text-xs font-semibold">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Reason for Reporting</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-2.5 bg-rose-50/50 border border-rose-200 rounded-none text-slate-900 font-bold focus:outline-none focus:border-rose-500"
                  >
                    <option>Fake or Fraudulent Business</option>
                    <option>Spam or Misleading Content</option>
                    <option>Closed / Permanently Out of Business</option>
                    <option>Inappropriate / Offensive Images or Text</option>
                    <option>Duplicate Listing</option>
                    <option>Unauthorized Business Owner Claim</option>
                    <option>Violation of Terms of Service</option>
                  </select>
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Reason & Explanation Details</label>
                  <textarea
                    rows={4}
                    required
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Please explain why this business listing is being reported to our compliance team..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-none font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
                  />
                </div>

                {reportError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-none text-[11px] font-semibold text-rose-700">
                    {reportError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingReport || !reportDetails.trim()}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-none shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingReport ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting Report...</span>
                    </>
                  ) : (
                    <span>Submit Report to Compliance</span>
                  )}
                </button>
              </form>
            ) : (
              <div className="p-6 bg-amber-50 border border-amber-200 rounded-none space-y-3 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                  <Flag className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-base text-amber-950">Report Submitted</h4>
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    Our compliance team has received your report for <strong>{business.name}</strong> and will audit this listing within 24 hours.
                  </p>
                </div>
                <button
                  onClick={() => setShowReportListingModal(false)}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-none shadow-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message Business Modal */}
      {showMessageBox && business && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-none max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Message {business.name}</h3>
              <button onClick={() => setShowMessageBox(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            {messageSent ? (
              <p className="text-xs font-bold text-emerald-600 py-4 text-center">✓ Message sent! The business will get back to you.</p>
            ) : (
              <>
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="What would you like to ask?"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-none text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-600 resize-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={messageSending || !messageText.trim()}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-none shadow-md cursor-pointer disabled:opacity-60"
                >
                  {messageSending ? "Sending..." : "Send Message"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar — desktop only; mobile uses the inline "Enquire" icon button
          in the action row above instead. */}
      <div className="hidden lg:flex fixed bottom-0 left-0 lg:left-64 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 sm:p-3 shadow-lg items-center justify-center">
        <div className="max-w-md w-full">
          <button
            onClick={handleMessageClick}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm rounded-none shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Enquire Now</span>
          </button>
        </div>
      </div>

    </div>
  );
}
