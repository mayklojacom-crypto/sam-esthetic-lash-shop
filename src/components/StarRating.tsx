import { Star } from 'lucide-react';

interface Props {
  rating: number;
  reviewCount?: number;
  size?: number;
  showCount?: boolean;
  className?: string;
}

const StarRating = ({ rating, reviewCount, size = 12, showCount = true, className = '' }: Props) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3 && rating - fullStars < 0.8;
  const stars = [0, 1, 2, 3, 4];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5">
        {stars.map(i => {
          const filled = i < fullStars;
          const half = i === fullStars && hasHalf;
          return (
            <Star
              key={i}
              size={size}
              className={filled || half ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}
              strokeWidth={1.5}
            />
          );
        })}
      </div>
      {showCount && reviewCount !== undefined && (
        <span className="text-[10px] font-semibold text-muted-foreground">
          {rating.toFixed(1)} ({reviewCount})
        </span>
      )}
    </div>
  );
};

export default StarRating;
