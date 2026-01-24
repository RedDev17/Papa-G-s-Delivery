import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useRestaurantRating = (restaurantId: string) => {
  const [hasRated, setHasRated] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);

  // Get user's IP address
  const getUserIP = useCallback(async (): Promise<string> => {
    try {
      // Try to get IP from a free service
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (err) {
      console.error('Error getting IP address:', err);
      // Fallback: generate a unique identifier based on browser fingerprint
      // This is not perfect but better than nothing
      const fallbackId = `browser_${navigator.userAgent.replace(/\s/g, '')}_${Date.now()}`;
      return fallbackId.substring(0, 50); // Limit length
    }
  }, []);

  // Check if current IP has already rated this restaurant
  const checkIfRated = useCallback(async () => {
    try {
      const ipAddress = await getUserIP();
      
      // Check if this IP has rated this restaurant
      const { data, error: checkError } = await supabase
        .from('restaurant_ratings')
        .select('id, rating')
        .eq('restaurant_id', restaurantId)
        .eq('ip_address', ipAddress)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking rating:', checkError);
        setHasRated(false);
        return;
      }

      if (data) {
        setHasRated(true);
        setUserRating(data.rating);
      } else {
        setHasRated(false);
      }
    } catch (err) {
      console.error('Error checking if rated:', err);
      setHasRated(false);
    }
  }, [restaurantId, getUserIP]);

  // Submit a rating
  const submitRating = useCallback(async (rating: number) => {
    if (rating < 1 || rating > 5) {
      setError('Rating must be between 1 and 5');
      return false;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const ipAddress = await getUserIP();

      // Check if already rated
      const { data: existingRating } = await supabase
        .from('restaurant_ratings')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('ip_address', ipAddress)
        .maybeSingle();

      if (existingRating) {
        setError('You have already rated this restaurant from this device.');
        setIsSubmitting(false);
        return false;
      }

      // Insert new rating
      const { error: insertError } = await supabase
        .from('restaurant_ratings')
        .insert({
          restaurant_id: restaurantId,
          rating: rating,
          ip_address: ipAddress
        });

      if (insertError) {
        // Check if it's a unique constraint violation (already rated)
        if (insertError.code === '23505') {
          setError('You have already rated this restaurant from this device.');
        } else {
          setError(insertError.message || 'Failed to submit rating');
        }
        setIsSubmitting(false);
        return false;
      }

      // Success - update local state
      setHasRated(true);
      setUserRating(rating);
      setIsSubmitting(false);
      
      // Return true to indicate success
      return true;
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
      setIsSubmitting(false);
      return false;
    }
  }, [restaurantId, getUserIP]);

  // Check on mount
  useEffect(() => {
    if (restaurantId) {
      checkIfRated();
    }
  }, [restaurantId, checkIfRated]);

  return {
    hasRated,
    userRating,
    isSubmitting,
    error,
    submitRating,
    checkIfRated
  };
};
