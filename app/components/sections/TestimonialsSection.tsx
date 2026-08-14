"use client";

import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: "1",
    name: "Rahul Sharma",
    role: "Owner, The Food Lounge",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    quote: "Hubigo boosted our weekend restaurant reservations by 40% within the first month. Incredible local reach!",
    rating: 5,
  },
  {
    id: "2",
    name: "Priya Patel",
    role: "Verified User",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=200&q=80",
    quote: "Finding trusted healthcare specialists near Jayanagar was effortless with Hubigo. Ratings are 100% accurate.",
    rating: 5,
  },
  {
    id: "3",
    name: "Vikram Singh",
    role: "Founder, FitLife Gym",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    quote: "The direct WhatsApp inquiries from Hubigo give us high quality membership leads every single day.",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="px-4 lg:px-6 my-6 shrink-0">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-6 space-y-1">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-full">
            Testimonials
          </span>
          <h2 className="text-lg lg:text-xl font-black text-slate-900">
            Trusted by Millions Across India
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            See what business owners and customers have to say about Hubigo.
          </p>
        </div>

        {/* 3 Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-4 relative"
            >
              <Quote className="w-6 h-6 text-purple-200 absolute top-4 right-4" />

              <div className="space-y-2 z-10">
                <div className="flex items-center gap-0.5 text-purple-600">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs">{t.name}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
