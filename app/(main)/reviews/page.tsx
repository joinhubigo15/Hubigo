"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Search, MessageSquare, Send, User, Loader2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/app/lib/auth-context";
import { getDashboardReviews, replyToDashboardReview, type DashboardReview } from "@/app/lib/business-dashboard-api";

export default function ReviewsManagementPage() {
  const { user, accessToken, initializing } = useAuth();
  const router = useRouter();
  const isBusinessAccount = !!user && (user.role === "business_owner" || user.role === "admin" || user.role === "super_admin");

  useEffect(() => {
    if (initializing) return;
    if (!user) router.replace("/login?next=/reviews");
    else if (!isBusinessAccount) router.replace("/");
  }, [initializing, user, isBusinessAccount, router]);

  const [reviews, setReviews] = useState<DashboardReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const handleSendReply = async (id: string) => {
    if (!replyText.trim() || !accessToken) return;
    setSubmitting(true);
    try {
      const updated = await replyToDashboardReview(accessToken, id, replyText.trim());
      setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setReplyingId(null);
      setReplyText("");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === "Replied" && !r.ownerReply) return false;
    if (activeTab === "Pending Reply" && r.ownerReply) return false;
    if (searchTerm) {
      const author = r.user?.name ?? r.authorName ?? "";
      return (
        author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.comment ?? "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });

  if (initializing || !user || !isBusinessAccount || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50/60 min-h-screen px-4 lg:px-8 py-6 flex flex-col gap-6">

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-tight">
            Reviews Management
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Monitor ratings, reply to customer feedback & manage reputation.
          </p>
        </div>
      </div>

      {/* Rating Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-4 bg-purple-50/50 border border-purple-100 rounded-xl p-5 text-center flex flex-col items-center justify-center space-y-1.5">
          <div className="text-4xl font-black text-slate-900">{stats.avg.toFixed(1)}</div>
          <div className="flex items-center gap-1 text-purple-600">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={cn("w-4 h-4", i < Math.round(stats.avg) ? "fill-current" : "text-slate-200")} />
            ))}
          </div>
          <p className="text-xs font-bold text-slate-500">Based on {stats.total} Customer Reviews</p>
        </div>

        <div className="md:col-span-8 space-y-2">
          {stats.histogram.map((bar) => (
            <div key={bar.stars} className="flex items-center gap-3 text-xs font-semibold">
              <span className="w-14 text-slate-600 font-bold shrink-0">{bar.stars} Stars</span>
              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full transition-all" style={{ width: `${bar.pct}%` }} />
              </div>
              <span className="w-10 text-right text-slate-400 text-[11px] font-bold">{bar.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Pills & Search */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {["All", "Pending Reply", "Replied"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer whitespace-nowrap",
                activeTab === tab
                  ? "bg-purple-600 border-purple-600 text-white shadow-xs"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
          />
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-xs text-slate-500 font-semibold">
            No reviews yet.
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-3 transition-all hover:border-slate-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {rev.user?.avatarUrl ? (
                    <img src={rev.user.avatarUrl} alt={rev.user.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-purple-50 border border-slate-200 flex items-center justify-center text-purple-500">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs">{rev.user?.name ?? rev.authorName ?? "Anonymous"}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-0.5 text-purple-600">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">• {new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {rev.title && <p className="text-xs font-bold text-slate-800">{rev.title}</p>}
              {rev.comment && <p className="text-xs text-slate-600 font-medium leading-relaxed">{rev.comment}</p>}

              {rev.ownerReply ? (
                <div className="bg-purple-50/60 border border-purple-100/80 rounded-xl p-3 text-xs space-y-1">
                  <span className="font-bold text-purple-900 text-[11px]">Response from Owner</span>
                  <p className="text-slate-700 font-medium leading-relaxed text-[11px]">{rev.ownerReply}</p>
                </div>
              ) : (
                <div>
                  {replyingId === rev.id ? (
                    <div className="space-y-2 pt-2">
                      <textarea
                        rows={2}
                        placeholder="Write your official response..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => { setReplyingId(null); setReplyText(""); }}
                          className="px-3 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSendReply(rev.id)}
                          disabled={submitting}
                          className="px-3.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-60"
                        >
                          <Send className="w-3 h-3" />
                          <span>{submitting ? "Posting..." : "Post Reply"}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingId(rev.id)}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 pt-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Reply to Customer</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
