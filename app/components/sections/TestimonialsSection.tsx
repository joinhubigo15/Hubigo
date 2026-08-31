"use client";

import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: "1",
    name: "Dr. Rajesh Kumar",
    role: "Medical Director, City Multispecialty Clinic",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80",
    quote: "Hubigo Healthcare connected hundreds of local patients looking for specialized OPD consultations and health checkups in Bangalore.",
    rating: 5,
  },
  {
    id: "2",
    name: "Priya Patel",
    role: "Verified Patient",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=200&q=80",
    quote: "Finding trusted healthcare specialists and booking diagnostics near Koramangala was effortless with Hubigo Healthcare. Ratings are 100% accurate.",
    rating: 5,
  },
  {
    id: "3",
    name: "Dr. Ananya Reddy",
    role: "Chief Ophthalmologist, Vision Care Center",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80",
    quote: "Direct patient inquiries from Hubigo Healthcare give our eye clinic verified consultation leads every single day.",
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
