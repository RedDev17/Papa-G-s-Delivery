import { useState, useEffect } from 'react';
import { Restaurant } from '../types';
import { supabase } from '../lib/supabase';

export const useRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = async (includeInactive: boolean = false) => {
    try {
      setLoading(true);
      let query = supabase
        .from('restaurants')
        .select('*');
      
      if (!includeInactive) {
        query = query.eq('active', true);
      }
      
      const { data, error: fetchError } = await query
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      const formattedRestaurants: Restaurant[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        image: item.image,
        logo: item.logo || undefined,
        rating: item.rating || 0,
        reviewCount: item.review_count || 0,
        deliveryTime: item.delivery_time,
        deliveryFee: item.delivery_fee || 0,
        description: item.description || undefined,
        active: item.active,
        sort_order: item.sort_order,
        latitude: item.latitude,
        longitude: item.longitude,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setRestaurants(formattedRestaurants);
      setError(null);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch restaurants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const getRestaurantById = (id: string): Restaurant | undefined => {
    return restaurants.find(r => r.id === id);
  };

  const addRestaurant = async (restaurant: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('restaurants')
        .insert({
          name: restaurant.name,
          type: restaurant.type,
          image: restaurant.image,
          logo: restaurant.logo || null,
          rating: restaurant.rating || 0,
          review_count: restaurant.reviewCount || 0,
          delivery_time: restaurant.deliveryTime,
          delivery_fee: restaurant.deliveryFee || 0,
          description: restaurant.description || null,
          active: restaurant.active ?? true,
          sort_order: restaurants.length
        })
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchRestaurants();
      return data;
    } catch (err) {
      console.error('Error adding restaurant:', err);
      throw err;
    }
  };

  const updateRestaurant = async (id: string, updates: Partial<Restaurant>) => {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.image !== undefined) updateData.image = updates.image;
      if (updates.logo !== undefined) updateData.logo = updates.logo || null;
      if (updates.rating !== undefined) updateData.rating = updates.rating;
      if (updates.reviewCount !== undefined) updateData.review_count = updates.reviewCount;
      if (updates.deliveryTime !== undefined) updateData.delivery_time = updates.deliveryTime;
      if (updates.deliveryFee !== undefined) updateData.delivery_fee = updates.deliveryFee;
      if (updates.description !== undefined) updateData.description = updates.description || null;
      if (updates.active !== undefined) updateData.active = updates.active;
      if (updates.sort_order !== undefined) updateData.sort_order = updates.sort_order;

      const { error: updateError } = await supabase
        .from('restaurants')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchRestaurants();
    } catch (err) {
      console.error('Error updating restaurant:', err);
      throw err;
    }
  };

  const deleteRestaurant = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchRestaurants();
    } catch (err) {
      console.error('Error deleting restaurant:', err);
      throw err;
    }
  };

  return {
    restaurants,
    loading,
    error,
    getRestaurantById,
    addRestaurant,
    updateRestaurant,
    deleteRestaurant,
    refetch: fetchRestaurants
  };
};

