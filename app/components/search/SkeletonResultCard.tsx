export default function SkeletonResultCard() {
  return (
    <div className="bg-white rounded-none lg:rounded-2xl border border-slate-100 shadow-xs overflow-hidden animate-pulse">
      {/* Mobile skeleton — matches the compact padded card */}
      <div className="flex lg:hidden items-center gap-3 p-3">
        <div className="w-20 h-20 shrink-0 rounded-none bg-slate-200" />
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="h-3.5 w-3/4 bg-slate-200 rounded" />
          <div className="h-2.5 w-16 bg-slate-200 rounded" />
          <div className="h-2.5 w-24 bg-slate-200 rounded" />
          <div className="h-4 w-14 bg-slate-100 rounded mt-1" />
        </div>
      </div>

      {/* Desktop skeleton — original wide card, unchanged */}
      <div className="hidden lg:flex">
        <div className="w-28 sm:w-40 shrink-0 bg-slate-200" />
        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-2">
          <div className="space-y-2">
            <div className="h-2.5 w-16 bg-slate-200 rounded" />
            <div className="h-4 w-3/4 bg-slate-200 rounded" />
            <div className="h-3 w-24 bg-slate-200 rounded" />
            <div className="h-3 w-32 bg-slate-200 rounded" />
          </div>
          <div className="h-3 w-20 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
}
