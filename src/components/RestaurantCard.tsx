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
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-gray-200 group"
    >
      {/* Image Container */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(restaurant.name);
          }}
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{restaurant.name}</h3>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">{restaurant.type}</span>
          <div className="flex items-center gap-1">
            <Star className={`h-4 w-4 ${restaurant.rating > 0 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            <span className="text-sm text-gray-700 font-medium">
              {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : '0.0'}
              {restaurant.reviewCount > 0 && ` (${restaurant.reviewCount})`}
            </span>
          </div>
        </div>

        <div className="flex items-center mt-3">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{restaurant.deliveryTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;

