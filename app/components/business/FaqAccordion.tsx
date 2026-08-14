"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { cn } from "@/app/lib/utils";
import type { FaqEntry } from "@/app/lib/json-ld";

export default function FaqAccordion({ faqs }: { faqs: FaqEntry[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (faqs.length === 0) return null;

  return (
    <section
      id="section-faq"
      className="bg-white rounded-none border border-slate-200/90 lg:border-0 p-4 lg:p-6 space-y-4 shadow-2xs lg:shadow-none"
    >
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
        <HelpCircle className="w-5 h-5 text-purple-600" />
        <h2 className="text-base lg:text-lg font-black text-slate-900">Frequently Asked Questions</h2>
      </div>

      <div className="divide-y divide-slate-100">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={faq.question} className="py-2.5 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-bold text-slate-800">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              {isOpen && (
                <p className="mt-2 text-[11px] sm:text-xs text-slate-600 font-medium leading-relaxed animate-in fade-in-50 duration-200">
                  {faq.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
