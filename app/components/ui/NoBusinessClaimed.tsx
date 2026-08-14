import Link from "next/link";
import { Store, Search, Sparkles } from "lucide-react";

export default function NoBusinessClaimed({
  title = "You haven't added a business yet",
  description = "Claim an existing Hubigo listing or add a new one to unlock your dashboard, leads, and analytics.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-10 shadow-sm shadow-slate-200/50 flex flex-col items-center text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-600/30">
        <Store className="w-7 h-7 text-white" />
      </div>
      <div className="space-y-1.5 max-w-md">
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed">{description}</p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
        <Link
          href="/business/register"
          className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/30 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>List Your Business</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Find & Claim Your Listing</span>
        </Link>
      </div>
    </div>
  );
}
