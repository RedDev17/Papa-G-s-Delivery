import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface PaymentMethod {
  id: string;
  name: string;
  account_number: string;
  account_name: string;
  qr_code_url: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      setPaymentMethods(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payment methods');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPaymentMethods = async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('payment_methods')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      setPaymentMethods(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching all payment methods:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payment methods');
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = async (method: Omit<PaymentMethod, 'created_at' | 'updated_at'>) => {
    try {
      // Check if ID already exists (only if ID is provided)
      if (method.id) {
        const { data: existing, error: checkError } = await supabase
          .from('payment_methods')
          .select('id')
          .eq('id', method.id)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw checkError;
        }

        if (existing) {
          throw new Error(`Payment method with ID "${method.id}" already exists. Please use a different ID.`);
        }
      }

      // Prepare insert data - handle both UUID and text ID schemas
      const insertData: any = {
        name: method.name,
        account_number: method.account_number,
        account_name: method.account_name,
        qr_code_url: method.qr_code_url || 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
        active: method.active ?? true,
        sort_order: method.sort_order ?? 0
      };

      // Only include ID if it's provided (for text-based IDs)
      // If database uses UUID, it will auto-generate
      if (method.id) {
        insertData.id = method.id;
      }

      const { data, error: insertError } = await supabase
        .from('payment_methods')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        // Provide more helpful error messages
        console.error('Insert error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        
        if (insertError.code === '23505') {
          throw new Error(`Payment method with ID "${method.id || 'this ID'}" already exists. Please use a different ID.`);
        } else if (insertError.code === '42501') {
          throw new Error('Permission denied. Please make sure you are logged in as an admin.');
        } else if (insertError.code === 'PGRST116') {
          throw new Error('No data returned. The payment method may not have been created.');
        } else if (insertError.code === '42804' || insertError.message?.includes('uuid') || insertError.message?.includes('text')) {
          throw new Error('Database schema mismatch. The payment_methods table may need to be updated. Please run the latest migration.');
        } else {
          const errorMsg = insertError.message || insertError.details || insertError.hint || `Error code: ${insertError.code || 'unknown'}`;
          throw new Error(`Failed to add payment method: ${errorMsg}`);
        }
      }

      if (!data) {
        throw new Error('Payment method was not created. Please try again.');
      }

      await fetchAllPaymentMethods();
      return data;
    } catch (err) {
      console.error('Error adding payment method:', err);
      throw err;
    }
  };

  const updatePaymentMethod = async (id: string, updates: Partial<PaymentMethod>) => {
    try {
      const { error: updateError } = await supabase
        .from('payment_methods')
        .update({
          name: updates.name,
          account_number: updates.account_number,
          account_name: updates.account_name,
          qr_code_url: updates.qr_code_url,
          active: updates.active,
          sort_order: updates.sort_order
        })
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchAllPaymentMethods();
    } catch (err) {
      console.error('Error updating payment method:', err);
      throw err;
    }
  };

  const deletePaymentMethod = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchAllPaymentMethods();
    } catch (err) {
      console.error('Error deleting payment method:', err);
      throw err;
    }
  };

  const reorderPaymentMethods = async (reorderedMethods: PaymentMethod[]) => {
    try {
      const updates = reorderedMethods.map((method, index) => ({
        id: method.id,
        sort_order: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('payment_methods')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      await fetchAllPaymentMethods();
    } catch (err) {
      console.error('Error reordering payment methods:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  return {
    paymentMethods,
    loading,
    error,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    reorderPaymentMethods,
    refetch: fetchPaymentMethods,
    refetchAll: fetchAllPaymentMethods
  };
};