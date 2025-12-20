import { useState, useCallback } from 'react';

interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  boundingbox: string[];
}

export const useOpenStreetMap = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PapaGsDelivery/1.0',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }

      const data: NominatimResult = await response.json();
      return data.display_name;
    } catch (err) {
      console.error('Error reverse geocoding:', err);
      setError('Failed to get address from location');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchAddress = useCallback(async (query: string): Promise<NominatimResult[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
        {
          headers: {
            'User-Agent': 'PapaGsDelivery/1.0',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search address');
      }

      const data: NominatimResult[] = await response.json();
      return data;
    } catch (err) {
      console.error('Error searching address:', err);
      setError('Failed to search address');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    reverseGeocode,
    searchAddress,
    loading,
    error
  };
};
