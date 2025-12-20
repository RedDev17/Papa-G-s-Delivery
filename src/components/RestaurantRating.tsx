import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useRestaurantRating } from '../hooks/useRestaurantRating';

interface RestaurantRatingProps {
  restaurantId: string;
  currentRating: number;
  reviewCount: number;
  onRatingUpdate?: () => void;
}

const RestaurantRating: React.FC<RestaurantRatingProps> = ({
  restaurantId,
  currentRating,
  reviewCount,
  onRatingUpdate
}) => {
  const { hasRated, userRating, isSubmitting, error, submitRating } = useRestaurantRating(restaurantId);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRatingClick = async (rating: number) => {
    if (hasRated) {
      return; // Already rated
    }

    const success = await submitRating(rating);
    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        if (onRatingUpdate) {
          onRatingUpdate();
        }
      }, 2000);
    }
  };

  const displayRating = hoveredRating || userRating || currentRating;

  return (
    <div className="flex flex-col gap-2">
      {/* Current Rating Display */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-5 w-5 ${
                star <= displayRating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-gray-700 font-medium">
          {currentRating > 0 ? currentRating.toFixed(1) : '0.0'} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      </div>

      {/* Rating Input (if not rated yet) */}
      {hasRated === false && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600">Rate this restaurant:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(null)}
                  disabled={isSubmitting}
                  className={`transition-all duration-200 ${
                    isSubmitting
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-110 cursor-pointer'
                  }`}
                  title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= (hoveredRating || 0)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {isSubmitting && (
            <p className="text-sm text-gray-500">Submitting rating...</p>
          )}
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">Thank you for your rating!</p>
        </div>
      )}

      {/* Already Rated Message */}
      {hasRated === true && userRating && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">You rated this restaurant:</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= userRating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantRating;
