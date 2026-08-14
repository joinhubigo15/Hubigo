"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth-context";
import { getCategories, getCities, getAmenities, type CategoryOption, type CityOption, type AmenityOption } from "@/app/lib/search-api";
import { createBusinessRequest } from "@/app/lib/api";
import {
  uploadDashboardLogo,
  uploadDashboardCover,
  uploadDashboardGallery,
  updateDashboardHours,
  updateDashboardAmenities,
  type DashboardHours,
} from "@/app/lib/business-dashboard-api";
import {
  Building2,
  MapPin,
  Phone,
  MessageSquare,
  Globe,
  Upload,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Eye,
  Loader2,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

const STEPS = [
  { id: 1, name: "Business Info", icon: Building2 },
  { id: 2, name: "Contact & Location", icon: MapPin },
  { id: 3, name: "Hours & Amenities", icon: Clock },
  { id: 4, name: "Media & Photos", icon: ImageIcon },
  { id: 5, name: "Preview & Publish", icon: Eye },
];

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABEL: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function defaultHours(): DashboardHours[] {
  return DAY_ORDER.map((day) => ({ day, openTime: "09:00", closeTime: "18:00", isClosed: false }));
}

interface FormState {
  name: string;
  description: string;
  sectorId: string;
  categoryId: string;
  cityId: string;
  newCityName: string;
  newCityState: string;
  address: string;
  pincode: string;
  phone: string;
  whatsappPhone: string;
  website: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  sectorId: "",
  categoryId: "",
  cityId: "",
  newCityName: "",
  newCityState: "",
  address: "",
  pincode: "",
  phone: "",
  whatsappPhone: "",
  website: "",
};

function useTaxonomy() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [amenities, setAmenities] = useState<AmenityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getCategories(), getCities(), getAmenities()])
      .then(([c, ci, am]) => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount is intentional
        setCategories(c);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount is intentional
        setCities(ci);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount is intentional
        setAmenities(am);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load categories/cities"))
      .finally(() => setLoading(false));
  }, []);

  return { categories, cities, amenities, loading, error };
}

