import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Delivery center: Floridablanca, Pampanga
// This is the point from which delivery distance is calculated
const DELIVERY_CENTER = {
  lat: 14.97463, 
  lng: 120.52821,
  address: 'Floridablanca Municipal Hall, Macabulos Street, Hacienda Teodoro, Maligaya, Floridablanca, Pampanga, Central Luzon, 2006, Philippines'
};

// Maximum delivery radius in kilometers from delivery center (adjust as needed)
const MAX_DELIVERY_RADIUS_KM = 100;

interface DistanceResult {
  distance: number; // in kilometers
  duration?: string;
}

// Helper function to detect if an address contains a Plus Code (e.g., "XGHH+22")
const containsPlusCode = (address: string): boolean => {
  // Plus Code pattern: 2-4 uppercase letters/digits, followed by +, followed by 2-4 characters
  // Examples: XGHH+22, 8FVC+9M, etc.
  const plusCodePattern = /[A-Z0-9]{2,4}\+[A-Z0-9]{2,4}/i;
  return plusCodePattern.test(address);
};

// Helper function to normalize Plus Code in address
const normalizePlusCodeAddress = (address: string): string => {
  // If address contains a Plus Code, ensure it's properly formatted
  // Plus Codes work with both Google Maps and OpenStreetMap
  // Format: "PLUSCODE Location" or "Location PLUSCODE"
  return address.trim();
};

// Helper function to normalize and fix common typos in Philippine addresses
const normalizePhilippineAddress = (address: string): string => {
  let normalized = address.trim();
  
  // Fix common typos for Pampanga
  normalized = normalized.replace(/\bpangpaga\b/gi, 'Pampanga');
  normalized = normalized.replace(/\bpampanga\b/gi, 'Pampanga'); // Ensure proper capitalization
  
  // Normalize common Philippine address abbreviations
  normalized = normalized.replace(/\bbrgy\b/gi, 'Barangay');
  normalized = normalized.replace(/\bbgy\b/gi, 'Barangay');
  normalized = normalized.replace(/\bpurok\b/gi, 'Purok');
  normalized = normalized.replace(/\bblk\b/gi, 'Block');
  normalized = normalized.replace(/\bst\b/gi, 'Street');
  normalized = normalized.replace(/\bave\b/gi, 'Avenue');
  normalized = normalized.replace(/\bav\b/gi, 'Avenue');
  
  // Ensure Floridablanca is properly capitalized
  normalized = normalized.replace(/\bfloridablanca\b/gi, 'Floridablanca');
  
  return normalized;
};

