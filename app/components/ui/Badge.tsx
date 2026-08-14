import { cn } from "@/app/lib/utils";

type BadgeVariant =
  | "verified"
  | "premium"
  | "open"
  | "closed"
  | "category"
  | "featured"
  | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  verified:
    "bg-accent-50 text-accent border border-accent-100",
  premium:
    "bg-gradient-to-r from-amber-100 to-yellow-50 text-amber-700 border border-amber-200",
  open:
    "bg-success-light text-success border border-emerald-200",
  closed:
    "bg-error-light text-error border border-red-200",
  category:
    "bg-secondary-100 text-secondary-600 border border-secondary-200",
  featured:
    "bg-primary-50 text-primary border border-primary-200",
  default:
    "bg-secondary-100 text-secondary-500 border border-secondary-200",
};

export default function Badge({
  variant = "default",
  children,
  className,
  icon,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors duration-200",
        variantStyles[variant],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
