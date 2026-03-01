import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, ArrowLeft, MapPin, ToggleLeft, ToggleRight } from 'lucide-react';
import { useCustomLocations } from '../hooks/useCustomLocations';

interface LocationFormData {
  name: string;
  latitude: string;
  longitude: string;
  active: boolean;
}

const emptyForm: LocationFormData = {
  name: '',
  latitude: '',
  longitude: '',
  active: true
};

interface LocationManagerProps {
  onBack: () => void;
}

const LocationManager: React.FC<LocationManagerProps> = ({ onBack }) => {
  const { locations, loading, addLocation, updateLocation, deleteLocation } = useCustomLocations();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LocationFormData>(emptyForm);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleEdit = (loc: { id: string; name: string; latitude: number; longitude: number; active: boolean }) => {
    setEditingId(loc.id);
    setIsAdding(false);
    setFormData({
      name: loc.name,
      latitude: String(loc.latitude),
      longitude: String(loc.longitude),
      active: loc.active
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a location name');
      return;
    }
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid latitude and longitude');
      return;
    }

    try {
      setIsProcessing(true);
      if (isAdding) {
        await addLocation({
          name: formData.name,
          latitude: lat,
          longitude: lng,
          active: formData.active,
          sort_order: locations.length
        });
      } else if (editingId) {
        await updateLocation(editingId, {
          name: formData.name,
          latitude: lat,
          longitude: lng,
          active: formData.active
        });
      }
      handleCancel();
    } catch (err) {
      console.error('Error saving location:', err);
      alert('Failed to save location');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    try {
      setIsProcessing(true);
      await deleteLocation(id);
    } catch (err) {
      console.error('Error deleting location:', err);
      alert('Failed to delete location');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await updateLocation(id, { active: !currentActive });
    } catch (err) {
      console.error('Error toggling location:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Dashboard</span>
              </button>
              <h1 className="text-2xl font-playfair font-semibold text-black">Manage Locations</h1>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>Add Location</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 font-medium">Custom Location Suggestions</p>
              <p className="text-sm text-blue-700 mt-1">
                Locations you add here will appear as priority suggestions when customers search for an address. 
                Enter the display name customers will see, along with the latitude and longitude coordinates.
              </p>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-medium text-black mb-4">
              {isAdding ? 'Add New Location' : 'Edit Location'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Barangay Hall - Floridablanca"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="e.g., 14.97463"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="e.g., 120.52821"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className="text-gray-600"
                >
                  {formData.active ? (
                    <ToggleRight className="h-8 w-8 text-green-600" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-gray-400" />
                  )}
                </button>
                <span className="text-sm text-gray-700">{formData.active ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{isProcessing ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 text-gray-600 px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Locations List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-black">
              Locations ({locations.length})
            </h3>
          </div>
          {locations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No locations added yet</p>
              <p className="text-sm mt-1">Add custom locations that will appear in the address search suggestions.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className={`px-6 py-4 flex items-center justify-between ${!loc.active ? 'opacity-60 bg-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <MapPin className={`h-5 w-5 flex-shrink-0 ${loc.active ? 'text-green-600' : 'text-gray-400'}`} />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{loc.name}</p>
                      <p className="text-sm text-gray-500">
                        Lat: {loc.latitude.toFixed(5)}, Lng: {loc.longitude.toFixed(5)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <button
                      onClick={() => handleToggleActive(loc.id, loc.active)}
                      title={loc.active ? 'Deactivate' : 'Activate'}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {loc.active ? (
                        <ToggleRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(loc)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(loc.id)}
                      disabled={isProcessing}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationManager;
