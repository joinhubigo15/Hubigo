import { cn } from "@/app/lib/utils";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

export default function StarRating({
  rating,
  maxStars = 5,
  size = "sm",
  showValue = false,
  className,
}: StarRatingProps) {
  const sizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4.5 h-4.5",
    lg: "w-5.5 h-5.5",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }).map((_, i) => {
          const filled = i + 1 <= Math.floor(rating);
          const halfFilled =
            !filled && i < rating && i + 1 > Math.floor(rating);

          return (
            <svg
              key={i}
              className={cn(sizes[size], "flex-shrink-0")}
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              {/* Background star (empty) */}
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z"
                fill={filled ? "#F59E0B" : halfFilled ? "url(#half)" : "#E2E8F0"}
              />
              {halfFilled && (
                <defs>
                  <linearGradient id="half">
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="50%" stopColor="#E2E8F0" />
                  </linearGradient>
                </defs>
              )}
            </svg>
          );
        })}
      </div>
      {showValue && (
        <span
          className={cn(
            "font-semibold text-secondary-700",
            textSizes[size]
          )}
        >
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
