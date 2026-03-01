import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CustomLocation } from '../types';

export const useCustomLocations = () => {
  const [locations, setLocations] = useState<CustomLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('custom_locations')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      setLocations(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching custom locations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const addLocation = async (location: Omit<CustomLocation, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('custom_locations')
        .insert({
          name: location.name.trim(),
          latitude: location.latitude,
          longitude: location.longitude,
          active: location.active ?? true,
          sort_order: location.sort_order ?? locations.length
        })
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchLocations();
      return data;
    } catch (err) {
      console.error('Error adding custom location:', err);
      throw err;
    }
  };

  const updateLocation = async (id: string, updates: Partial<CustomLocation>) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name.trim();
      if (updates.latitude !== undefined) updateData.latitude = updates.latitude;
      if (updates.longitude !== undefined) updateData.longitude = updates.longitude;
      if (updates.active !== undefined) updateData.active = updates.active;
      if (updates.sort_order !== undefined) updateData.sort_order = updates.sort_order;

      const { error: updateError } = await supabase
        .from('custom_locations')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchLocations();
    } catch (err) {
      console.error('Error updating custom location:', err);
      throw err;
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('custom_locations')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchLocations();
    } catch (err) {
      console.error('Error deleting custom location:', err);
      throw err;
    }
  };

  // Search active locations by name (case-insensitive substring match)
  const searchLocations = useCallback((query: string): Array<{ label: string; value: { lat: number; lng: number }; isCustom: true }> => {
    if (!query || query.length < 2) return [];
    const lowerQuery = query.toLowerCase();
    return locations
      .filter(loc => loc.active && loc.name.toLowerCase().includes(lowerQuery))
      .map(loc => ({
        label: loc.name,
        value: { lat: loc.latitude, lng: loc.longitude },
        isCustom: true as const
      }));
  }, [locations]);

  return {
    locations,
    loading,
    error,
    addLocation,
    updateLocation,
    deleteLocation,
    searchLocations,
    refetch: fetchLocations
  };
};
