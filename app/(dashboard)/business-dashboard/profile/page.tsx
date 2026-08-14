"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Clock,
  Phone,
  Globe,
  MessageCircle,
  Upload,
  CheckCircle2,
  Eye,
  Plus,
  Trash2,
  ShieldCheck,
  FileText,
  Store,
  Loader2,
  Tag,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/app/lib/auth-context";
import { ApiClientError } from "@/app/lib/api";
import NoBusinessClaimed from "@/app/components/ui/NoBusinessClaimed";
import {
  getDashboardProfile,
  updateDashboardProfile,
  updateDashboardHours,
  updateDashboardAmenities,
  addCustomDashboardAmenity,
  updateDashboardCategories,
  addDashboardService,
  deleteDashboardService,
  uploadDashboardLogo,
  uploadDashboardCover,
  uploadDashboardGallery,
  deleteDashboardMedia,
  type DashboardProfile,
  type DashboardHours,
} from "@/app/lib/business-dashboard-api";

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

const MAX_GALLERY_IMAGES = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function BusinessProfileEditorPage() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"basic" | "categories" | "location" | "hours" | "amenities" | "media" | "preview">("basic");

  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [noBusiness, setNoBusiness] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  const [description, setDescription] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [hours, setHours] = useState<DashboardHours[]>(defaultHours());
  const [newServiceName, setNewServiceName] = useState("");
  const [newAmenityName, setNewAmenityName] = useState("");
  const [addingAmenity, setAddingAmenity] = useState(false);
  const [savingCategories, setSavingCategories] = useState(false);
  const [selectedSectorId, setSelectedSectorId] = useState<string>("");
  const [phone, setPhone] = useState("");

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = () => {
    if (!accessToken) return;
    setLoading(true);
    setNoBusiness(false);
    getDashboardProfile(accessToken)
      .then((p) => {
        setProfile(p);
        setDescription(p.description ?? "");
        setWhatsappPhone(p.whatsappPhone ?? "");
        setWebsite(p.website ?? "");
        setAddress(p.address);
        setPincode(p.pincode ?? "");
        setPhone(p.phone ?? "");
        const primary = p.categories.find((c) => c.isPrimary) ?? p.categories[0];
        const defaultSector = primary ? p.allCategories.find((sector) => sector.subcategories.some((sub) => sub.id === primary.id)) : undefined;
        setSelectedSectorId(defaultSector?.id ?? p.allCategories[0]?.id ?? "");
        if (p.hours.length === 7) {
          setHours(DAY_ORDER.map((day) => p.hours.find((h) => h.day === day) ?? { day, openTime: null, closeTime: null, isClosed: true }));
        }
      })
      .catch((err) => {
        if (err instanceof ApiClientError && err.code === "NOT_FOUND") setNoBusiness(true);
        else setLoadError("Couldn't load your business profile.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount is intentional
    loadProfile();
  }, [accessToken]);

  const handleSaveBasics = async () => {
    if (!accessToken) return;
    setSaveStatus("Saving...");
    try {
      await updateDashboardProfile(accessToken, { description });
      setSaveStatus("✓ Changes Saved");
    } catch {
      setSaveStatus("Save failed");
    }
  };

  const handleSaveLocation = async () => {
    if (!accessToken) return;
    setSaveStatus("Saving...");
    try {
      await updateDashboardProfile(accessToken, { phone: phone || undefined, whatsappPhone: whatsappPhone || undefined, website: website || "", address, pincode: pincode || undefined });
      setSaveStatus("✓ Changes Saved");
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : "Save failed");
    }
  };

  const handleSaveHours = async () => {
    if (!accessToken) return;
    setSaveStatus("Saving...");
    try {
      await updateDashboardHours(accessToken, hours);
      setSaveStatus("✓ Hours Saved");
    } catch {
      setSaveStatus("Save failed");
    }
  };

  const toggleAmenity = async (amenityId: string) => {
    if (!accessToken || !profile) return;
    const has = profile.amenities.some((a) => a.id === amenityId);
    const nextIds = has ? profile.amenities.filter((a) => a.id !== amenityId).map((a) => a.id) : [...profile.amenities.map((a) => a.id), amenityId];
    // Optimistic UI
    const amenity = profile.allAmenities.find((a) => a.id === amenityId)!;
    setProfile({ ...profile, amenities: has ? profile.amenities.filter((a) => a.id !== amenityId) : [...profile.amenities, amenity] });
    try {
      await updateDashboardAmenities(accessToken, nextIds);
    } catch {
      loadProfile();
    }
  };

  const toggleCategory = async (categoryId: string) => {
    if (!accessToken || !profile || savingCategories) return;
    const has = profile.categories.some((c) => c.id === categoryId);
    if (has && profile.categories.length <= 1) {
      setSaveStatus("Keep at least one category selected");
      return;
    }
    const nextIds = has ? profile.categories.filter((c) => c.id !== categoryId).map((c) => c.id) : [...profile.categories.map((c) => c.id), categoryId];

    setSavingCategories(true);
    try {
      const categories = await updateDashboardCategories(accessToken, nextIds);
      setProfile((p) => (p ? { ...p, categories } : p));
      setSaveStatus("✓ Categories Saved");
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : "Couldn't update categories");
    } finally {
      setSavingCategories(false);
    }
  };

  const handleAddCustomAmenity = async () => {
    if (!accessToken || !newAmenityName.trim() || !profile) return;
    setAddingAmenity(true);
    try {
      const amenity = await addCustomDashboardAmenity(accessToken, newAmenityName.trim());
      setProfile((p) =>
        p
          ? {
              ...p,
              allAmenities: p.allAmenities.some((a) => a.id === amenity.id) ? p.allAmenities : [...p.allAmenities, amenity],
              amenities: p.amenities.some((a) => a.id === amenity.id) ? p.amenities : [...p.amenities, amenity],
            }
          : p,
      );
      setNewAmenityName("");
    } catch {
      setSaveStatus("Couldn't add amenity");
    } finally {
      setAddingAmenity(false);
    }
  };

  const handleAddService = async () => {
    if (!accessToken || !newServiceName.trim()) return;
    const service = await addDashboardService(accessToken, { name: newServiceName.trim() });
    setProfile((p) => (p ? { ...p, services: [...p.services, service] } : p));
    setNewServiceName("");
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!accessToken) return;
    await deleteDashboardService(accessToken, serviceId);
    setProfile((p) => (p ? { ...p, services: p.services.filter((s) => s.id !== serviceId) } : p));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;
    const { logoUrl } = await uploadDashboardLogo(accessToken, file);
    setProfile((p) => (p ? { ...p, logoUrl } : p));
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;
    const { coverImageUrl } = await uploadDashboardCover(accessToken, file);
    setProfile((p) => (p ? { ...p, coverImageUrl } : p));
  };

  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0 || !accessToken || !profile) return;
    e.target.value = "";

    if (profile.media.length + files.length > MAX_GALLERY_IMAGES) {
      setSaveStatus(`Gallery is limited to ${MAX_GALLERY_IMAGES} photos — you have ${profile.media.length} already.`);
      return;
    }
    const invalidType = files.find((f) => !ALLOWED_IMAGE_TYPES.includes(f.type));
    if (invalidType) {
      setSaveStatus(`${invalidType.name} isn't a supported format. Use JPG, PNG or WEBP.`);
      return;
    }
    const tooLarge = files.find((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (tooLarge) {
      setSaveStatus(`${tooLarge.name} is over 5MB. Please upload a smaller file.`);
      return;
    }

    try {
      const media = await uploadDashboardGallery(accessToken, files);
      setProfile((p) => (p ? { ...p, media } : p));
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!accessToken) return;
    await deleteDashboardMedia(accessToken, mediaId);
    setProfile((p) => (p ? { ...p, media: p.media.filter((m) => m.id !== mediaId) } : p));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (noBusiness) {
    return (
      <div className="flex flex-col gap-0 font-sans">
        <NoBusinessClaimed
          title="No business profile to edit yet"
          description="Once you list a new business or claim an existing Hubigo listing, its editable profile — basic details, hours, media, and more — will appear here."
        />
      </div>
    );
  }

  if (loadError || !profile) {
    return <div className="p-6 text-sm text-rose-600 font-semibold">{loadError || "Business not found"}</div>;
  }

  return (
    <div className="flex flex-col font-sans flex-1 min-h-[calc(100vh-64px)] bg-white w-full">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200/90 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 lg:gap-4 sticky top-0 z-20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-none">
              Profile Management
            </span>
            {saveStatus && <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600">{saveStatus}</span>}
          </div>
          <h1 className="text-base sm:text-2xl font-black text-slate-900 mt-1">{profile.name}</h1>
          <p className="text-[10px] sm:text-xs text-slate-500 font-semibold mt-0.5">
            Update your business identity, hours, media, location, and verify your listing.
          </p>
        </div>

      </div>

      {/* Tabs Navigation */}
      <div className="bg-slate-50/50 border-b border-slate-200/90 p-4 overflow-x-auto hide-scrollbar relative z-10">
        <div className="flex items-center gap-2 min-w-max">
          {[
            { id: "basic", label: "Basic Details", icon: Building2 },
            { id: "categories", label: "Business Categories", icon: Tag },
            { id: "location", label: "Location & Contact", icon: MapPin },
            { id: "hours", label: "Hours & Timing", icon: Clock },
            { id: "amenities", label: "Amenities & Services", icon: FileText },
            { id: "media", label: "Logo & Media", icon: Upload },
            { id: "preview", label: "Live Customer Preview", icon: Eye },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-none text-[10px] sm:text-xs font-bold transition-all cursor-pointer border",
                  isCurrent ? "bg-purple-600 border-purple-600 text-white shadow-none" : "bg-[#f8fafc] border-slate-200/80 text-slate-600 hover:bg-slate-100",
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="bg-white p-6 lg:p-8 flex-1 w-full space-y-6">
        {/* BASIC DETAILS TAB */}
        {activeTab === "basic" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">Basic Business Information</h3>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Business Name <span className="text-slate-400 font-medium">(contact support to change)</span>
              </label>
              <input
                type="text"
                value={profile.name}
                disabled
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-none text-xs font-semibold text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Business Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-none text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white resize-none"
              />
            </div>

            <button
              onClick={handleSaveBasics}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-none shadow-none shadow-purple-600/30 cursor-pointer"
            >
              Save Description
            </button>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900">Services Offered</h4>
              <div className="flex flex-wrap gap-2">
                {profile.services.map((s) => (
                  <span key={s.id} className="flex items-center gap-1.5 bg-purple-50 border border-purple-100 text-purple-800 text-[11px] font-bold px-3 py-1.5 rounded-none">
                    {s.name}
                    <button onClick={() => handleDeleteService(s.id)} className="cursor-pointer">
                      <Trash2 className="w-3 h-3 text-purple-400 hover:text-rose-500" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-sm">
                <input
                  type="text"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddService()}
                  placeholder="Add a service (e.g. Home Delivery)"
                  className="flex-1 px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-none text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                />
                <button onClick={handleAddService} className="px-3 py-2 bg-purple-600 text-white rounded-none cursor-pointer">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BUSINESS CATEGORIES TAB */}
        {activeTab === "categories" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Business Categories</h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">
                Your listing is tagged under these categories. Add more subcategories to show up in more searches — changes save instantly.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.categories.map((c) => (
                <span key={c.id} className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-900 text-[11px] font-bold px-3 py-1.5 rounded-none">
                  {c.name}
                  {c.isPrimary && <span className="text-[9px] font-black uppercase tracking-wider text-purple-500 bg-purple-100 px-1.5 py-0.5 rounded">Primary</span>}
                </span>
              ))}
            </div>

            <div className="space-y-3 pt-2 max-w-md">
              <label className="block text-xs font-bold text-slate-700">Choose a main category</label>
              <select
                value={selectedSectorId}
                onChange={(e) => setSelectedSectorId(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-none text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white cursor-pointer"
              >
                {profile.allCategories.map((sector) => (
                  <option key={sector.id} value={sector.id}>{sector.name}</option>
                ))}
              </select>
            </div>

            {(() => {
              const sector = profile.allCategories.find((s) => s.id === selectedSectorId);
              if (!sector) return null;
              return (
                <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                  <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    {sector.name} — select one or more subcategories
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {sector.subcategories.map((sub) => {
                      const isSelected = profile.categories.some((c) => c.id === sub.id);
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => toggleCategory(sub.id)}
                          disabled={savingCategories}
                          className={cn(
                            "p-3 rounded-none border text-xs font-bold flex items-center justify-between transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed",
                            isSelected ? "bg-purple-50 border-purple-600 text-purple-900 shadow-none" : "bg-[#f8fafc] border-slate-200 text-slate-600 hover:bg-slate-100",
                          )}
                        >
                          <span>{sub.name}</span>
                          <CheckCircle2 className={cn("w-4 h-4 shrink-0", isSelected ? "text-purple-600" : "text-slate-300")} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* LOCATION & CONTACT TAB */}
        {activeTab === "location" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">Location & Contact Channels</h3>

            <div className="space-y-2 max-w-md">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Business Phone Number
                {profile.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full max-w-xs px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-none text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
              />
              <p className="text-[10px] text-slate-400 font-medium">Saved along with the rest of this tab — use the Save button below.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Number
                </label>
                <input
                  type="text"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-none text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Website
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-none text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-bold text-slate-700">Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-none text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-none text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white"
                />
              </div>
            </div>

            <button
              onClick={handleSaveLocation}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-none shadow-none shadow-purple-600/30 cursor-pointer"
            >
              Save Location & Contact
            </button>
          </div>
        )}

        {/* HOURS & TIMING TAB */}
        {activeTab === "hours" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">Weekly Opening Hours</h3>

            <div className="space-y-3 max-w-xl">
              {hours.map((h, i) => (
                <div key={h.day} className="flex items-center justify-between p-2 sm:p-3 bg-[#f8fafc] border border-slate-200/80 rounded-none text-[10px] sm:text-xs gap-1.5 sm:gap-3">
                  <span className="font-bold text-slate-800 w-12 sm:w-24 shrink-0 truncate" title={DAY_LABEL[h.day]}>{DAY_LABEL[h.day]}</span>
                  {h.isClosed ? (
                    <span className="text-slate-400 font-semibold flex-1 text-center">Closed</span>
                  ) : (
                    <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                      <input
                        type="time"
                        value={h.openTime ?? "09:00"}
                        onChange={(e) => setHours((prev) => prev.map((x, xi) => (xi === i ? { ...x, openTime: e.target.value } : x)))}
                        className="px-1 sm:px-2 py-1 border border-slate-200 rounded-none text-[9px] sm:text-xs w-full min-w-0"
                      />
                      <span className="shrink-0">–</span>
                      <input
                        type="time"
                        value={h.closeTime ?? "18:00"}
                        onChange={(e) => setHours((prev) => prev.map((x, xi) => (xi === i ? { ...x, closeTime: e.target.value } : x)))}
                        className="px-1 sm:px-2 py-1 border border-slate-200 rounded-none text-[9px] sm:text-xs w-full min-w-0"
                      />
                    </div>
                  )}
                  <button
                    onClick={() => setHours((prev) => prev.map((x, xi) => (xi === i ? { ...x, isClosed: !x.isClosed } : x)))}
                    className={cn(
                      "text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-1 rounded cursor-pointer shrink-0",
                      h.isClosed ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700",
                    )}
                  >
                    {h.isClosed ? "Closed" : "Open"}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveHours}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-none shadow-none shadow-purple-600/30 cursor-pointer"
            >
              Save Hours
            </button>
          </div>
        )}

        {/* AMENITIES TAB */}
        {activeTab === "amenities" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">Amenities & Available Services</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {profile.allAmenities.map((amenity) => {
                const isSelected = profile.amenities.some((a) => a.id === amenity.id);
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => toggleAmenity(amenity.id)}
                    className={cn(
                      "p-3 rounded-none border text-xs font-bold flex items-center justify-between transition-all cursor-pointer",
                      isSelected ? "bg-purple-50 border-purple-600 text-purple-900 shadow-none" : "bg-[#f8fafc] border-slate-200 text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    <span>{amenity.name}</span>
                    <CheckCircle2 className={cn("w-4 h-4", isSelected ? "text-purple-600" : "text-slate-300")} />
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-2 max-w-md">
              <input
                type="text"
                value={newAmenityName}
                onChange={(e) => setNewAmenityName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustomAmenity()}
                placeholder="Add your own amenity (e.g. Valet Parking)"
                className="flex-1 px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-none text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white"
              />
              <button
                type="button"
                onClick={handleAddCustomAmenity}
                disabled={!newAmenityName.trim() || addingAmenity}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-none flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        )}

        {/* MEDIA TAB */}
        {activeTab === "media" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">Logo & Cover Banner</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Business Logo</label>
                <div className="flex items-center gap-4">
                  {profile.logoUrl ? (
                    <img src={profile.logoUrl} alt="Logo" className="w-20 h-20 rounded-none object-cover border-2 border-purple-300 shadow-none" />
                  ) : (
                    <div className="w-20 h-20 rounded-none bg-slate-100 flex items-center justify-center text-slate-400">
                      <Store className="w-8 h-8" />
                    </div>
                  )}
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="px-4 py-2 bg-purple-50 border border-purple-200 text-purple-700 font-bold text-xs rounded-none hover:bg-purple-100 transition-colors cursor-pointer"
                  >
                    Change Logo
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Cover Banner</label>
                <div className="h-28 w-full rounded-none overflow-hidden relative border-2 border-slate-200 shadow-none bg-slate-100">
                  {profile.coverImageUrl && <img src={profile.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
                    <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                    <button
                      onClick={() => coverInputRef.current?.click()}
                      className="px-4 py-2 bg-white/90 text-slate-900 font-bold text-xs rounded-none hover:bg-white shadow-none transition-colors cursor-pointer"
                    >
                      Update Cover
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Gallery Photos <span className="text-slate-400 font-semibold">({profile.media.length}/{MAX_GALLERY_IMAGES})</span>
                </label>
                <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleGalleryChange} className="hidden" />
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={profile.media.length >= MAX_GALLERY_IMAGES}
                  className="px-3 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-none flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Photos
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">Supports JPG, PNG & WEBP up to 5MB each.</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {profile.media.map((m) => (
                  <div key={m.id} className="relative group aspect-square rounded-none overflow-hidden border border-slate-200">
                    {m.url && <img src={m.url} alt={m.caption ?? ""} className="w-full h-full object-cover" />}
                    <button
                      onClick={() => handleDeleteMedia(m.id)}
                      className="absolute top-1 right-1 bg-rose-600 text-white rounded-none p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {profile.media.length === 0 && <p className="col-span-full text-xs text-slate-400 font-semibold">No gallery photos yet.</p>}
              </div>
            </div>
          </div>
        )}

        {/* LIVE CUSTOMER PREVIEW TAB */}
        {activeTab === "preview" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="p-3 bg-purple-50 border border-purple-100 rounded-none text-xs text-purple-900 font-bold flex items-center justify-between">
              <span>This is how your business listing appears to Hubigo users.</span>
              <Link href={`/business/${profile.slug}`} target="_blank" className="underline font-black">
                Open Full Page →
              </Link>
            </div>

            <div className="border border-slate-200 rounded-none overflow-hidden shadow-lg bg-white">
              <div className="h-44 w-full relative bg-slate-200">
                {profile.coverImageUrl && <img src={profile.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div className="flex items-center gap-3">
                    {profile.logoUrl ? (
                      <img src={profile.logoUrl} alt="Logo" className="w-14 h-14 rounded-none object-cover border-2 border-white shadow-none" />
                    ) : (
                      <div className="w-14 h-14 rounded-none bg-white/20 border-2 border-white flex items-center justify-center text-white">
                        <Store className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-black text-white">{profile.name}</h2>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5 text-xs text-slate-600 font-medium leading-relaxed">{description || "No description yet."}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
