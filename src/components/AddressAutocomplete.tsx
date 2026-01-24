import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Navigation, Building2, Home, Landmark, Store, ChefHat } from 'lucide-react';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { useOpenStreetMap } from '../hooks/useOpenStreetMap';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: string, lat: number, lng: number) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  name?: string;
  className?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter address',
  label,
  required = false,
  name,
  className
}) => {
  const [suggestions, setSuggestions] = useState<Array<{ label: string; value: { lat: number; lng: number }; raw?: any }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { searchAddressOSM } = useGoogleMaps();
  const { reverseGeocode } = useOpenStreetMap();
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Get appropriate icon based on location type from Nominatim
  const getLocationIcon = (raw?: any) => {
    if (!raw) return <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />;
    
    const type = raw.type?.toLowerCase() || '';
    const category = raw.class?.toLowerCase() || '';
    
    // Restaurant, food, cafe
    if (type.includes('restaurant') || type.includes('cafe') || type.includes('fast_food') || 
        type.includes('food') || category === 'amenity' && (type.includes('bar') || type.includes('pub'))) {
      return <ChefHat className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />;
    }
    
    // Shops and stores
    if (category === 'shop' || type.includes('mall') || type.includes('supermarket') || 
        type.includes('convenience') || type.includes('store') || type.includes('market')) {
      return <Store className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />;
    }
    
    // Government, landmarks, places of worship
    if (type.includes('government') || type.includes('townhall') || type.includes('city_hall') ||
        type.includes('museum') || type.includes('monument') || type.includes('memorial') ||
        type.includes('church') || type.includes('place_of_worship') || category === 'historic') {
      return <Landmark className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />;
    }
    
    // Buildings, offices, commercial
    if (category === 'building' || type.includes('office') || type.includes('commercial') ||
        type.includes('industrial') || type.includes('hotel') || type.includes('hospital') ||
        type.includes('school') || type.includes('university') || type.includes('college')) {
      return <Building2 className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />;
    }
    
    // Residential
    if (type.includes('house') || type.includes('residential') || type.includes('apartment') ||
        type.includes('apartments') || type.includes('subdivision') || category === 'place' && 
        (type.includes('village') || type.includes('suburb') || type.includes('neighbourhood'))) {
      return <Home className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />;
    }
    
    // Default pin icon
    return <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />;
  };

  // Handle outside click to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value.length >= 3 && showSuggestions) {
        setIsLoading(true);
        const results = await searchAddressOSM(value);
        setSuggestions(results);
        setIsLoading(false);
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value, showSuggestions, searchAddressOSM]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowSuggestions(true);
  };

  const handleSelect = (suggestion: { label: string; value: { lat: number; lng: number } }) => {
    onChange(suggestion.label);
    onSelect(suggestion.label, suggestion.value.lat, suggestion.value.lng);
    setShowSuggestions(false);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const address = await reverseGeocode(latitude, longitude);
          if (address) {
            onChange(address);
            onSelect(address, latitude, longitude);
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error('Error getting location:', error);
          alert('Could not get your location');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Could not get your location');
        setIsGettingLocation(false);
      }
    );
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          required={required}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent pr-10"
          autoComplete="off"
        />
        <div className="absolute right-3 top-3 text-gray-400">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <MapPin className="h-5 w-5" />
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isGettingLocation}
            className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 transition-colors flex items-center gap-3 text-blue-600"
          >
            <Navigation className={`h-5 w-5 ${isGettingLocation ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Use my current location</span>
          </button>
          
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors flex items-start gap-3"
            >
              {getLocationIcon(suggestion.raw)}
              <span className="text-sm text-gray-700">{suggestion.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
