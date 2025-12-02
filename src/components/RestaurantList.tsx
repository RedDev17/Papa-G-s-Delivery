import React, { useMemo } from 'react';
import { Restaurant } from '../types';
import RestaurantCard from './RestaurantCard';

interface RestaurantListProps {
  restaurants: Restaurant[];
  searchQuery: string;
  onRestaurantClick: (restaurant: Restaurant) => void;
  loading?: boolean;
}

const RestaurantList: React.FC<RestaurantListProps> = ({
  restaurants,
  searchQuery,
  onRestaurantClick,
  loading = false
}) => {
  const filteredRestaurants = useMemo(() => {
    if (!searchQuery.trim()) {
      return restaurants;
    }

    const query = searchQuery.toLowerCase().trim();
    return restaurants.filter(restaurant =>
      restaurant.name.toLowerCase().includes(query) ||
      restaurant.type.toLowerCase().includes(query) ||
      restaurant.description?.toLowerCase().includes(query)
    );
  }, [restaurants, searchQuery]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-primary"></div>
          <p className="text-gray-600 mt-4">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''} available
        </h2>
      </div>

      {filteredRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onCardClick={onRestaurantClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No restaurants found</h3>
          <p className="text-gray-600">
            We couldn't find any restaurants matching "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  );
};

export default RestaurantList;

