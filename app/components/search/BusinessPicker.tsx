"use client";

import { useEffect, useState } from "react";
import { Search, Plus, X } from "lucide-react";
import { useDebounce } from "@/app/hooks/useDebounce";
import { getSuggestions, type Suggestion } from "@/app/lib/search-api";

interface BusinessPickerProps {
  onPick: (slug: string) => void;
  placeholder?: string;
}

export default function BusinessPicker({ onPick, placeholder = "Add a business to compare..." }: BusinessPickerProps) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Suggestion[]>([]);
  const debounced = useDebounce(draft, 300);
  const displayResults = debounced.trim() ? results : [];

  useEffect(() => {
    if (!debounced.trim()) return;
    let cancelled = false;
    getSuggestions(debounced, 6).then((all) => {
      if (!cancelled) setResults(all.filter((s) => s.type === "business"));
    });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 border border-dashed border-slate-300 rounded-xl px-3 py-2.5 bg-slate-50">
        <Plus className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none font-medium"
        />
        {draft && (
          <button onClick={() => setDraft("")} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && draft.trim() && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-100 rounded-xl shadow-lg z-30 max-h-72 overflow-y-auto py-1">
          {displayResults.length === 0 ? (
            <p className="px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
              <Search className="w-3.5 h-3.5" /> No businesses found
            </p>
          ) : (
            displayResults.map((r) => (
              <button
                key={r.slug}
                onClick={() => {
                  onPick(r.slug);
                  setDraft("");
                  setResults([]);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between gap-2 px-4 py-2 hover:bg-slate-50 text-left cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-800 truncate">{r.label}</span>
                {r.sublabel && <span className="text-[11px] text-slate-400 shrink-0">{r.sublabel}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
