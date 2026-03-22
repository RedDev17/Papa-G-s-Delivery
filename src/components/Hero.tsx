import React from 'react';
import SearchBar from './SearchBar';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  restaurantCount?: number;
}

const Hero: React.FC<HeroProps> = ({ searchQuery, onSearchChange, restaurantCount = 8 }) => {
  return (
    <section className="relative bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 py-6 px-4 md:py-8 lg:py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center">
          {/* Branding */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white animate-fade-in drop-shadow-lg mb-3">
            Papa <span className="italic">G's Delivery</span>
          </h1>

          {/* Greeting */}
          <div className="mb-5">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-3xl md:text-4xl font-bold text-white">Hello!</h2>
              <span className="text-3xl md:text-4xl">👋</span>
            </div>
            <p className="text-white/90 text-lg md:text-xl">
              {restaurantCount} Restaurant{restaurantCount !== 1 ? 's' : ''} Available
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full max-w-2xl">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              placeholder="Search for restaurants, cuisines..."
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;