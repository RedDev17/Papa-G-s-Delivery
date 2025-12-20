import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DeliverySettings {
  delivery_base_fee: number;
  delivery_per_km_fee: number;
}

const DeliveryFeeManager: React.FC = () => {
  const [settings, setSettings] = useState<DeliverySettings>({
    delivery_base_fee: 60,
    delivery_per_km_fee: 13
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('id', ['delivery_base_fee', 'delivery_per_km_fee']);

      if (error) throw error;

      if (data) {
        const newSettings: any = {};
        data.forEach(item => {
          newSettings[item.id] = parseFloat(item.value);
        });
        setSettings(prev => ({ ...prev, ...newSettings }));
      }
    } catch (err) {
      console.error('Error fetching delivery settings:', err);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const updates = [
        { id: 'delivery_base_fee', value: settings.delivery_base_fee.toString() },
        { id: 'delivery_per_km_fee', value: settings.delivery_per_km_fee.toString() }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value: update.value })
          .eq('id', update.id);

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Settings saved successfully' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving delivery settings:', err);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-delivery-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Delivery Fee Settings</h2>
        <button 
          onClick={fetchSettings}
          className="p-2 text-gray-500 hover:text-delivery-primary transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <AlertCircle className="h-5 w-5" />
          <p>{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Delivery Fee (₱)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
              <input
                type="number"
                name="delivery_base_fee"
                value={settings.delivery_base_fee}
                onChange={handleChange}
                min="0"
                step="1"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Fixed fee charged for every delivery.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fee Per Kilometer (₱)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
              <input
                type="number"
                name="delivery_per_km_fee"
                value={settings.delivery_per_km_fee}
                onChange={handleChange}
                min="0"
                step="0.5"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Additional fee charged for each kilometer of distance.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center space-x-2 px-6 py-2 bg-delivery-primary text-white rounded-lg hover:bg-delivery-dark transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeliveryFeeManager;