export const useGoogleMaps = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Use delivery center coordinates (will be geocoded, but start with default)
  const [deliveryCenterCoords, setDeliveryCenterCoords] = useState<{ lat: number; lng: number }>({
    lat: DELIVERY_CENTER.lat,
    lng: DELIVERY_CENTER.lng
  });
  
  const [deliverySettings, setDeliverySettings] = useState<{ baseFee: number; perKmFee: number; baseDistance: number }>({
    baseFee: 60,
    perKmFee: 13,
    baseDistance: 3
  });

  // Fetch delivery settings from database
  useEffect(() => {
    const fetchDeliverySettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .in('id', ['delivery_base_fee', 'delivery_per_km_fee', 'delivery_base_distance']);

        if (error) throw error;

        if (data) {
          const settings: any = {};
          data.forEach((item: any) => {
            settings[item.id] = parseFloat(item.value);
          });
          
          setDeliverySettings({
            baseFee: settings.delivery_base_fee || 60,
            perKmFee: settings.delivery_per_km_fee || 13,
            baseDistance: settings.delivery_base_distance || 0
          });
        }
      } catch (err) {
        console.error('Error fetching delivery settings:', err);
        // Keep default values if fetch fails
      }
    };

    fetchDeliverySettings();
  }, []);

  // Calculate distance using Haversine formula (straight-line distance)
  const calculateDistanceHaversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightLineDistance = R * c;
    
    // Add 20% buffer for road distance (straight-line is usually shorter than actual road distance)
    return straightLineDistance * 1.2;
  };

  // Search for address suggestions (for autocomplete)
  const searchAddressOSM = async (query: string): Promise<Array<{ label: string; value: { lat: number; lng: number }; raw: any }>> => {
    try {
      if (!query || query.length < 3) return [];

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=ph&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'E-Run-Delivery-App'
          }
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      
      return data.map((item: any) => ({
        label: item.display_name,
        value: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        },
        raw: item
      }));
    } catch (err) {
      console.error('OSM search error:', err);
      return [];
    }
  };

  // Get coordinates from address using OpenStreetMap Nominatim (FREE, no API key needed)
  // Supports regular addresses and Plus Codes (e.g., "XGHH+22 Floridablanca, Pampanga")
  const geocodeAddressOSM = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      // Normalize the address (fix typos, expand abbreviations)
      const normalizedAddress = normalizePhilippineAddress(normalizePlusCodeAddress(address));
      
      // Try multiple address variations for better geocoding success
      // Prioritize most specific location but allow broader searches
      const addressVariations = [
        normalizedAddress, // Try exact input first (best for "SM Bacoor", "Luneta")
        `${normalizedAddress}, Philippines`,
        `${normalizedAddress}, Pampanga, Philippines`, // Keep Pampanga bias as fallback/option
      ];
      
      // Remove duplicates
      const uniqueVariations = [...new Set(addressVariations)];
      
      // Try each variation until one works
      for (const fullAddress of uniqueVariations) {
        // If address contains a Plus Code, use it as-is (Plus Codes are already precise)
        const searchAddress = containsPlusCode(fullAddress) ? fullAddress : fullAddress;
      
      // Remove viewbox restriction to allow searching anywhere
      // We can still use countrycodes=ph to limit to Philippines
      
      const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1&countrycodes=ph`,
        {
          headers: {
            'User-Agent': 'E-Run-Delivery-App' // Required by Nominatim
          }
        }
      );
      
      if (!response.ok) {
          continue; // Try next variation
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        }
      }
      
      return null;
    } catch (err) {
      console.error('OpenStreetMap geocoding error:', err);
      return null;
    }
  };

  // Alternative: Try Google Maps API if key is provided (optional)
  // Supports regular addresses and Plus Codes (e.g., "XGHH+22 Floridablanca, Pampanga")
  const geocodeAddressGoogle = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return null;
    }

    try {
      // Normalize the address (fix typos, expand abbreviations)
      const normalizedAddress = normalizePhilippineAddress(normalizePlusCodeAddress(address));
      
      // Try multiple address variations for better geocoding success
      const addressVariations = [
        normalizedAddress, // Original normalized
        normalizedAddress.includes('Floridablanca') ? normalizedAddress : `${normalizedAddress}, Floridablanca`,
        normalizedAddress.includes('Pampanga') ? normalizedAddress : `${normalizedAddress}, Pampanga`,
        `${normalizedAddress}, Floridablanca, Pampanga, Philippines`,
      ];
      
      // Remove duplicates
      const uniqueVariations = [...new Set(addressVariations)];
      
      // Try each variation until one works
      for (const searchAddress of uniqueVariations) {
        // Google Maps API natively supports Plus Codes
      const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchAddress)}&key=${apiKey}&region=ph`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
        }
      }
      
      return null;
    } catch (err) {
      console.error('Google geocoding error:', err);
      return null;
    }
  };

  // Geocode delivery center address on first load
  useEffect(() => {
    const geocodeDeliveryCenter = async () => {
      try {
        // Try Google geocoding first
        let coords = await geocodeAddressGoogle(DELIVERY_CENTER.address);
        if (!coords) {
          // Fallback to OpenStreetMap
          coords = await geocodeAddressOSM(DELIVERY_CENTER.address);
        }
        if (coords) {
          setDeliveryCenterCoords(coords);
          console.log('Delivery center geocoded:', coords);
        }
      } catch (err) {
        console.error('Error geocoding delivery center:', err);
      }
    };
    geocodeDeliveryCenter();
  }, []);

  // Calculate distance using Google Maps Distance Matrix API (if key is provided)
  const calculateDistanceGoogle = async (destinationAddress: string): Promise<DistanceResult | null> => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return null;
    }

    try {
      // Use delivery center coordinates for distance calculation
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${deliveryCenterCoords.lat},${deliveryCenterCoords.lng}&destinations=${encodeURIComponent(destinationAddress)}&key=${apiKey}&units=metric&region=ph`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
        const element = data.rows[0].elements[0];
        const distanceInKm = element.distance.value / 1000; // Convert meters to kilometers
        const duration = element.duration.text;
        
        return {
          distance: Math.round(distanceInKm * 10) / 10, // Round to 1 decimal place
          duration
        };
      }
    } catch (err) {
      console.warn('Google Maps API error:', err);
    }
    
    return null;
  };

  // Calculate distance using OSRM (Open Source Routing Machine) - Free and accurate road distance
  const calculateDistanceOSRM = async (origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<DistanceResult | null> => {
    try {
      // OSRM expects coordinates in "lng,lat" format
      // Use 'driving' profile for car/motorcycle routes
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false&steps=false`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceInKm = route.distance / 1000; // Convert meters to kilometers
        const durationInSeconds = route.duration;
        const durationInMinutes = Math.round(durationInSeconds / 60);
        
        return {
          distance: Math.round(distanceInKm * 10) / 10, // Round to 1 decimal place
          duration: `${durationInMinutes} mins`
        };
      }
      return null;
    } catch (err) {
      console.warn('OSRM calculation error:', err);
      return null;
    }
  };

  // Main distance calculation function - calculates from delivery center (or provided origin) to customer address
  const calculateDistance = useCallback(async (destinationAddress: string, origin?: { lat: number; lng: number }): Promise<DistanceResult | null> => {
    setLoading(true);
    setError(null);

    const startCoords = origin || deliveryCenterCoords;

    try {
      // Try Google Maps API first if key is available (more accurate road distance)
      // Note: We need to update calculateDistanceGoogle to accept origin too, but for now let's focus on the logic flow
      // For simplicity, if origin is provided, we might skip the Google API call inside calculateDistanceGoogle 
      // unless we refactor it. Let's refactor it inline or update it.
      
      // Actually, let's just use the generic calculateDistanceBetweenAddresses if we have a custom origin and Google Key
      // But calculateDistanceBetweenAddresses takes string addresses.
      // If we have coords, we can use Haversine or reverse geocode.
      
      // Let's stick to Haversine for custom origin for now to avoid complexity/cost, 
      // or use the existing flow but with startCoords.

      // Fallback: Use free OpenStreetMap geocoding + Haversine formula
      // Try Google geocoding first (if key available), then OSM
      let coords = await geocodeAddressGoogle(destinationAddress);
      if (!coords) {
        coords = await geocodeAddressOSM(destinationAddress);
      }

      if (coords) {
        // Try OSRM first for accurate road distance
        const osrmResult = await calculateDistanceOSRM(startCoords, coords);
        
        if (osrmResult) {
          setLoading(false);
          return osrmResult;
        }

        // Fallback to Haversine if OSRM fails
        const distance = calculateDistanceHaversine(
          startCoords.lat,
          startCoords.lng,
          coords.lat,
          coords.lng
        );
        setLoading(false);
        return {
          distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
        };
      }

      // If all geocoding fails
      setError('Could not find the address. Please enter a complete address including barangay and city.');
      setLoading(false);
      return null;
    } catch (err) {
      console.error('Distance calculation error:', err);
      setError('Failed to calculate distance. Please try again.');
      setLoading(false);
      return null;
    }
  }, [deliveryCenterCoords]);

  // Calculate distance between two arbitrary addresses (e.g., Angkas/Padala pickup -> drop-off)
  const calculateDistanceBetweenAddresses = useCallback(
    async (pickupAddress: string, dropoffAddress: string): Promise<DistanceResult & { pickupCoordinates?: { lat: number, lng: number }, dropoffCoordinates?: { lat: number, lng: number } } | null> => {
      setLoading(true);
      setError(null);

      try {
        // Fallback: geocode both addresses and use Haversine
        // We do this first or in parallel if we want coordinates, because Google Distance Matrix doesn't return coordinates of the points, only distance.
        // So we need to geocode anyway if we want to show markers.
        
        let pickupCoords = await geocodeAddressGoogle(pickupAddress);
        if (!pickupCoords) {
          pickupCoords = await geocodeAddressOSM(pickupAddress);
        }

        let dropoffCoords = await geocodeAddressGoogle(dropoffAddress);
        if (!dropoffCoords) {
          dropoffCoords = await geocodeAddressOSM(dropoffAddress);
        }

        if (pickupCoords && dropoffCoords) {
          // Try OSRM first for accurate road distance
          const osrmResult = await calculateDistanceOSRM(pickupCoords, dropoffCoords);
          
          if (osrmResult) {
            setLoading(false);
            return {
                ...osrmResult,
                pickupCoordinates: pickupCoords,
                dropoffCoordinates: dropoffCoords
            };
          }

          // Fallback to Haversine if OSRM fails
          const distance = calculateDistanceHaversine(
            pickupCoords.lat,
            pickupCoords.lng,
            dropoffCoords.lat,
            dropoffCoords.lng
          );

          setLoading(false);
          return {
            distance: Math.round(distance * 10) / 10,
            pickupCoordinates: pickupCoords,
            dropoffCoordinates: dropoffCoords
          };
        }

        setError('Could not find pickup or drop-off address. Please enter complete addresses.');
        setLoading(false);
        return null;
      } catch (err) {
        console.error('Distance calculation error (pickup->dropoff):', err);
        setError('Failed to calculate distance. Please try again.');
        setLoading(false);
        return null;
      }
    },
    []
  );

  // Calculate delivery fee (shared by Food / Pabili / Padala / Angkas)
  // Dynamic delivery fee calculation based on settings
  const calculateDeliveryFee = useCallback((distance: number | null): number => {
    if (distance === null || distance === undefined || isNaN(distance)) {
      return deliverySettings.baseFee; // Base fee if distance cannot be calculated
    }

    // Calculate total: base fee + ((distance - baseDistance) * per km fee)
    // If distance is within base distance, only base fee applies
    // Only charge for every FULL kilometer added (step pricing)
    const chargeableDistance = Math.max(0, distance - deliverySettings.baseDistance);
    const chargeableFullKm = Math.floor(chargeableDistance);
    return deliverySettings.baseFee + (chargeableFullKm * deliverySettings.perKmFee);
  }, [deliverySettings]);

  // Check if customer address is within delivery area (distance from restaurant)
  const isWithinDeliveryArea = useCallback(async (address: string, origin?: { lat: number; lng: number }): Promise<{ within: boolean; distance?: number; error?: string }> => {
    try {
      const startCoords = origin || deliveryCenterCoords;

      // Get coordinates for the customer's delivery address
      let coords = await geocodeAddressGoogle(address);
      if (!coords) {
        coords = await geocodeAddressOSM(address);
      }

      if (!coords) {
        return { within: false, error: 'Could not find the address location. Please check the spelling or try a more complete address.' };
      }

      // Calculate distance from delivery center to customer address
      const distanceFromCenter = calculateDistanceHaversine(
        startCoords.lat,
        startCoords.lng,
        coords.lat,
        coords.lng
      );

      const within = distanceFromCenter <= MAX_DELIVERY_RADIUS_KM;
      return { within, distance: Math.round(distanceFromCenter * 10) / 10 };
    } catch (err) {
      console.error('Delivery area check error:', err);
      return { within: false, error: 'Failed to check delivery area.' };
    }
  }, [deliveryCenterCoords]);

  return {
    calculateDistance,
    calculateDistanceBetweenAddresses,
    calculateDeliveryFee,
    isWithinDeliveryArea,
    loading,
    error,
    restaurantLocation: DELIVERY_CENTER,
    maxDeliveryRadius: MAX_DELIVERY_RADIUS_KM,
    deliverySettings,
    searchAddressOSM
  };
};
