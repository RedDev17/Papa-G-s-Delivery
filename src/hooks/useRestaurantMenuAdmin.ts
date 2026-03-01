import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RestaurantMenuItem } from '../types';

export const useRestaurantMenuAdmin = (restaurantId: string | null) => {
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
      
      // Fetch menu items for the specific restaurant with their variations and add-ons
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

      const formattedItems: RestaurantMenuItem[] = items?.map(item => {
        // Calculate if discount is currently active
        const now = new Date();
        const discountStart = item.discount_start_date ? new Date(item.discount_start_date) : null;
        const discountEnd = item.discount_end_date ? new Date(item.discount_end_date) : null;
        
        const isDiscountActive = item.discount_active && 
          (!discountStart || now >= discountStart) && 
          (!discountEnd || now <= discountEnd);
        
        // Calculate effective price
        const effectivePrice = isDiscountActive && item.discount_price ? item.discount_price : item.base_price;

        return {
          id: item.id,
          restaurant_id: restaurantId,
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
          variations: item.variations?.map((v: {id: string, name: string, price: number}) => ({
            id: v.id,
            name: v.name,
            price: v.price
          })) || [],
          addOns: item.add_ons?.map((a: {id: string, name: string, price: number, category: string}) => ({
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

  const addMenuItem = async (item: Omit<RestaurantMenuItem, 'id' | 'restaurant_id'>, restaurantId: string) => {
    try {
      // Validate required fields
      if (!item.name || !item.description || !item.basePrice || !item.category) {
        throw new Error('Missing required fields: name, description, basePrice, or category');
      }

      // Insert menu item
      const { data: menuItem, error: itemError } = await supabase
        .from('menu_items')
        .insert({
          name: item.name.trim(),
          description: item.description.trim(),
          base_price: Number(item.basePrice),
          category: item.category,
          popular: item.popular || false,
          available: item.available ?? true,
          image_url: item.image && item.image.trim() !== '' ? item.image.trim() : null,
          discount_price: item.discountPrice && item.discountPrice > 0 ? Number(item.discountPrice) : null,
          discount_start_date: item.discountStartDate && item.discountStartDate.trim() !== '' ? item.discountStartDate : null,
          discount_end_date: item.discountEndDate && item.discountEndDate.trim() !== '' ? item.discountEndDate : null,
          discount_active: item.discountActive || false,
          restaurant_id: restaurantId
        })
        .select()
        .single();

      if (itemError) {
        console.error('Error inserting menu item:', itemError);
        throw new Error(itemError.message || 'Failed to create menu item');
      }

      // Insert variations if any (filter out empty ones)
      if (item.variations && item.variations.length > 0) {
        const validVariations = item.variations.filter(v => v.name && v.name.trim() !== '');
        if (validVariations.length > 0) {
          const { error: variationsError } = await supabase
            .from('variations')
            .insert(
              validVariations.map(v => ({
                menu_item_id: menuItem.id,
                name: v.name.trim(),
                price: Number(v.price) || 0
              }))
            );

          if (variationsError) {
            console.error('Error inserting variations:', variationsError);
            throw new Error(`Failed to add variations: ${variationsError.message}`);
          }
        }
      }

      // Insert add-ons if any (filter out empty ones)
      if (item.addOns && item.addOns.length > 0) {
        const validAddOns = item.addOns.filter(a => a.name && a.name.trim() !== '');
        if (validAddOns.length > 0) {
          const { error: addOnsError } = await supabase
            .from('add_ons')
            .insert(
              validAddOns.map(a => ({
                menu_item_id: menuItem.id,
                name: a.name.trim(),
                price: Number(a.price) || 0,
                category: a.category || 'extras'
              }))
            );

          if (addOnsError) {
            console.error('Error inserting add-ons:', addOnsError);
            throw new Error(`Failed to add add-ons: ${addOnsError.message}`);
          }
        }
      }

      await fetchMenuItems();
      return menuItem;
    } catch (err) {
      console.error('Error adding restaurant menu item:', err);
      throw err;
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<RestaurantMenuItem>) => {
    try {
      // Prepare update data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name.trim();
      if (updates.description !== undefined) updateData.description = updates.description.trim();
      if (updates.basePrice !== undefined) updateData.base_price = Number(updates.basePrice);
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.popular !== undefined) updateData.popular = updates.popular;
      if (updates.available !== undefined) updateData.available = updates.available;
      if (updates.image !== undefined) {
        updateData.image_url = updates.image && updates.image.trim() !== '' ? updates.image.trim() : null;
      }
      if (updates.discountPrice !== undefined) {
        updateData.discount_price = updates.discountPrice && updates.discountPrice > 0 ? Number(updates.discountPrice) : null;
      }
      if (updates.discountStartDate !== undefined) {
        updateData.discount_start_date = updates.discountStartDate && updates.discountStartDate.trim() !== '' ? updates.discountStartDate : null;
      }
      if (updates.discountEndDate !== undefined) {
        updateData.discount_end_date = updates.discountEndDate && updates.discountEndDate.trim() !== '' ? updates.discountEndDate : null;
      }
      if (updates.discountActive !== undefined) updateData.discount_active = updates.discountActive;

      // Update menu item
      const { error: itemError } = await supabase
        .from('menu_items')
        .update(updateData)
        .eq('id', id);

      if (itemError) {
        console.error('Error updating menu item:', itemError);
        throw new Error(itemError.message || 'Failed to update menu item');
      }

      // Delete existing variations and add-ons
      await supabase.from('variations').delete().eq('menu_item_id', id);
      await supabase.from('add_ons').delete().eq('menu_item_id', id);

      // Insert new variations (filter out empty ones)
      if (updates.variations && updates.variations.length > 0) {
        const validVariations = updates.variations.filter(v => v.name && v.name.trim() !== '');
        if (validVariations.length > 0) {
          const { error: variationsError } = await supabase
            .from('variations')
            .insert(
              validVariations.map(v => ({
                menu_item_id: id,
                name: v.name.trim(),
                price: Number(v.price) || 0
              }))
            );

          if (variationsError) {
            console.error('Error updating variations:', variationsError);
            throw new Error(`Failed to update variations: ${variationsError.message}`);
          }
        }
      }

      // Insert new add-ons (filter out empty ones)
      if (updates.addOns && updates.addOns.length > 0) {
        const validAddOns = updates.addOns.filter(a => a.name && a.name.trim() !== '');
        if (validAddOns.length > 0) {
          const { error: addOnsError } = await supabase
            .from('add_ons')
            .insert(
              validAddOns.map(a => ({
                menu_item_id: id,
                name: a.name.trim(),
                price: Number(a.price) || 0,
                category: a.category || 'extras'
              }))
            );

          if (addOnsError) {
            console.error('Error updating add-ons:', addOnsError);
            throw new Error(`Failed to update add-ons: ${addOnsError.message}`);
          }
        }
      }

      await fetchMenuItems();
    } catch (err) {
      console.error('Error updating restaurant menu item:', err);
      throw err;
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchMenuItems();
    } catch (err) {
      console.error('Error deleting restaurant menu item:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, [restaurantId]);

  return {
    menuItems,
    loading,
    error,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    refetch: fetchMenuItems
  };
};

