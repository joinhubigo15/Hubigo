"use client";

import { useState } from "react";
import { MessageSquare, Video, Phone, Mail, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth, ApiClientError } from "@/app/lib/auth-context";
import { submitContactMessageRequest } from "@/app/lib/api";

function ComingSoonBadge() {
  return (
    <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
      Coming in v2
    </span>
  );
}

export default function BusinessHelpPage() {
  const { user, accessToken } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;

    setErrorMsg(null);
    setSubmitting(true);
    try {
      await submitContactMessageRequest(accessToken, {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setSent(true);
      setSubject("");
      setMessage("");
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.message : "Couldn't send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-0 font-sans pb-6">

      {/* Header Banner */}
      <div className="bg-white rounded-none border-b border-slate-100 p-5 lg:p-6 shadow-none relative overflow-hidden flex flex-col gap-2 lg:gap-3 z-10">
        <div className="absolute right-0 top-0 w-32 h-32 bg-purple-50 rounded-full blur-2xl opacity-80" />
        <div className="space-y-1.5 z-10 relative">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-none inline-block">
            Merchant Support
          </span>
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 leading-tight">
            Help Center & Support Desk
          </h1>
          <p className="text-[11px] sm:text-sm text-slate-500 max-w-xl leading-relaxed font-semibold">
            Reach the Hubigo team directly — live chat and video guides are on the way.
          </p>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch flex-1">
        
        {/* Left Column: Support Cards & Details */}
        <div className="lg:col-span-5 flex flex-col gap-0  relative z-10">
          
          <div className="bg-white rounded-none border-b border-slate-100 p-5 shadow-none flex-1 flex flex-col gap-5 lg:gap-6">
            
            {/* Quick Support Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="bg-slate-50/50 p-4 rounded-none border border-slate-100 space-y-2 opacity-75">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-none bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <ComingSoonBadge />
                </div>
                <h4 className="font-extrabold text-xs text-slate-900">Live Chat</h4>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Chat instantly with our merchant operations team.</p>
              </div>

              <div className="bg-slate-50/50 p-4 rounded-none border border-slate-100 space-y-2 opacity-75">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-none bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Video className="w-4 h-4" />
                  </div>
                  <ComingSoonBadge />
                </div>
                <h4 className="font-extrabold text-xs text-slate-900">Tutorials</h4>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Learn how to boost lead conversions and manage your listing.</p>
              </div>
            </div>

            {/* Contact Details List */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-none bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Support</h4>
                  <a href="mailto:joinhubigo@gmail.com" className="text-xs font-bold text-slate-700 mt-0.5 hover:text-purple-600">joinhubigo@gmail.com</a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-none bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Support</h4>
                  <a href="tel:+918618406401" className="text-xs font-bold text-slate-700 mt-0.5 hover:text-emerald-600">+91 86184 06401</a>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Contact form */}
        <div className="lg:col-span-7 bg-white rounded-none border-b border-slate-100 p-5 lg:p-6 shadow-none flex flex-col justify-between  relative z-10">
          <div className="mb-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Message the Hubigo Team</h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Have an issue with your listing, billing, or account? Send us a message and we&apos;ll reply by email.
            </p>
          </div>

          {sent ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-8">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-900">Message sent!</h3>
              <p className="text-xs text-slate-500 font-semibold max-w-sm">
                We&apos;ve received your message and will get back to you at {email || "your email"} soon.
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-xs font-bold text-purple-600 hover:underline cursor-pointer"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-none bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Your Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Billing question, listing issue..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Your Message
                </label>
                <textarea
                  rows={4}
                  required
                  minLength={5}
                  placeholder="Describe your issue..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 font-semibold resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs py-2.5 rounded-none flex items-center justify-center gap-1.5 shadow-none transition-all disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{submitting ? "Sending..." : "Send Message"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
