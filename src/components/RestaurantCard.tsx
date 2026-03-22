import React from 'react';
import { Clock, Star } from 'lucide-react';
import { Restaurant } from '../types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onCardClick: (restaurant: Restaurant) => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onCardClick }) => {
  return (
    <div
      onClick={() => onCardClick(restaurant)}
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 group flex flex-col h-full transform hover:-translate-y-1"
    >
      {/* Image Container */}
      <div className="relative h-48 md:h-52 bg-gray-100 overflow-hidden">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          onError={(e) => {
            const initial = restaurant.name.charAt(0).toUpperCase();
            e.currentTarget.src = `data:image/svg+xml,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23f3f4f6"/><text x="200" y="160" font-family="Arial,sans-serif" font-size="64" fill="%23d1d5db" text-anchor="middle" dominant-baseline="central">${initial}</text></svg>`
            )}`;
          }}
        />
        {/* Soft dark gradient at bottom of image for text readability if we wanted to overlay text, or just for depth */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        
        {/* Rating Pill overlaid on image */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-semibold text-gray-900">
            {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : 'New'}
          </span>
          {restaurant.reviewCount > 0 && (
            <span className="text-xs text-gray-500 font-medium">({restaurant.reviewCount})</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 text-left">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-1 group-hover:text-delivery-primary transition-colors duration-200">
            {restaurant.name}
          </h3>
        </div>
        
        <p className="text-sm font-medium text-gray-500 mb-4 line-clamp-1 bg-gray-50 inline-table px-2.5 py-1 rounded-md self-start">
          {restaurant.type}
        </p>

        {/* Bottom meta row */}
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-600 bg-orange-50/50 px-2 py-1 rounded-md">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold">{restaurant.deliveryTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;