export default function BusinessRegisterPage() {
  const { user, accessToken, initializing } = useAuth();
  const router = useRouter();
  const isBusinessAccount =
    !!user && (user.role === "business_owner" || user.role === "admin" || user.role === "super_admin");

  useEffect(() => {
    if (initializing) return;
    if (!user) {
      router.replace("/login?reason=business_required&next=/business/register");
    } else if (!isBusinessAccount) {
      router.replace("/login?reason=business_required");
    }
  }, [initializing, user, isBusinessAccount, router]);

  const [currentStep, setCurrentStep] = useState(1);
  const [isPublished, setIsPublished] = useState(false);
  const [publishedBusiness, setPublishedBusiness] = useState<{ name: string; slug: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photoUploadWarning, setPhotoUploadWarning] = useState<string | null>(null);

  const { categories, cities, amenities, loading: taxonomyLoading, error: taxonomyError } = useTaxonomy();

  // Restored from localStorage on mount (below) if a draft exists — a refresh mid-wizard shouldn't
  // silently wipe everything the owner already typed. Only the text fields + step are persisted;
  // File objects (logo/cover/gallery) can't survive localStorage, so those are re-picked after a
  // refresh regardless. Cleared only once the listing actually publishes — see handlePublish.
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [cityNotListed, setCityNotListed] = useState(false);
  const [hours, setHours] = useState<DashboardHours[]>(defaultHours());
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);
  const [draftRestored, setDraftRestored] = useState(false);

  const DRAFT_STORAGE_KEY = "hubigo_business_register_draft";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as {
          formData: FormState;
          currentStep: number;
          cityNotListed: boolean;
          hours?: DashboardHours[];
          selectedAmenityIds?: string[];
        };
        setFormData((prev) => ({ ...prev, ...draft.formData }));
        setCurrentStep(draft.currentStep || 1);
        setCityNotListed(!!draft.cityNotListed);
        if (draft.hours?.length === 7) setHours(draft.hours);
        if (draft.selectedAmenityIds) setSelectedAmenityIds(draft.selectedAmenityIds);
      }
    } catch {
      // Corrupt/foreign draft data — ignore and start fresh rather than crash the page.
    } finally {
      setDraftRestored(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore-on-mount only
  }, []);

  // Skips the very first render (draftRestored still false) so this doesn't immediately overwrite
  // the just-restored draft with EMPTY_FORM before restoration has run.
  useEffect(() => {
    if (!draftRestored) return;
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ formData, currentStep, cityNotListed, hours, selectedAmenityIds })
      );
    } catch {
      // Storage full/unavailable (private browsing, etc.) — draft persistence is a convenience,
      // not a requirement, so fail silently rather than interrupt the form.
    }
  }, [formData, currentStep, cityNotListed, hours, selectedAmenityIds, draftRestored]);

  const updateForm = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const onCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  };

  // Must match backend's MAX_GALLERY_IMAGES (profile.service.ts) — the upload endpoint hard-rejects
  // anything past this, so the wizard can't let a user pick more than it can actually save.
  const MAX_GALLERY_PHOTOS = 5;

  const onGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_GALLERY_PHOTOS);
    setGalleryFiles(files);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const validate = (): string | null => {
    if (!formData.name.trim()) return "Business name is required.";
    if (!formData.sectorId) return "Select a business sector.";
    if (!formData.categoryId) return "Select a subcategory.";
    if (cityNotListed) {
      if (!formData.newCityName.trim() || !formData.newCityState.trim()) return "Enter your city name and state.";
    } else if (!formData.cityId) {
      return "Select a city.";
    }
    if (!formData.address.trim()) return "Enter a full address.";
    if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) return "Enter a valid 10-digit phone number.";
    return null;
  };

  const handlePublish = async () => {
    // Defense in depth against a double form-submit (double-click, double Enter) — the button is
    // already disabled while submitting, but this guard makes re-entrancy impossible even if that
    // UI guard is ever bypassed (e.g. a second synchronous event before React re-renders).
    if (submitting) return;

    const validationError = validate();
    if (validationError) {
      setSubmitError(validationError);
      setCurrentStep(1);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await createBusinessRequest(accessToken!, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        categoryId: formData.categoryId,
        ...(cityNotListed
          ? { newCityName: formData.newCityName.trim(), newCityState: formData.newCityState.trim() }
          : { cityId: formData.cityId }),
        address: formData.address.trim(),
        pincode: formData.pincode.trim() || undefined,
        phone: formData.phone.trim(),
        whatsappPhone: formData.whatsappPhone.trim() || undefined,
        website: formData.website.trim() || undefined,
      });

      // The listing itself is now live — that's the meaningful success, and it must be shown
      // regardless of what happens next. A logo/cover/gallery upload hiccup after this point used
      // to land in the same catch block below and hide the success screen entirely, even though
      // the business already existed — the owner would see an error, assume nothing happened, and
      // resubmit the whole form, creating a duplicate listing. Uploads are now best-effort: shown
      // as a non-blocking warning on the success screen instead of masking the real outcome.
      setPublishedBusiness({ name: created.name, slug: created.slug });
      setIsPublished(true);
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // Non-critical — worst case a stale draft lingers until manually overwritten.
      }

      const followUpWarnings: string[] = [];
      if (logoFile) {
        await uploadDashboardLogo(accessToken!, logoFile).catch(() => followUpWarnings.push("logo"));
      }
      if (coverFile) {
        await uploadDashboardCover(accessToken!, coverFile).catch(() => followUpWarnings.push("cover photo"));
      }
      if (galleryFiles.length) {
        await uploadDashboardGallery(accessToken!, galleryFiles).catch(() => followUpWarnings.push("gallery photos"));
      }
      // Hours default to a sensible 9-6 every day even if the owner never touched Step 3, so this
      // always saves. Amenities only save if at least one was actually picked — an empty PUT would
      // needlessly overwrite nothing into nothing, but skipping it entirely if untouched is cleaner.
      await updateDashboardHours(accessToken!, hours).catch(() => followUpWarnings.push("business hours"));
      if (selectedAmenityIds.length) {
        await updateDashboardAmenities(accessToken!, selectedAmenityIds).catch(() => followUpWarnings.push("amenities"));
      }
      if (followUpWarnings.length) {
        setPhotoUploadWarning(
          `Your listing is live, but the ${followUpWarnings.join(", ")} didn't save — add ${followUpWarnings.length > 1 ? "them" : "it"} from your Business Dashboard.`
        );
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to publish your listing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (initializing || !user || !isBusinessAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#f1f4f9] min-h-screen px-4 lg:px-8 py-6 flex flex-col gap-6 font-sans">

      {/* Wizard Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-sm shadow-slate-200/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Create Your Business Listing
          </h1>
          <p className="text-xs text-slate-500 font-semibold">
            Get discovered by thousands of nearby customers on Hubigo in minutes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-900">
              Step {currentStep} of {STEPS.length}
            </div>
            <div className="text-[10px] text-purple-600 font-bold">
              {STEPS[currentStep - 1].name}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200/80 text-purple-700 flex items-center justify-center font-black text-sm shadow-2xs">
            {currentStep}/{STEPS.length}
          </div>
        </div>
      </div>

      {/* Progress Step Navigation Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-sm shadow-slate-200/50 overflow-x-auto scrollbar-none">
        <div className="flex items-center justify-between min-w-[600px] px-2">
          {STEPS.map((s, idx) => {
            const isCompleted = currentStep > s.id;
            const isCurrent = currentStep === s.id;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep(s.id)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                    isCurrent
                      ? "bg-purple-600 border-purple-600 text-white shadow-xs shadow-purple-600/30"
                      : isCompleted
                      ? "bg-purple-50/80 border-purple-200 text-purple-800"
                      : "bg-[#f8fafc] border-slate-200/80 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
                      isCurrent
                        ? "bg-white text-purple-600"
                        : isCompleted
                        ? "bg-purple-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    )}
                  >
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : s.id}
                  </div>
                  <span>{s.name}</span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={cn("h-0.5 w-6 rounded-full", currentStep > s.id ? "bg-purple-600" : "bg-slate-200")} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Form Container */}
      {!isPublished ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm shadow-slate-200/50 max-w-4xl mx-auto w-full space-y-6">

          {submitError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* STEP 1: Business Information */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="border-b border-slate-200/80 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">General Business Information</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Help customers understand who you are and what you do.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Business Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Royal Continental Restaurant"
                    value={formData.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-500/15 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Business Sector <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.sectorId}
                      onChange={(e) => {
                        updateForm("sectorId", e.target.value);
                        updateForm("categoryId", "");
                      }}
                      disabled={taxonomyLoading}
                      className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white disabled:opacity-50"
                    >
                      <option value="">{taxonomyLoading ? "Loading…" : "Select a sector"}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Subcategory <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => updateForm("categoryId", e.target.value)}
                      disabled={!formData.sectorId}
                      className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white disabled:opacity-50"
                    >
                      <option value="">{formData.sectorId ? "Select a subcategory" : "Pick a sector first"}</option>
                      {(categories.find((c) => c.id === formData.sectorId)?.subcategories ?? []).map((sub) => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                  {taxonomyError && <p className="text-[11px] text-rose-600 font-semibold sm:col-span-2">{taxonomyError}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Business Description</label>
                  <textarea
                    rows={4}
                    placeholder="Tell customers about your offerings, specialties, and experience..."
                    value={formData.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Contact Details & Location */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="border-b border-slate-200/80 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Contact Details & Location</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    How customers can contact, visit, and reach out directly.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Enter phone number"
                        value={formData.phone}
                        onChange={(e) => updateForm("phone", e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">WhatsApp Business Number</label>
                    <div className="relative">
                      <MessageSquare className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Enter WhatsApp number"
                        value={formData.whatsappPhone}
                        onChange={(e) => updateForm("whatsappPhone", e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Website URL</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Enter your website URL"
                      value={formData.website}
                      onChange={(e) => updateForm("website", e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Street Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your business address"
                    value={formData.address}
                    onChange={(e) => updateForm("address", e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">
                        City <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setCityNotListed((v) => !v)}
                        className="text-[10px] font-bold text-purple-600 hover:underline cursor-pointer"
                      >
                        {cityNotListed ? "Choose from list instead" : "My city isn't listed"}
                      </button>
                    </div>
                    {cityNotListed ? (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="City name"
                          value={formData.newCityName}
                          onChange={(e) => updateForm("newCityName", e.target.value)}
                          className="w-full px-3 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={formData.newCityState}
                          onChange={(e) => updateForm("newCityState", e.target.value)}
                          className="w-full px-3 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                        />
                      </div>
                    ) : (
                      <select
                        value={formData.cityId}
                        onChange={(e) => updateForm("cityId", e.target.value)}
                        disabled={taxonomyLoading}
                        className="w-full px-3 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none disabled:opacity-50"
                      >
                        <option value="">{taxonomyLoading ? "Loading cities…" : "Select a city"}</option>
                        {cities.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}, {c.state}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Pincode</label>
                    <input
                      type="text"
                      placeholder="Enter pincode"
                      value={formData.pincode}
                      onChange={(e) => updateForm("pincode", e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Hours & Amenities */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="border-b border-slate-200/80 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Hours & Amenities</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Optional — you can also set these later from your Business Dashboard.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700">Business Hours</h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {hours.map((h, i) => (
                    <div key={h.day} className="flex items-center gap-3 px-4 py-2.5 bg-[#f8fafc]">
                      <span className="w-20 shrink-0 text-xs font-bold text-slate-700">{DAY_LABEL[h.day]}</span>
                      {h.isClosed ? (
                        <span className="flex-1 text-[11px] font-semibold text-slate-400">Closed</span>
                      ) : (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="time"
                            value={h.openTime ?? "09:00"}
                            onChange={(e) => {
                              const next = [...hours];
                              next[i] = { ...h, openTime: e.target.value };
                              setHours(next);
                            }}
                            className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                          />
                          <span className="text-slate-400 text-xs">to</span>
                          <input
                            type="time"
                            value={h.closeTime ?? "18:00"}
                            onChange={(e) => {
                              const next = [...hours];
                              next[i] = { ...h, closeTime: e.target.value };
                              setHours(next);
                            }}
                            className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                          />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...hours];
                          next[i] = { ...h, isClosed: !h.isClosed };
                          setHours(next);
                        }}
                        className={cn(
                          "shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer",
                          h.isClosed
                            ? "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                            : "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                        )}
                      >
                        {h.isClosed ? "Mark Open" : "Mark Closed"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" /> Amenities & Services
                </h3>
                {amenities.length === 0 ? (
                  <p className="text-[11px] text-slate-400 font-semibold">
                    {taxonomyLoading ? "Loading amenities…" : "No amenities available right now."}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {amenities.map((a) => {
                      const isSelected = selectedAmenityIds.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() =>
                            setSelectedAmenityIds((prev) =>
                              isSelected ? prev.filter((id) => id !== a.id) : [...prev, a.id]
                            )
                          }
                          className={cn(
                            "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer",
                            isSelected
                              ? "bg-purple-50 border-purple-600 text-purple-900"
                              : "bg-[#f8fafc] border-slate-200 text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          <span className="truncate">{a.name}</span>
                          <Check className={cn("w-3.5 h-3.5 shrink-0", isSelected ? "text-purple-600" : "text-slate-300")} />
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-[10px] text-slate-400 font-semibold">
                  Need an amenity that isn&apos;t listed? Add a custom one later from your Business Dashboard.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Media & Photos */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="border-b border-slate-200/80 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Media & Photos</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    High quality photos increase customer inquiries by up to 3x. All optional — you can add these later too.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Cover Image Upload */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Cover Photo (Banner)</label>
                  <label className="relative h-44 rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/30 overflow-hidden flex flex-col items-center justify-center p-4 group cursor-pointer block">
                    {coverPreview && (
                      <img src={coverPreview} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                    )}
                    <div className="relative z-10 text-center space-y-1 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-xs">
                      <Upload className="w-5 h-5 text-purple-600 mx-auto" />
                      <span className="text-xs font-bold text-slate-900 block">
                        {coverFile ? coverFile.name : "Upload Cover Banner"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">JPEG, PNG or WEBP up to 5MB</span>
                    </div>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onCoverChange} className="hidden" />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Logo */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Business Logo / Avatar</label>
                    <label className="border-2 border-dashed border-slate-200/90 rounded-2xl p-4 text-center bg-[#f8fafc] flex flex-col items-center gap-2 cursor-pointer">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo Preview" className="w-16 h-16 rounded-full object-cover border-2 border-purple-500 shadow-xs" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      <span className="text-xs font-bold text-purple-600">
                        {logoFile ? logoFile.name : "Upload Logo"}
                      </span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onLogoChange} className="hidden" />
                    </label>
                  </div>

                  {/* Photo Gallery */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Gallery Photos (up to {MAX_GALLERY_PHOTOS})</label>
                    <label className="border-2 border-dashed border-slate-200/90 rounded-2xl p-4 bg-[#f8fafc] space-y-2 cursor-pointer flex flex-col items-center justify-center h-[92px]">
                      <Upload className="w-4 h-4 text-purple-600" />
                      <span className="text-[11px] font-bold text-slate-700">
                        {galleryFiles.length > 0 ? `${galleryFiles.length} photo${galleryFiles.length > 1 ? "s" : ""} selected` : "Add gallery photos"}
                      </span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onGalleryChange} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Preview & Publish */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="border-b border-slate-200/80 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Listing Preview & Publish</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Review how your listing will appear to customers on Hubigo.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden max-w-md mx-auto">
                <div className="relative h-44 w-full bg-slate-100">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                    ★ New Listing
                  </div>
                  {logoPreview && (
                    <img src={logoPreview} alt="Logo" className="absolute -bottom-5 left-4 w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md" />
                  )}
                </div>

                <div className="p-4 pt-7 space-y-2">
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                    {categories.find((c) => c.id === formData.sectorId)?.subcategories.find((s) => s.id === formData.categoryId)?.name ?? "Category"}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {formData.name || "Your Business Name"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2">
                    {formData.description || "Add a description to tell customers about your business."}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 pt-1 border-t border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="truncate">
                      {formData.address || "—"}
                      {cityNotListed
                        ? formData.newCityName
                          ? `, ${formData.newCityName}`
                          : ""
                        : cities.find((c) => c.id === formData.cityId)
                          ? `, ${cities.find((c) => c.id === formData.cityId)!.name}`
                          : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Controls Footer Row */}
          <div className="flex items-center justify-between border-t border-slate-200/80 pt-6">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={cn(
                "px-5 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200/80",
                currentStep === 1
                  ? "opacity-40 cursor-not-allowed text-slate-400 bg-slate-100"
                  : "bg-white hover:bg-slate-100 text-slate-700 shadow-2xs"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/25 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{submitting ? "Publishing…" : "Publish Business Listing"}</span>
              </button>
            )}
          </div>

        </div>
      ) : (
        /* Celebration State upon Publish */
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-xl max-w-xl mx-auto w-full text-center space-y-5 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Your Business is Live 🎉</h2>
            <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto leading-relaxed">
              <span className="font-bold text-slate-800">{publishedBusiness?.name}</span> has been published on Hubigo. You can now manage leads, customer reviews, and offers from your dashboard.
            </p>
          </div>

          {photoUploadWarning && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold text-left max-w-md mx-auto">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{photoUploadWarning}</span>
            </div>
          )}

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/business-dashboard"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              Go to Business Dashboard
            </Link>
            {publishedBusiness && (
              <Link
                href={`/business/${publishedBusiness.slug}`}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                View Public Profile
              </Link>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
