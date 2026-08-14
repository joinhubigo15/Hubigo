"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  ShieldCheck,
  Building2,
  Mail,
  Globe,
  CheckCircle2,
  Sparkles,
  FileText,
} from "lucide-react";

export default function StandaloneTermsPage() {
  return (
    <div className="bg-[#f4f6f9] min-h-screen font-sans text-slate-900 selection:bg-purple-100 selection:text-purple-900 pb-24">
      
      {/* MINIMAL OFFICIAL HEADER BAR */}
      <header className="bg-slate-900 text-white sticky top-0 z-50 border-b border-slate-800 shadow-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          
          {/* Back to Login Button */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-none lg:rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700/80 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-purple-400" />
            <span>Back to Login</span>
          </Link>

          {/* Hubigo Minimal Brand */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Hubigo" className="w-6 h-6 object-contain" />
            <span className="text-sm font-black tracking-tight text-white">
              HUBIGO <span className="text-slate-400 font-semibold text-xs">LEGAL</span>
            </span>
          </div>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none lg:rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Document</span>
          </button>

        </div>
      </header>

      {/* OFFICIAL LEGAL DOCUMENT CONTAINER */}
      <main className="max-w-4xl mx-auto px-0 sm:px-6 pt-0 sm:pt-12">
        <div className="bg-white rounded-none sm:rounded-3xl border-x-0 border-t-0 sm:border border-slate-200/90 p-5 sm:p-12 lg:p-16 shadow-none sm:shadow-xl space-y-10">
          
          {/* OFFICIAL DOCUMENT HEADER */}
          <div className="border-b-2 border-slate-900 pb-8 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-purple-700 tracking-widest">
                  Hubigo Technology Private Limited
                </p>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  TERMS & CONDITIONS OF SERVICE
                </h1>
                <p className="text-xs text-slate-500 font-bold">
                  Official Legal Agreement & Platform Usage Disclosure
                </p>
              </div>

              <div className="text-right shrink-0 hidden sm:block text-[11px] text-slate-500 font-medium space-y-0.5">
                <p><strong className="text-slate-900 font-bold">Ref No:</strong> HUB-TC-2026-V2.4</p>
                <p><strong className="text-slate-900 font-bold">Effective Date:</strong> August 7, 2026</p>
                <p><strong className="text-slate-900 font-bold">Jurisdiction:</strong> India (Karnataka)</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-none sm:rounded-xl text-xs text-slate-600 font-medium leading-relaxed flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong>Legal Notice under Information Technology Act, 2000:</strong> This document is an electronic record generated pursuant to the Information Technology Act, 2000 and applicable rules thereunder. This electronic record does not require physical or digital signatures and is legally binding upon all users accessing or registering on Hubigo.
              </div>
            </div>
          </div>

          {/* PREAMBLE */}
          <div className="space-y-3 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed border-b border-slate-200/80 pb-6">
            <p>
              This Terms & Conditions agreement (hereinafter referred to as the <strong>&quot;Agreement&quot;</strong> or <strong>&quot;Terms&quot;</strong>) is entered into between <strong>Hubigo Technology Private Limited</strong> (operating under the trade name <strong>&quot;Hubigo&quot;</strong>, <strong>&quot;We&quot;</strong>, <strong>&quot;Us&quot;</strong>, or <strong>&quot;Our&quot;</strong>) and any person or entity (hereinafter referred to as <strong>&quot;User&quot;</strong>, <strong>&quot;Business Owner&quot;</strong>, or <strong>&quot;You&quot;</strong>) accessing, browsing, registering an account, submitting inquiries, or using the Hubigo platform.
            </p>
            <p>
              By creating an account, logging in, or submitting any enquiry on Hubigo, you explicitly accept and agree to be bound by these Terms without limitation or qualification.
            </p>
          </div>

          {/* SECTION 1.0 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 border-b border-slate-200 pb-2">
              1.0 Acceptance of Terms & Binding Agreement
            </h2>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              <p>
                <strong>1.1 Legal Acceptance:</strong> Your usage of the Hubigo website, web applications, mobile interfaces, or API services constitutes your full legal acceptance of these Terms and our Privacy Policy. If you do not agree to these Terms, you are prohibited from accessing the Platform.
              </p>
              <p>
                <strong>1.2 Mandatory Consent via Authentication:</strong> Selecting &quot;I agree&quot; or logging in/registering on Hubigo serves as an express electronic consent binding you to this contract under Section 10A of the Indian Information Technology Act, 2000.
              </p>
              <p>
                <strong>1.3 Corporate Authority:</strong> Individuals agreeing to these terms on behalf of a legal entity represent that they possess valid corporate authority to bind such entity.
              </p>
            </div>
          </section>

          {/* SECTION 2.0 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 border-b border-slate-200 pb-2">
              2.0 Definitions & Platform Scope
            </h2>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>&quot;Platform&quot;:</strong> The Hubigo directory ecosystem, websites, apps, and database systems.</li>
                <li><strong>&quot;User&quot;:</strong> Any consumer or individual seeking local business information, quotes, or services.</li>
                <li><strong>&quot;Business Owner&quot;:</strong> Any merchant, professional, or commercial establishment listing or claiming a profile.</li>
                <li><strong>&quot;Enquiry&quot;:</strong> Any callback request, quotation submission, contact form, or service lead initiated on Hubigo.</li>
                <li><strong>&quot;Premium Business&quot;:</strong> Service providers subscribed to Hubigo paid visibility or lead packages.</li>
              </ul>
            </div>
          </section>

          {/* SECTION 3.0 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 border-b border-slate-200 pb-2">
              3.0 Eligibility & Capacity
            </h2>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              <p>
                You represent that you are at least 18 years of age and fully competent to enter into contracts under the Indian Contract Act, 1872. Minors may access the Platform only under supervision of a legal guardian.
              </p>
            </div>
          </section>

          {/* SECTION 4.0 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 border-b border-slate-200 pb-2">
              4.0 Intermediary Status & Platform Role Notice
            </h2>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              <p>
                <strong>4.1 Technology Intermediary:</strong> Hubigo operates strictly as an online business discovery directory and technology intermediary as defined under Section 2(1)(w) and Section 79 of the Information Technology Act, 2000 (India).
              </p>
              <p>
                <strong>4.2 Independent Contractors:</strong> Hubigo does not own, control, or operate listed third-party businesses unless expressly specified. Hubigo is not a party to any contract formed between Users and listed merchants.
              </p>
            </div>
          </section>

          {/* SECTION 5.0 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 border-b border-slate-200 pb-2">
              5.0 User Account Registration & Security
            </h2>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              <p>
                Users and merchants agree to supply accurate account details (mobile number, email, name). You remain solely responsible for safeguarding your OTP codes and passwords.
              </p>
            </div>
          </section>

          {/* SECTION 6.0 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 border-b border-slate-200 pb-2">
              6.0 Business Listing Data Sourcing Policy
            </h2>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              <p>
                Listing details on Hubigo originate from: (a) Public web records and public registries, (b) Verified owner submissions, (c) Community user edits, and (d) Editorial verification. Hubigo makes reasonable efforts to verify data but does not warrant absolute accuracy of hours, pricing, or contact numbers.
              </p>
            </div>
          </section>

          {/* SECTION 7.0 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 border-b border-slate-200 pb-2">
              7.0 Search & Discovery Ranking Methodology
            </h2>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              <p>
                Search rankings evaluate relevance, geographic proximity, listing completeness, review sentiment, and Premium package status. Hubigo retains total discretion over algorithm criteria.
              </p>
            </div>
          </section>

          {/* SECTION 8.0 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 border-b border-slate-200 pb-2">
              8.0 Premium Business Subscriptions
            </h2>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              <p>
                Paid Premium subscriptions unlock featured badges, higher visibility, and lead notifications. Subscriptions do NOT guarantee specific sales volumes, customer conversion, or fixed ranking placement.
              </p>
            </div>
          </section>

          {/* SECTION 9.0 — PROMINENT LEAD SHARING DISCLOSURE */}
          <section id="lead-sharing" className="space-y-4 pt-2 scroll-mt-24">
            <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-4 border-2 border-purple-500 shadow-lg">
              <div className="flex items-center gap-2 text-amber-400 font-black text-sm uppercase tracking-wider border-b border-slate-800 pb-2.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>9.0 IMPORTANT LEAD SHARING & ENQUIRY DISCLOSURE CLAUSE</span>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                <p className="text-white font-bold">
                  MANDATORY DISCLOSURE REGARDING ENQUIRY & CONTACT DATA SHARING:
                </p>
                <p>
                  When a User submits an enquiry, callback request, quotation request, booking request, or voluntarily shares contact information (mobile number, email, location, service requirements) through Hubigo:
                </p>

                <div className="p-4 bg-purple-950/80 border border-purple-400/40 rounded-xl space-y-2 text-purple-100 font-bold text-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>The User <strong>expressly authorizes Hubigo</strong> to share that enquiry details and contact information with <strong>up to two (2) relevant Premium Businesses</strong> offering similar products or services within the User&apos;s selected location or category.</span>
                  </div>
                </div>

                <p>
                  <strong>Commercial Purpose:</strong> The purpose of this lead sharing is to provide Users with competitive price quotations, alternative options, availability details, and broader local options.
                </p>
                <p><strong>User Acknowledgment:</strong> Users agree that:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-300 text-xs">
                  <li>Their contact details may be shared with a maximum of two (2) verified Premium Businesses.</li>
                  <li>Those businesses may contact them directly via phone, SMS, WhatsApp, or email.</li>
                  <li>Hubigo is authorized to process and route these enquiries.</li>
                  <li>Sharing occurs only after voluntary submission of an enquiry form.</li>
                  <li>Hubigo is not liable for subsequent commercial transactions or interactions between Users and merchants.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 10.0 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 border-b border-slate-200 pb-2">
              10.0 User Reviews & Content Moderation
            </h2>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              <p>
                Fake reviews, extortion, harassment, and competitor sabotage are strictly prohibited. Hubigo reserves the right to edit, hide, or delete non-compliant user reviews.
              </p>
            </div>
          </section>

          {/* SECTION 11.0 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 border-b border-slate-200 pb-2">
              11.0 Prohibited Platform Activities
            </h2>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              <p>Users and merchants may not: (a) Scrape directory data, (b) Deploy automated bots or spiders, (c) Reverse engineer platform code, (d) Spam listed merchants, or (e) Attempt server intrusions.</p>
            </div>
          </section>

          {/* SECTION 12.0 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 border-b border-slate-200 pb-2">
              12.0 Business Owner Obligations
            </h2>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              <p>
                Listed merchants must maintain truthful business information, current licensing (GSTIN/MSME where applicable), and comply with Consumer Protection (E-Commerce) Rules, 2020.
              </p>
            </div>
          </section>

          {/* SECTION 13.0 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 border-b border-slate-200 pb-2">
              13.0 Commercial Payments & Subscriptions
            </h2>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              <p>
                Package fees are subject to 18% GST under Indian tax laws. Payments are processed via PCI-DSS compliant gateways (Razorpay, Stripe).
              </p>
            </div>
          </section>

          {/* SECTION 14.0 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 border-b border-slate-200 pb-2">
              14.0 Cancellation & Refunds
            </h2>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              <p>
                Subscription plans may be cancelled at any time from your Business Dashboard. Processed billing cycles are non-refundable unless required by law.
              </p>
            </div>
          </section>

          {/* SECTION 15.0 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 border-b border-slate-200 pb-2">
              15.0 Intellectual Property Rights
            </h2>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              <p>
                All software, branding, directory databases, search algorithms, and UI designs remain the exclusive property of Hubigo Technology Private Limited.
              </p>
            </div>
          </section>

          {/* SECTION 16.0 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 border-b border-slate-200 pb-2">
              16.0 Data Protection & Privacy
            </h2>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              <p>
                Data collection complies with Indian Digital Personal Data Protection (DPDP) standards as detailed in our Privacy Policy.
              </p>
            </div>
          </section>

          {/* SECTION 17.0 - 22.0 SUMMARY CLAUSES */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 border-b border-slate-200 pb-2">
              17.0 - 22.0 Limitation of Liability & Termination
            </h2>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              <p>
                <strong>Limitation of Liability:</strong> Hubigo shall not be liable for service disputes, quality of merchant work, pricing disagreements, or indirect damages.
              </p>
              <p>
                <strong>Account Termination:</strong> Hubigo reserves the right to suspend or ban accounts violating platform terms without prior liability.
              </p>
            </div>
          </section>

          {/* SECTION 23.0 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-slate-950 border-b border-slate-200 pb-2">
              23.0 Governing Law & Exclusive Jurisdiction
            </h2>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              <p>
                This Agreement is governed by the laws of India. All legal proceedings shall be subject to the exclusive jurisdiction of the competent courts in <strong>Bengaluru, Karnataka, India</strong>.
              </p>
            </div>
          </section>

          {/* SECTION 24.0 — OFFICIAL CONTACT */}
          <section className="space-y-4 border-t-2 border-slate-900 pt-6">
            <h2 className="text-base sm:text-lg font-black text-slate-950">
              24.0 Official Legal Contact Details
            </h2>
            
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-800 font-medium">
              <p className="font-extrabold text-sm text-slate-900">Hubigo Technology Private Limited</p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Legal Desk: <strong>joinhubigo@gmail.com</strong></span>
              </p>
              <p className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Portal: <strong>https://hubigo.com</strong></span>
              </p>
            </div>
          </section>

        </div>

        {/* BOTTOM BACK TO LOGIN & FOOTER */}
        <div className="py-8 text-center space-y-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Hubigo Login</span>
          </Link>
          <p className="text-xs text-slate-500 font-semibold">
            © 2026 Hubigo Technology Private Limited. Official Legal Instrument.
          </p>
        </div>
      </main>

    </div>
  );
}
