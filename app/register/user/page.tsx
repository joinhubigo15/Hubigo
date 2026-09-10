"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth-context";
import { uploadAvatarRequest, completeOnboardingRequest, type NotificationPreferences } from "@/app/lib/api";
import { getCategories, type CategoryOption } from "@/app/lib/search-api";
import CityAutocompleteInput from "@/app/components/ui/CityAutocompleteInput";
import {
  CheckCircle2,
  Bot,
  Camera,
  AlertCircle,
  Loader2,
  Sparkles,
  ListChecks,
  X,
  Check,
  Send,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

const REFERRAL_OPTIONS: { value: "social" | "friend" | "search" | "ad" | "other"; label: string }[] = [
  { value: "social", label: "Social Media" },
  { value: "friend", label: "Friend / Family" },
  { value: "search", label: "Google Search" },
  { value: "ad", label: "An Advertisement" },
  { value: "other", label: "Other" },
];
type ViewMode = "guided" | "form";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
}

export default function InteractiveUserSetupPage() {
  const { user, accessToken, initializing, updateUser } = useAuth();
  const router = useRouter();

  // Only unauthenticated visitors get bounced away — an already-onboarded user is allowed back
  // here deliberately (e.g. via the "Update Preferences" link on /profile) to edit their info.
  useEffect(() => {
    if (initializing) return;
    if (!user) {
      router.replace("/login?next=/register/user");
    }
  }, [initializing, user, router]);

  const [viewMode, setViewMode] = useState<ViewMode>("guided");
  const [step, setStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prefs, setPrefs] = useState<NotificationPreferences>({
    emailLeadAlerts: true,
    emailMarketing: true,
    whatsappUpdates: true,
    smsAlerts: false,
  });

  const [preferredCity, setPreferredCity] = useState("");
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [pincode, setPincode] = useState("");
  const [referralSource, setReferralSource] = useState<"social" | "friend" | "search" | "ad" | "other" | "">("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // Chat message history
  const [chatLog, setChatLog] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "bot",
      text: "Hi there! 👋 I'm Hubi, your AI assistant. I'll help you create your Hubigo profile. Let's get started! What's your full name?",
    },
  ]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  // Prefill from the user's already-saved data — matters when this page is revisited to edit
  // preferences rather than on first-time onboarding, where there's nothing saved yet anyway.
  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
    setPreferredCity(user.preferredCity ?? "");
    setPreferredCategories(user.preferredCategories ?? []);
    setPincode(user.pincode ?? "");
    setPrefs(user.notificationPreferences);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync if the signed-in account itself changes, not on every unrelated user object update
  }, [user?.id]);

  const toggleCategoryPref = (slug: string) => {
    setPreferredCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : prev.length < 3 ? [...prev, slug] : prev
    );
  };

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : null);
  };

  const togglePref = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Chat convo setup steps logic
  const handleChatSend = () => {
    setErrorMsg(null);

    if (step === 1) {
      if (!name.trim()) {
        setErrorMsg("Enter your name to continue.");
        return;
      }
      setChatLog((prev) => [
        ...prev,
        { id: `u-${step}`, sender: "user", text: name },
        { id: `b-${step + 1}`, sender: "bot", text: `Nice to meet you, ${name}! Let's upload a profile photo.` },
      ]);
      setStep(2);
    } else if (step === 2) {
      const text = avatarFile ? "Uploaded profile photo" : "Skipped profile photo";
      setChatLog((prev) => [
        ...prev,
        { id: `u-${step}`, sender: "user", text },
        { id: `b-${step + 1}`, sender: "bot", text: "Great! What city do you live in, and what is your area pincode?" },
      ]);
      setStep(3);
    } else if (step === 3) {
      const text = `City: ${preferredCity || "Not sure yet"} ${pincode ? `• Pincode: ${pincode}` : ""}`;
      setChatLog((prev) => [
        ...prev,
        { id: `u-${step}`, sender: "user", text },
        { id: `b-${step + 1}`, sender: "bot", text: "Awesome. Which categories interest you? Choose up to 3." },
      ]);
      setStep(4);
    } else if (step === 4) {
      const text = preferredCategories.length > 0
        ? `Selected: ${preferredCategories.map(c => categories.find(cat => cat.slug === c)?.name || c).join(", ")}`
        : "No categories selected";
      setChatLog((prev) => [
        ...prev,
        { id: `u-${step}`, sender: "user", text },
        { id: `b-${step + 1}`, sender: "bot", text: "Almost done! Let's set up your notification preferences." },
      ]);
      setStep(5);
    } else if (step === 5) {
      const text = `${Object.values(prefs).filter(Boolean).length} notification channels enabled.`;
      setChatLog((prev) => [
        ...prev,
        { id: `u-${step}`, sender: "user", text },
        { id: `b-${step + 1}`, sender: "bot", text: "All setup! Review your profile card and click Complete Setup below." },
      ]);
      setStep(6);
    }
  };

  const handleChatBack = () => {
    if (step === 1) return;
    setErrorMsg(null);
    setChatLog((prev) => prev.slice(0, -2)); // Remove last user reply and last bot question
    setStep((prev) => prev - 1);
  };

  const handleComplete = async () => {
    if (!accessToken) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      if (avatarFile) {
        await uploadAvatarRequest(accessToken, avatarFile);
      }
      const updated = await completeOnboardingRequest(accessToken, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        notificationPreferences: prefs,
        preferredCity: preferredCity || undefined,
        preferredCategories: preferredCategories.length > 0 ? preferredCategories : undefined,
        pincode: pincode.trim() || undefined,
        referralSource: referralSource || undefined,
      });
      updateUser(updated);
      setIsCompleted(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong saving your profile.");
    } finally {
      setSubmitting(false);
    }
  };

  if (initializing || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070514]">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070514] text-white font-sans p-4 sm:p-6 lg:p-10 flex flex-col justify-between relative overflow-hidden selection:bg-purple-600/30">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between z-10 shrink-0 mb-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Hubigo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-black text-white">
            Hub<span className="text-purple-400">igo</span>
          </span>
        </Link>
      </header>

      {!isCompleted ? (
        <main className="max-w-3xl mx-auto w-full my-4 z-10 flex-1 flex flex-col justify-center">
          
          {/* Onboarding Header */}
          <div className="text-center space-y-3 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/25 text-[10px] font-extrabold tracking-wider text-purple-300 uppercase">
              <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
              <span>AI Powered Setup</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Let&apos;s set up your <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">Hubigo</span> profile
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Our AI assistant will help you create the perfect profile in just a few simple steps.
            </p>
          </div>

          {/* VIEW MODE TOGGLE */}
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setViewMode("guided")}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  viewMode === "guided" ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Powered Setup</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("form")}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  viewMode === "form" ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                )}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>Classic Form</span>
              </button>
            </div>
          </div>

          {/* CLASSIC FORM VIEW */}
          {viewMode === "form" ? (
            <div className="bg-[#0e0b24]/90 border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div>
                <h2 className="text-base font-black text-white">Set Up Your Profile</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Fill in your details directly to save your configuration.</p>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!name.trim()) {
                    setErrorMsg("Enter your name to continue.");
                    return;
                  }
                  setErrorMsg(null);
                  void handleComplete();
                }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-slate-400 font-bold mb-2 text-xs uppercase tracking-wider">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                        {avatarPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-black text-slate-400">{name.charAt(0).toUpperCase() || "H"}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center border-2 border-slate-950 cursor-pointer hover:bg-purple-700 transition-colors"
                        aria-label="Upload profile photo"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-slate-400 font-semibold text-[11px]">Optional — JPEG, PNG, or WEBP</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1.5 text-xs uppercase tracking-wider">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500 focus:bg-white/10 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1.5 text-xs uppercase tracking-wider">Mobile Number (optional)</label>
                    <input
                      type="text"
                      placeholder="Enter your mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500 focus:bg-white/10 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1.5 text-xs uppercase tracking-wider">Preferred City (optional)</label>
                    <CityAutocompleteInput
                      value={preferredCity}
                      onChange={setPreferredCity}
                      placeholder="Not sure yet — start typing to search"
                      inputClassName="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500 focus:bg-white/10 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1.5 text-xs uppercase tracking-wider">Your Area Pincode (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 560095"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500 focus:bg-white/10 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-2 text-xs uppercase tracking-wider">
                    What categories are you looking for? <span className="text-slate-400/60 font-semibold normal-case">(pick up to 3)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <button
                        key={c.slug}
                        type="button"
                        onClick={() => toggleCategoryPref(c.slug)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer",
                          preferredCategories.includes(c.slug)
                            ? "bg-purple-600 border-purple-600 text-white shadow-2xs"
                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                        )}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-2 text-xs uppercase tracking-wider">How did you hear about Hubigo? (optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {REFERRAL_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setReferralSource((prev) => (prev === opt.value ? "" : opt.value))}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer",
                          referralSource === opt.value
                            ? "bg-purple-600 border-purple-600 text-white shadow-2xs"
                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-2 text-xs uppercase tracking-wider">Notification Preferences</label>
                  <div className="space-y-2">
                    {([
                      { key: "emailLeadAlerts", label: "Email me about my account activity" },
                      { key: "emailMarketing", label: "Email me deals and recommendations" },
                      { key: "whatsappUpdates", label: "WhatsApp updates" },
                      { key: "smsAlerts", label: "SMS alerts" },
                    ] as { key: keyof NotificationPreferences; label: string }[]).map((row) => (
                      <button
                        key={row.key}
                        type="button"
                        onClick={() => togglePref(row.key)}
                        className={cn(
                          "w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-colors cursor-pointer text-xs",
                          prefs[row.key] ? "bg-purple-950/40 border-purple-500/30" : "bg-white/5 border-white/10"
                        )}
                      >
                        <span className="font-bold text-slate-300">{row.label}</span>
                        <span
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200",
                            prefs[row.key] ? "bg-purple-500" : "bg-white/20"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200",
                              prefs[row.key] ? "translate-x-4.5" : "translate-x-1"
                            )}
                          />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end border-t border-white/10 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-md transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{submitting ? "Saving..." : "Complete Setup"}</span>
                  </button>
                </div>
              </form>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onAvatarChange}
              />
            </div>
          ) : (
            /* CONVERSATION STYLE (GUIDED SETUP) */
            <div className="bg-[#0e0b24]/90 border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl relative w-full max-w-3xl mx-auto space-y-5">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      Hubi
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold">AI Assistant</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/")}
                  className="px-3.5 py-1.5 rounded-lg border border-white/10 hover:border-white/20 text-[11px] font-bold text-slate-300 flex items-center gap-1 transition-colors hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Exit setup</span>
                </button>
              </div>

              {/* Chat Stream History */}
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 hide-scrollbar">
                {chatLog.map((msg) => {
                  const isBot = msg.sender === "bot";
                  return (
                    <div
                      key={msg.id}
                      className={cn("flex items-start gap-3 animate-in fade-in", !isBot && "justify-end")}
                    >
                      {isBot && (
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                      
                      <div className="flex flex-col">
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2.5 text-xs font-bold max-w-md inline-block",
                            isBot
                              ? "bg-white/5 border border-white/10 rounded-tl-none text-slate-100"
                              : "bg-[#5f27cd] text-white rounded-tr-none"
                          )}
                        >
                          {msg.text}
                        </div>
                        {!isBot && (
                          <span className="text-[9px] text-slate-500 font-semibold mt-1 text-right">Just now ✓✓</span>
                        )}
                      </div>

                      {!isBot && (
                        <div className="w-8 h-8 rounded-full bg-purple-950 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0 text-xs font-extrabold uppercase">
                          {name.charAt(0) || "U"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Active Step Question & Controls */}
              <div className="border-t border-white/5 pt-5 space-y-4">
                
                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* STEP 1 CONTROLS */}
                {step === 1 && (
                  <div className="space-y-4 animate-in fade-in text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider">Your Full Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleChatSend();
                          }}
                          placeholder="Type your name here..."
                          className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500 focus:bg-white/10 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider">Mobile Number (optional)</label>
                        <input
                          type="text"
                          placeholder="Enter mobile number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500 focus:bg-white/10 text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2 CONTROLS (Avatar) */}
                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in text-xs">
                    <div>
                      <label className="block text-slate-400 font-bold mb-2 uppercase tracking-wider">Profile Photo</label>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                            {avatarPreview ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg font-black text-slate-400">{name.charAt(0).toUpperCase() || "H"}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center border-2 border-slate-950 cursor-pointer hover:bg-purple-700 transition-colors"
                            aria-label="Upload profile photo"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={onAvatarChange}
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-400 font-semibold text-[11px]">Upload a profile picture (Optional)</span>
                          <span className="text-slate-500 text-[10px] mt-0.5">JPEG, PNG, or WEBP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3 CONTROLS (City & Pincode) */}
                {step === 3 && (
                  <div className="space-y-4 animate-in fade-in text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider">Preferred City</label>
                        <CityAutocompleteInput
                          value={preferredCity}
                          onChange={setPreferredCity}
                          placeholder="Not sure yet — start typing to search"
                          inputClassName="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500 focus:bg-white/10 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider">Area Pincode</label>
                        <input
                          type="text"
                          placeholder="e.g. 560095"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500 focus:bg-white/10 text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4 CONTROLS (Categories) */}
                {step === 4 && (
                  <div className="space-y-4 animate-in fade-in text-xs">
                    <div>
                      <label className="block text-slate-400 font-bold mb-2 uppercase tracking-wider">
                        Categories <span className="text-slate-400/60 font-semibold normal-case">(pick up to 3)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((c) => (
                          <button
                            key={c.slug}
                            type="button"
                            onClick={() => toggleCategoryPref(c.slug)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer",
                              preferredCategories.includes(c.slug)
                                ? "bg-purple-600 border-purple-600 text-white shadow-2xs"
                                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                            )}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5 CONTROLS (Notifications) */}
                {step === 5 && (
                  <div className="space-y-2.5 animate-in fade-in text-xs">
                    {([
                      { key: "emailLeadAlerts", label: "Email me about my account activity" },
                      { key: "emailMarketing", label: "Email me deals and recommendations" },
                      { key: "whatsappUpdates", label: "WhatsApp updates" },
                      { key: "smsAlerts", label: "SMS alerts" },
                    ] as { key: keyof NotificationPreferences; label: string }[]).map((row) => (
                      <button
                        key={row.key}
                        type="button"
                        onClick={() => togglePref(row.key)}
                        className={cn(
                          "w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-colors cursor-pointer text-xs",
                          prefs[row.key] ? "bg-purple-950/40 border-purple-500/30" : "bg-white/5 border-white/10"
                        )}
                      >
                        <span className="font-bold text-slate-300">{row.label}</span>
                        <span
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200",
                            prefs[row.key] ? "bg-purple-600" : "bg-slate-200"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200",
                              prefs[row.key] ? "translate-x-4.5" : "translate-x-1"
                            )}
                          />
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* STEP 6 CONTROLS (Preview & Onboard Submit) */}
                {step === 6 && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 animate-in fade-in text-xs">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                        {avatarPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-base font-black text-slate-400">{name.charAt(0).toUpperCase() || "H"}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-white text-sm">{name || "Your name"}</h4>
                        <p className="text-xs text-slate-400 font-bold">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-300 font-semibold border-t border-white/5 pt-3">
                      {phone ? `📱 ${phone} • ` : ""}{preferredCity ? `📍 ${preferredCity} • ` : ""}{Object.values(prefs).filter(Boolean).length} notification setting{Object.values(prefs).filter(Boolean).length === 1 ? "" : "s"} enabled
                    </div>
                  </div>
                )}

                {/* CONVO INPUT BOX CONTROL (Redesigned like the custom chatbot input footer) */}
                <div className="flex items-center gap-2 border border-white/10 rounded-2xl bg-white/5 px-4 py-2 mt-4">
                  <input
                    type="text"
                    disabled={step > 1 && step < 6}
                    value={step === 1 ? name : step === 6 ? "Review and submit onboarding card..." : "Select options above and click send..."}
                    onChange={(e) => step === 1 && setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && step === 1) handleChatSend();
                    }}
                    placeholder="Your answer will appear here..."
                    className="flex-1 bg-transparent border-none text-white text-xs font-semibold placeholder-slate-500 focus:outline-none disabled:text-slate-500"
                  />
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={handleChatBack}
                        className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Back
                      </button>
                    )}

                    {step < 6 ? (
                      <button
                        type="button"
                        onClick={handleChatSend}
                        className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors"
                        aria-label="Send message"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleComplete}
                        disabled={submitting}
                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-md transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                      >
                        {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                        <span>{submitting ? "Saving..." : "Complete Setup"}</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

        </main>
      ) : (
        /* ONBOARDING SUCCESS SCREEN */
        <div className="max-w-md mx-auto w-full my-12 bg-[#0e0b24]/90 border border-white/5 rounded-3xl p-8 text-center space-y-4 shadow-2xl z-10 animate-in fade-in">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">Profile Ready! 🎉</h2>
          <p className="text-xs text-slate-400 font-semibold">Your Hubigo account is all set up and ready to browse.</p>
          <div className="flex items-center justify-center gap-2.5">
            <Link
              href="/profile"
              className="inline-block px-5 py-2.5 border border-white/10 hover:border-white/20 text-slate-200 font-bold text-xs rounded-lg transition-colors cursor-pointer hover:bg-white/5"
            >
              Back to Profile
            </Link>
            <Link
              href="/"
              className="inline-block px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-2xs hover:shadow-xs transition-colors cursor-pointer"
            >
              Go to Home Page
            </Link>
          </div>
        </div>
      )}

      {/* Progress indicators inside page footer */}
      {!isCompleted && (
        <div className="max-w-md mx-auto w-full flex items-center justify-between pt-6 border-t border-white/5 mt-8 z-10 shrink-0">
          {[
            { id: 1, label: "Welcome" },
            { id: 2, label: "Photo" },
            { id: 3, label: "Location" },
            { id: 4, label: "Categories" },
            { id: 5, label: "Channels" },
          ].map((item, idx) => {
            const isCompletedStep = idx + 1 < step;
            const isActiveStep = idx + 1 === step;
            return (
              <div key={item.id} className="flex flex-col items-center gap-1.5 flex-1 select-none">
                <div className="flex items-center w-full justify-center">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border",
                      isCompletedStep
                        ? "bg-purple-600 border-purple-500 text-white"
                        : isActiveStep
                        ? "bg-purple-600/25 border-purple-400 text-purple-300"
                        : "bg-[#18152e] border-white/5 text-slate-500"
                    )}
                  >
                    {isCompletedStep ? <Check className="w-3.5 h-3.5" /> : item.id}
                  </div>
                </div>
                <span
                  className={cn(
                    "text-[9px] font-bold tracking-tight uppercase whitespace-nowrap",
                    isActiveStep ? "text-purple-400" : "text-slate-500"
                  )}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <footer className="text-center text-xs text-slate-500 font-semibold z-10 py-2 mt-4 shrink-0">
        Hubigo Local Business Discovery
      </footer>
    </div>
  );
}
