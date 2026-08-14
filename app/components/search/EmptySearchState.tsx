import { SearchX } from "lucide-react";

interface EmptySearchStateProps {
  onResetFilters?: () => void;
  title?: string;
  message?: string;
}

export default function EmptySearchState({ onResetFilters, title, message }: EmptySearchStateProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center justify-center text-center py-16 px-6 gap-3">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
        <SearchX className="w-7 h-7" />
      </div>
      <h3 className="text-sm font-bold text-slate-800">{title ?? "No businesses found"}</h3>
      <p className="text-xs text-slate-500 max-w-xs">
        {message ?? "Try a different search term, widen your location, or clear a few filters."}
      </p>
      {onResetFilters && (
        <button
          onClick={onResetFilters}
          className="mt-1 text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
