"use client";

import { useEffect, useMemo, useState } from "react";
import { Star, Send, User, Loader2 } from "lucide-react";
import { useAuth } from "@/app/lib/auth-context";
import { getDashboardReviews, replyToDashboardReview, type DashboardReview } from "@/app/lib/business-dashboard-api";

export default function BusinessReviewsPage() {
  const { accessToken } = useAuth();
  const [reviews, setReviews] = useState<DashboardReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getDashboardReviews(accessToken)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    const histogram = [5, 4, 3, 2, 1].map((stars) => {
      const count = reviews.filter((r) => r.rating === stars).length;
      return { stars, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
    });
    return { total, avg, histogram };
  }, [reviews]);

  const submitReply = async (id: string) => {
    const text = replyInput[id];
    if (!text?.trim() || !accessToken) return;
    setSubmitting(id);
    try {
      const updated = await replyToDashboardReview(accessToken, id, text.trim());
      setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col font-sans flex-1 min-h-[calc(100vh-64px)] bg-white w-full">
      {/* Top Header */}
      <div className="bg-white rounded-none border-b border-slate-200/90 p-4 lg:p-5 shadow-none shadow-slate-200/50 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-none flex items-center gap-1">
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-500 text-amber-500" />
            Reputation & Reviews
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">{stats.total} Total Reviews</span>
        </div>
        <h1 className="text-base sm:text-2xl font-black text-slate-900 mt-1">{stats.total} Customer Ratings & Replies</h1>
        <p className="text-[10px] sm:text-xs text-slate-500 font-semibold mt-0.5">Monitor customer reviews and respond directly from your dashboard.</p>
      </div>

      {/* Rating Breakdown Card */}
      <div className="bg-white rounded-none border-b border-slate-200/90 p-4 lg:p-5 shadow-none shadow-slate-200/50 max-w-xl  relative z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-center bg-amber-50 border border-amber-200 rounded-none p-3 sm:p-4 min-w-[80px] sm:min-w-[100px]">
            <div className="text-2xl sm:text-3xl font-black text-amber-600 leading-none">{stats.avg.toFixed(1)}</div>
            <div className="flex justify-center text-amber-500 text-[10px] sm:text-xs mt-1">{"★".repeat(Math.round(stats.avg)) || "—"}</div>
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold mt-0.5">Out of 5 Stars</p>
          </div>

          <div className="flex-1 space-y-1.5 text-xs font-bold">
            {stats.histogram.map((row) => (
              <div key={row.stars} className="flex items-center gap-2">
                <span className="w-6 text-slate-500">{row.stars}★</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${row.pct}%` }} />
                </div>
                <span className="text-[10px] text-slate-400 w-8 text-right">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review List */}
      <div className="flex flex-col gap-0  relative z-10">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider p-4 lg:p-0 bg-white lg:bg-transparent border-b-none border-slate-200/90  z-10 relative">Customer Review Feed</h3>

        {reviews.length === 0 ? (
          <div className="bg-white rounded-none border-b border-slate-200/90 p-8 text-center text-xs text-slate-500 font-semibold ">
            No reviews yet.
          </div>
        ) : (
          <div className="flex flex-col gap-0 relative z-20">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-white rounded-none border-b border-slate-200/90 p-5 shadow-none space-y-3 ">
                <div className="flex items-center gap-3">
                  {rev.user?.avatarUrl ? (
                    <img src={rev.user.avatarUrl} alt={rev.user.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-50 border border-slate-200 flex items-center justify-center text-purple-500">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{rev.user?.name ?? rev.authorName ?? "Anonymous"}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-amber-500 text-xs">{"★".repeat(rev.rating)}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {rev.title && <p className="text-xs font-bold text-slate-800">{rev.title}</p>}
                {rev.comment && <p className="text-xs text-slate-700 font-medium leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>}

                {rev.ownerReply ? (
                  <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-none text-xs space-y-1">
                    <span className="font-extrabold text-purple-900 text-[10px] uppercase">Your Official Response:</span>
                    <p className="text-slate-800 font-medium">{rev.ownerReply}</p>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <textarea
                      rows={2}
                      placeholder="Write an official response..."
                      value={replyInput[rev.id] || ""}
                      onChange={(e) => setReplyInput({ ...replyInput, [rev.id]: e.target.value })}
                      className="w-full p-3 bg-[#f8fafc] border border-slate-200 rounded-none text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => submitReply(rev.id)}
                        disabled={submitting === rev.id}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-none shadow-none flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{submitting === rev.id ? "Posting..." : "Post Reply"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
