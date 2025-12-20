import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RestaurantMenuItem, MenuItem } from '../types';

export const useRestaurantMenu = (restaurantId: string) => {
  const [menuItems, setMenuItems] = useState<RestaurantMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuItems = async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch menu items for the specific restaurant
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select(`
          *,
          variations (*),
          add_ons (*)
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      // Format items for the restaurant
      const formattedItems: RestaurantMenuItem[] = items?.map(item => {
        const now = new Date();
        const discountStart = item.discount_start_date ? new Date(item.discount_start_date) : null;
        const discountEnd = item.discount_end_date ? new Date(item.discount_end_date) : null;
        
        const isDiscountActive = item.discount_active && 
          (!discountStart || now >= discountStart) && 
          (!discountEnd || now <= discountEnd);
        
        const effectivePrice = isDiscountActive && item.discount_price ? item.discount_price : item.base_price;

        return {
          id: item.id,
          restaurant_id: restaurantId, // Assign restaurant ID
          name: item.name,
          description: item.description,
          basePrice: item.base_price,
          category: item.category,
          popular: item.popular,
          available: item.available ?? true,
          image: item.image_url || undefined,
          discountPrice: item.discount_price || undefined,
          discountStartDate: item.discount_start_date || undefined,
          discountEndDate: item.discount_end_date || undefined,
          discountActive: item.discount_active || false,
          effectivePrice,
          isOnDiscount: isDiscountActive,
          variations: item.variations?.map(v => ({
            id: v.id,
            name: v.name,
            price: v.price
          })) || [],
          addOns: item.add_ons?.map(a => ({
            id: a.id,
            name: a.name,
            price: a.price,
            category: a.category
          })) || []
        };
      }) || [];

      setMenuItems(formattedItems);
      setError(null);
    } catch (err) {
      console.error('Error fetching restaurant menu items:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, [restaurantId]);

  return {
    menuItems,
    loading,
    error,
    refetch: fetchMenuItems
  };
};

