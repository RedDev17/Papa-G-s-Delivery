import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, Truck, Package, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ServiceSettings {
  base_fee: number;
  per_km_fee: number;
  base_distance: number;
}

interface DeliverySettings {
  food: ServiceSettings;
  padala: ServiceSettings;
  pabili: ServiceSettings;
}

const defaultSettings: DeliverySettings = {
  food: { base_fee: 60, per_km_fee: 13, base_distance: 3 },
  padala: { base_fee: 60, per_km_fee: 13, base_distance: 3 },
  pabili: { base_fee: 60, per_km_fee: 13, base_distance: 3 }
};

const DeliveryFeeManager: React.FC = () => {
  const [settings, setSettings] = useState<DeliverySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
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
        .in('id', [
          // Food delivery settings
          'delivery_base_fee', 'delivery_per_km_fee', 'delivery_base_distance',
          // Padala settings
          'padala_base_fee', 'padala_per_km_fee', 'padala_base_distance',
          // Pabili settings
          'pabili_base_fee', 'pabili_per_km_fee', 'pabili_base_distance'
        ]);

      if (error) throw error;

      if (data) {
        const newSettings: DeliverySettings = { ...defaultSettings };
        data.forEach(item => {
          const value = parseFloat(item.value);
          // Food delivery (original settings)
          if (item.id === 'delivery_base_fee') newSettings.food.base_fee = value;
          if (item.id === 'delivery_per_km_fee') newSettings.food.per_km_fee = value;
          if (item.id === 'delivery_base_distance') newSettings.food.base_distance = value;
          // Padala
          if (item.id === 'padala_base_fee') newSettings.padala.base_fee = value;
          if (item.id === 'padala_per_km_fee') newSettings.padala.per_km_fee = value;
          if (item.id === 'padala_base_distance') newSettings.padala.base_distance = value;
          // Pabili
          if (item.id === 'pabili_base_fee') newSettings.pabili.base_fee = value;
          if (item.id === 'pabili_per_km_fee') newSettings.pabili.per_km_fee = value;
          if (item.id === 'pabili_base_distance') newSettings.pabili.base_distance = value;
        });
        setSettings(newSettings);
      }
    } catch (err) {
      console.error('Error fetching delivery settings:', err);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (service: keyof DeliverySettings, field: keyof ServiceSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [service]: {
        ...prev[service],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const handleSave = async (service: keyof DeliverySettings) => {
    setSaving(service);
    setMessage(null);

    try {
      const prefixMap = {
        food: 'delivery',
        padala: 'padala',
        pabili: 'pabili'
      };
      const prefix = prefixMap[service];
      const serviceSettings = settings[service];

      const updates = [
        { 
          id: `${prefix}_base_fee`, 
          value: serviceSettings.base_fee.toString(),
          type: 'number',
          description: `Base delivery fee for ${service} in Pesos`
        },
        { 
          id: `${prefix}_per_km_fee`, 
          value: serviceSettings.per_km_fee.toString(),
          type: 'number',
          description: `Fee per kilometer for ${service} in Pesos`
        },
        { 
          id: `${prefix}_base_distance`, 
          value: serviceSettings.base_distance.toString(),
          type: 'number',
          description: `Base distance included in base fee for ${service} (km)`
        }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .upsert(update);

        if (error) throw error;
      }

      const serviceLabels = { food: 'Food Delivery', padala: 'Padala', pabili: 'Pabili' };
      setMessage({ type: 'success', text: `${serviceLabels[service]} settings saved successfully` });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving delivery settings:', err);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(null);
    }
  };

  const renderServiceSection = (
    service: keyof DeliverySettings,
    title: string,
    icon: React.ReactNode,
    colorClass: string
  ) => {
    const serviceSettings = settings[service];
    
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4" style={{ borderLeftColor: colorClass === 'delivery' ? '#22c55e' : colorClass === 'orange' ? '#f97316' : '#8b5cf6' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colorClass === 'delivery' ? 'bg-green-100 text-green-600' : colorClass === 'orange' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
              {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Fee (₱)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
              <input
                type="number"
                value={serviceSettings.base_fee}
                onChange={(e) => handleChange(service, 'base_fee', e.target.value)}
                min="0"
                step="1"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Fixed fee for every {title.toLowerCase()}.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fee Per KM (₱)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
              <input
                type="number"
                value={serviceSettings.per_km_fee}
                onChange={(e) => handleChange(service, 'per_km_fee', e.target.value)}
                min="0"
                step="0.5"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Extra fee per full km beyond base distance.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Distance (km)
            </label>
            <input
              type="number"
              value={serviceSettings.base_distance}
              onChange={(e) => handleChange(service, 'base_distance', e.target.value)}
              min="0"
              step="0.1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Distance included in base fee.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t flex justify-end">
          <button
            onClick={() => handleSave(service)}
            disabled={saving === service}
            className={`flex items-center justify-center space-x-2 px-5 py-2 rounded-lg text-white transition-colors disabled:opacity-50 ${
              colorClass === 'delivery' ? 'bg-green-600 hover:bg-green-700' :
              colorClass === 'orange' ? 'bg-orange-500 hover:bg-orange-600' :
              'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            <Save className="h-4 w-4" />
            <span>{saving === service ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-delivery-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <AlertCircle className="h-5 w-5" />
          <p>{message.text}</p>
        </div>
      )}

      {/* Food Delivery Section */}
      {renderServiceSection('food', 'Food Delivery', <Truck className="h-5 w-5" />, 'delivery')}

      {/* Padala Section */}
      {renderServiceSection('padala', 'Padala (Package Delivery)', <Package className="h-5 w-5" />, 'orange')}

      {/* Pabili Section */}
      {renderServiceSection('pabili', 'Pabili (Shopping Service)', <ShoppingBag className="h-5 w-5" />, 'purple')}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">💡 How Delivery Fees Work</h4>
        <p className="text-sm text-blue-700">
          <strong>Calculation:</strong> Base Fee + ((Distance - Base Distance) × Fee Per KM)
        </p>
        <p className="text-sm text-blue-700 mt-1">
          If the distance is within the base distance, only the base fee is charged. Extra fees apply for each full kilometer beyond the base distance.
        </p>
      </div>
    </div>
  );
};

export default DeliveryFeeManager;
