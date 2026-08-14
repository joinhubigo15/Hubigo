"use client";

import { ShieldOff, Mail, Phone } from "lucide-react";

export default function AccountSuspendedPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-[#0f1111] selection:bg-[#0066c0] selection:text-white">
      {/* Header */}
      <header className="px-6 sm:px-12 py-4 sm:py-6 max-w-[1000px] mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Hubigo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-black tracking-tight text-slate-900">
            HUB<span className="text-purple-600">IGO</span>
          </span>
        </div>
      </header>

      {/* Top Separator line */}
      <div className="h-px bg-[#eaeded] w-full max-w-[1000px] mx-auto" />

      {/* Main content */}
      <main className="flex-1 max-w-[1000px] mx-auto w-full px-6 sm:px-12 py-8 space-y-6">
        <h1 className="text-[28px] font-normal text-purple-600 leading-tight">Hubigo Sign In</h1>
        
        <p className="text-[15px] font-semibold text-[#0f1111]">
          Authentication failed because your account has been suspended.
        </p>

        <p className="text-[15px] text-[#0f1111] leading-relaxed">
          If you believe your account was suspended due to a mistake or misunderstanding, you can reach out to our support team and we'll help sort it out. If you do not resolve this issue, your account resources may be permanently terminated.
        </p>

        <p className="text-[15px] text-[#0f1111] leading-relaxed">
          If your account was suspended for reasons other than violation of our terms of service, contact Hubigo customer support <a href="mailto:joinhubigo@gmail.com" className="text-purple-600 hover:underline hover:text-purple-800">Contact Us</a>. You can also reach us by phone at <a href="tel:+918618406401" className="text-purple-600 hover:underline hover:text-purple-800">+91 86184 06401</a>.
        </p>
        
        <p className="text-[13px] pt-4 text-[#0f1111]">
          To return to home, click <a href="/" className="text-purple-600 hover:underline hover:text-purple-800">here</a>
        </p>
      </main>

      {/* Footer */}
      <div className="max-w-[1000px] mx-auto w-full px-6 sm:px-12 mb-8 mt-12">
        <div className="h-px bg-[#eaeded] w-full mb-4" />
        <div className="flex flex-col items-center gap-1.5 text-[11px] text-[#555]">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a href="#" className="text-purple-600 hover:underline hover:text-purple-800">Terms of Use</a>
            <a href="#" className="text-purple-600 hover:underline hover:text-purple-800">Privacy Policy</a>
            <span>© 1996-{new Date().getFullYear()}, Hubigo, Inc. or its affiliates.</span>
          </div>
          <p className="font-bold">A Hubigo company</p>
        </div>
      </div>
    </div>
  );
}
