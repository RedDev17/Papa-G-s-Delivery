// src/components/RestaurantManager.tsx
import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Image as ImageIcon, Utensils } from 'lucide-react';
import { Restaurant } from '../types';
import { useRestaurantsAdmin } from '../hooks/useRestaurantsAdmin';
import ImageUpload from './ImageUpload';
import RestaurantMenuManager from './RestaurantMenuManager';

interface RestaurantManagerProps {
  onBack: () => void;
}

interface RestaurantFormData {
  name: string;
  type: 'Restaurant' | 'Cafe' | 'Fast Food' | 'Bakery' | 'Desserts';
  image: string;
  logo?: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: number;
  description?: string;
  active: boolean;
  sort_order?: number;
  latitude?: number;
  longitude?: number;
}

const RestaurantManager: React.FC<RestaurantManagerProps> = ({ onBack }) => {
  const { restaurants, loading, addRestaurant, updateRestaurant, deleteRestaurant, refetch } = useRestaurantsAdmin();
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit' | 'menu'>('list');
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [formData, setFormData] = useState<RestaurantFormData>({
    name: '',
    type: 'Restaurant',
    image: '',
    logo: '',
    rating: 0.0,
    reviewCount: 0,
    deliveryTime: '30-45 mins',
    deliveryFee: 0,
    description: '',
    active: true,
    sort_order: 0,
    latitude: 14.9677,
    longitude: 120.5076
  });

  const handleAdd = () => {
    setCurrentView('add');
    const maxSortOrder = restaurants.length > 0 
      ? Math.max(...restaurants.map(r => r.sort_order || 0)) 
      : 0;
  
    setFormData({
      name: '',
      type: 'Restaurant',
      image: '',
      logo: '',
      rating: 0.0,
      reviewCount: 0,
      deliveryTime: '30-45 mins',
      deliveryFee: 0,
      description: '',
      active: true,
      sort_order: maxSortOrder + 1,
      latitude: 14.9677,
      longitude: 120.5076
    });
  };

  const handleEdit = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name: restaurant.name,
      type: restaurant.type,
      image: restaurant.image,
      logo: restaurant.logo || '',
      rating: restaurant.rating,
      reviewCount: restaurant.reviewCount,
      deliveryTime: restaurant.deliveryTime,
      deliveryFee: restaurant.deliveryFee,
      description: restaurant.description || '',
      active: restaurant.active,
      sort_order: restaurant.sort_order || 0,
      latitude: restaurant.latitude || 14.9677,
      longitude: restaurant.longitude || 120.5076
    });
    setCurrentView('edit');
  };

  const handleSave = async () => {
    if (!formData.name?.trim() || !formData.image?.trim() || !formData.deliveryTime) {
      alert('Please fill in all required fields (Name, Image, and Delivery Time)');
      return;
    }

    try {
      const payload: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'> = {
        name: formData.name.trim(),
        type: formData.type,
        image: formData.image.trim(),
        logo: formData.logo && formData.logo.trim() !== '' ? formData.logo.trim() : undefined,
        rating: Number(formData.rating),
        reviewCount: Number(formData.reviewCount),
        deliveryTime: formData.deliveryTime,
        deliveryFee: 0, // Always 0 - delivery fee is calculated by distance, not fixed per restaurant
        description: formData.description || undefined,
        active: formData.active,
        sort_order: Number(formData.sort_order) || 0,
        latitude: Number(formData.latitude) || 14.9677,
        longitude: Number(formData.longitude) || 120.5076
      };
  
      if (currentView === 'edit' && editingRestaurant) {
        await updateRestaurant(editingRestaurant.id, payload);
      } else {
        await addRestaurant(payload);
      }
  
      setCurrentView('list');
      setEditingRestaurant(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save restaurant';
      alert(message);
    }
  };

  const handleCancel = () => {
    setCurrentView('list');
    setEditingRestaurant(null);
    setSelectedRestaurant(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this restaurant? This will also delete all its menu items.')) {
      try {
        await deleteRestaurant(id);
        refetch();
      } catch (_error) {
        alert('Failed to delete restaurant');
      }
    }
  };

  const handleManageMenu = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setCurrentView('menu');
  };

  const handleBackFromMenu = () => {
    setSelectedRestaurant(null);
    setCurrentView('list');
  };

  // Menu Management View
  if (currentView === 'menu' && selectedRestaurant) {
    return (
      <RestaurantMenuManager
        restaurantId={selectedRestaurant.id}
        restaurantName={selectedRestaurant.name}
        onBack={handleBackFromMenu}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'add' || currentView === 'edit') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button onClick={handleCancel} className="flex items-center space-x-2 text-gray-600 hover:text-black">
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back</span>
                </button>
                <h1 className="text-2xl font-playfair font-semibold text-black">
                  {currentView === 'add' ? 'Add Restaurant' : 'Edit Restaurant'}
                </h1>
              </div>
              <div className="flex space-x-3">
                <button onClick={handleCancel} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Restaurant Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter restaurant name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as RestaurantFormData['type'] })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="Restaurant">Restaurant</option>
                  <option value="Cafe">Cafe</option>
                  <option value="Fast Food">Fast Food</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Desserts">Desserts</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Delivery Time *</label>
                <input
                  type="text"
                  value={formData.deliveryTime}
                  onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., 30-45 mins"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Rating</label>
                <input
                  type="number"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="0.0"
                  min="0"
                  max="5"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Review Count</label>
                <input
                  type="number"
                  value={formData.reviewCount}
                  onChange={(e) => setFormData({ ...formData, reviewCount: Number(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Sort Order</label>
                <input
                  type="number"
                  value={formData.sort_order || 0}
                  onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Latitude</label>
                <input
                  type="number"
                  value={formData.latitude || ''}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="14.9677"
                  step="any"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Longitude</label>
                <input
                  type="number"
                  value={formData.longitude || ''}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="120.5076"
                  step="any"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-black">Active</span>
                </label>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-black mb-2">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Enter restaurant description"
                rows={3}
              />
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-black mb-2">Restaurant Image *</label>
              <ImageUpload
                currentImage={formData.image || undefined}
                onImageChange={(imageUrl) => {
                  setFormData({ 
                    ...formData, 
                    image: imageUrl && imageUrl.trim() !== '' ? imageUrl.trim() : '' 
                  });
                }}
              />
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-black mb-2">Logo (Optional)</label>
              <ImageUpload
                currentImage={formData.logo || undefined}
                onImageChange={(imageUrl) => {
                  setFormData({ 
                    ...formData, 
                    logo: imageUrl && imageUrl.trim() !== '' ? imageUrl.trim() : '' 
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button onClick={onBack} className="flex items-center space-x-2 text-gray-600 hover:text-black">
                <ArrowLeft className="h-5 w-5" />
                <span>Dashboard</span>
              </button>
              <h1 className="text-2xl font-playfair font-semibold text-black">Restaurants</h1>
            </div>
            <button onClick={handleAdd} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              <Plus className="h-4 w-4" />
              <span>Add Restaurant</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <div key={restaurant.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="relative h-48 bg-gray-200">
                {restaurant.image ? (
                  <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateRestaurant(restaurant.id, { active: !restaurant.active });
                    }}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-200 ${
                      restaurant.active 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                    title="Click to toggle availability"
                  >
                    {restaurant.active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
                  {restaurant.logo && (
                    <img src={restaurant.logo} alt="Logo" className="h-10 w-10 rounded-full object-cover" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">{restaurant.type}</p>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{restaurant.description}</p>
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <span>Delivery: {restaurant.deliveryTime}</span>
                </div>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => handleManageMenu(restaurant)}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    <Utensils className="h-4 w-4" />
                    <span>Manage Menu</span>
                  </button>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(restaurant)}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(restaurant.id)}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RestaurantManager;
