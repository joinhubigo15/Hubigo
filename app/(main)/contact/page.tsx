"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth, ApiClientError } from "@/app/lib/auth-context";
import { submitContactMessageRequest } from "@/app/lib/api";

export default function ContactPage() {
  const { user, accessToken } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user || !accessToken) {
      router.push(`/login?next=${encodeURIComponent("/contact")}`);
      return;
    }

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
    <div className="flex flex-col w-full bg-white flex-1 min-h-screen">
      <div className="hidden lg:block px-8 py-6 border-b border-slate-200/90 bg-white sticky top-0 z-10">
        <h1 className="text-2xl lg:text-xl font-bold text-slate-900">Contact Us</h1>
        <p className="text-sm lg:text-xs text-slate-500 mt-1">
          We&apos;re here to help! Reach out to us anytime.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row w-full flex-1">
        {/* Left Column: Contact Form */}
        <div className="flex-1 flex flex-col border-r border-slate-200/90 px-6 py-8 lg:px-8 lg:py-10">
          <h2 className="text-lg font-bold text-slate-900 mb-6 lg:hidden">Contact Us</h2>
          
          <div className="max-w-2xl">
            {sent ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-12">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Message sent!</h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                    We&apos;ve received your message and will get back to you at <span className="font-semibold text-slate-700">{email || "your email"}</span> soon.
                  </p>
                </div>
                <button
                  onClick={() => setSent(false)}
                  className="text-sm font-bold text-purple-600 hover:text-purple-700 hover:underline mt-2"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {!user && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50 border border-purple-100 text-purple-800 text-xs sm:text-sm font-medium">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>You can fill this out freely, but you&apos;ll need to log in when you hit Send — so we know who to reply to.</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm lg:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 lg:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base lg:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-sm lg:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Your Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 lg:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base lg:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm lg:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter the subject of your inquiry"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 lg:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base lg:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-sm lg:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Your Message
                  </label>
                  <textarea
                    rows={5}
                    required
                    minLength={5}
                    placeholder="Write your inquiry here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 lg:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base lg:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors shadow-2xs resize-y"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-fit min-w-[200px] bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm lg:text-xs px-6 py-3.5 lg:py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{submitting ? "Sending..." : user ? "Send Message" : "Log In & Send"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Contact Details & Socials */}
        <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 bg-slate-50/50 flex flex-col">
          <div className="px-8 py-10 flex flex-col gap-10">
            {/* Contact Information */}
            <div>
              <h3 className="text-sm lg:text-xs font-bold text-slate-900 mb-6">Contact Information</h3>
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs lg:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</h4>
                    <p className="text-sm lg:text-xs font-semibold text-slate-800 mt-1">joinhubigo@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs lg:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</h4>
                    <p className="text-sm lg:text-xs font-semibold text-slate-800 mt-1">+91 86184 06401</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full h-[1px] bg-slate-200/80" />

            {/* Social Links */}
            <div>
              <h3 className="text-sm lg:text-xs font-bold text-slate-900 mb-6">Follow Us</h3>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="https://www.facebook.com/share/1Eh2JNCF6F/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-purple-600 hover:border-purple-300 hover:shadow-sm flex items-center justify-center transition-all"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href="https://x.com/hubigobiz?s=11"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-purple-600 hover:border-purple-300 hover:shadow-sm flex items-center justify-center transition-all"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/in/hubigo-biz-9a6aa0428?utm_source=share_via&utm_content=profile&utm_medium=member_ios"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-purple-600 hover:border-purple-300 hover:shadow-sm flex items-center justify-center transition-all"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/hubigobiz?igsh=eTJmZTUzdnQ5OTJ1&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-purple-600 hover:border-purple-300 hover:shadow-sm flex items-center justify-center transition-all"
                >
                  <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
