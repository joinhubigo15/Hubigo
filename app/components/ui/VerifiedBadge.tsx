import { ShieldCheck } from "lucide-react";
import { cn } from "@/app/lib/utils";

const SIZES = {
  xs: { pill: "text-[8px] px-1.5 py-0.5 gap-0.5", icon: "w-2.5 h-2.5" },
  sm: { pill: "text-[9px] px-2 py-0.5 gap-1", icon: "w-3 h-3" },
  md: { pill: "text-[10px] px-2.5 py-1 gap-1", icon: "w-3.5 h-3.5" },
  lg: { pill: "text-xs px-3 py-1.5 gap-1.5", icon: "w-4 h-4" },
} as const;

/** Hubigo's site-wide "Verified" badge — a solid purple pill (not a bare icon) so it reads as
 * a trust mark at a glance, consistent everywhere a business is shown: cards, grids, and the
 * business detail page. `iconOnly` drops the label for very tight spaces (e.g. inline next to a
 * truncating business name) while keeping the same purple pill treatment. */
export default function VerifiedBadge({
  size = "sm",
  iconOnly = false,
  className,
}: {
  size?: keyof typeof SIZES;
  iconOnly?: boolean;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-purple-600 text-white font-black shrink-0 shadow-sm shadow-purple-600/30",
        s.pill,
        className,
      )}
      title="Hubigo Verified"
    >
      <ShieldCheck className={cn(s.icon, "shrink-0")} />
      {!iconOnly && <span>Verified</span>}
    </span>
  );
}
