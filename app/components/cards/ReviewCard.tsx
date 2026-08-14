import StarRating from "@/app/components/ui/StarRating";
import Badge from "@/app/components/ui/Badge";

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  content: string;
  verifiedUser?: boolean;
}

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-white rounded-[var(--radius-xl)] border border-border-light p-6 shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={review.avatar}
            alt={review.author}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-secondary">{review.author}</h4>
              {review.verifiedUser && (
                <Badge variant="verified" className="text-[10px]">
                  Verified Customer
                </Badge>
              )}
            </div>
            <p className="text-xs text-secondary-400">{review.date}</p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" showValue />
      </div>

      <p className="text-sm text-secondary-600 leading-relaxed">{review.content}</p>
    </div>
  );
}
