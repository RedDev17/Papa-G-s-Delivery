import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, ArrowLeft, Coffee, TrendingUp, Package, Lock, FolderOpen, CreditCard, Settings, MapPin, Search, Filter } from 'lucide-react';
import { MenuItem, Variation, AddOn } from '../types';
import { addOnCategories } from '../data/menuData';
import { useMenu } from '../hooks/useMenu';
import { useCategories } from '../hooks/useCategories';
import { useRestaurantsAdmin } from '../hooks/useRestaurantsAdmin';
import ImageUpload from './ImageUpload';
import CategoryManager from './CategoryManager';
import PaymentMethodManager from './PaymentMethodManager';
import SiteSettingsManager from './SiteSettingsManager';
import RestaurantManager from './RestaurantManager';
import DeliveryFeeManager from './DeliveryFeeManager';
import LocationManager from './LocationManager';

const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('beracah_admin_auth') === 'true';
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const { menuItems, loading, updateMenuItem, deleteMenuItem } = useMenu();
  const { categories } = useCategories();
  const { restaurants: adminRestaurants } = useRestaurantsAdmin();
  const [currentView, setCurrentView] = useState<'dashboard' | 'items' | 'edit' | 'categories' | 'payments' | 'settings' | 'restaurants' | 'delivery-fees' | 'locations'>('dashboard');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    basePrice: 0,
    category: 'hot-coffee',
    popular: false,
    available: true,
    variations: [],
    addOns: []
  });


  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormData(item);
    setCurrentView('edit');
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      try {
        setIsProcessing(true);
        await deleteMenuItem(id);
      } catch {
        alert('Failed to delete item. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSaveItem = async () => {
    if (!formData.name || !formData.description || !formData.basePrice) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, formData);
        setCurrentView('items');
        setEditingItem(null);
      }
    } catch {
      alert('Failed to save item');
    }
  };

  const handleCancel = () => {
    setCurrentView(currentView === 'edit' ? 'items' : 'dashboard');
    setEditingItem(null);
    setSelectedItems([]);
  };

  const handleBulkRemove = async () => {
    if (selectedItems.length === 0) {
      alert('Please select items to delete');
      return;
    }

    const itemNames = selectedItems.map(id => {
      const item = menuItems.find(i => i.id === id);
      return item ? item.name : 'Unknown Item';
    }).slice(0, 5); // Show first 5 items
    
    const displayNames = itemNames.join(', ');
    const moreItems = selectedItems.length > 5 ? ` and ${selectedItems.length - 5} more items` : '';
    
    if (confirm(`Are you sure you want to delete ${selectedItems.length} item(s)?\n\nItems to delete: ${displayNames}${moreItems}\n\nThis action cannot be undone.`)) {
      try {
        setIsProcessing(true);
        // Delete items one by one
        for (const itemId of selectedItems) {
          await deleteMenuItem(itemId);
        }
        setSelectedItems([]);
        setShowBulkActions(false);
        alert(`Successfully deleted ${selectedItems.length} item(s).`);
      } catch {
        alert('Failed to delete some items. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  };
  const handleBulkCategoryChange = async (newCategoryId: string) => {
    if (selectedItems.length === 0) {
      alert('Please select items to update');
      return;
    }

    const categoryName = categories.find(cat => cat.id === newCategoryId)?.name;
    if (confirm(`Are you sure you want to change the category of ${selectedItems.length} item(s) to "${categoryName}"?`)) {
      try {
        setIsProcessing(true);
        // Update category for each selected item
        for (const itemId of selectedItems) {
          const item = menuItems.find(i => i.id === itemId);
          if (item) {
            await updateMenuItem(itemId, { ...item, category: newCategoryId });
          }
        }
        setSelectedItems([]);
        setShowBulkActions(false);
        alert(`Successfully updated category for ${selectedItems.length} item(s)`);
      } catch {
        alert('Failed to update some items');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === menuItems.length) {
      setSelectedItems([]);
      setShowBulkActions(false);
    } else {
      setSelectedItems(menuItems.map(item => item.id));
      setShowBulkActions(true);
    }
  };

  // Update bulk actions visibility when selection changes
  React.useEffect(() => {
    setShowBulkActions(selectedItems.length > 0);
  }, [selectedItems]);

  const addVariation = () => {
    const newVariation: Variation = {
      id: `var-${Date.now()}`,
      name: '',
      price: 0
    };
    setFormData({
      ...formData,
      variations: [...(formData.variations || []), newVariation]
    });
  };

  const updateVariation = (index: number, field: keyof Variation, value: string | number) => {
    const updatedVariations = [...(formData.variations || [])];
    updatedVariations[index] = { ...updatedVariations[index], [field]: value };
    setFormData({ ...formData, variations: updatedVariations });
  };

  const removeVariation = (index: number) => {
    const updatedVariations = formData.variations?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, variations: updatedVariations });
  };

  const addAddOn = () => {
    const newAddOn: AddOn = {
      id: `addon-${Date.now()}`,
      name: '',
      price: 0,
      category: 'extras'
    };
    setFormData({
      ...formData,
      addOns: [...(formData.addOns || []), newAddOn]
    });
  };

  const updateAddOn = (index: number, field: keyof AddOn, value: string | number) => {
    const updatedAddOns = [...(formData.addOns || [])];
    updatedAddOns[index] = { ...updatedAddOns[index], [field]: value };
    setFormData({ ...formData, addOns: updatedAddOns });
  };

  const removeAddOn = (index: number) => {
    const updatedAddOns = formData.addOns?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, addOns: updatedAddOns });
  };

  // Dashboard Stats
  const totalItems = menuItems.length;
  const popularItems = menuItems.filter(item => item.popular).length;
  const availableItems = menuItems.filter(item => item.available).length;
  const restaurantCount = adminRestaurants.length;
  const activeRestaurants = adminRestaurants.filter(r => r.active).length;
  const categoryCounts = categories.map(cat => ({
    ...cat,
    count: menuItems.filter(item => item.category === cat.id).length
  }));

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === (import.meta.env.VITE_ADMIN_PASSWORD || 'PapaGDelivery@Admin!2025')) {
      setIsAuthenticated(true);
      localStorage.setItem('beracah_admin_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('beracah_admin_auth');
    setPassword('');
    setCurrentView('dashboard');
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-playfair font-semibold text-black">Admin Access</h1>
            <p className="text-gray-600 mt-2">Enter password to access the admin dashboard</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Enter admin password"
                required
              />
              {loginError && (
                <p className="text-red-500 text-sm mt-2">{loginError}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Form View (Edit only - Add removed)
  if (currentView === 'edit') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 gap-4">
              <div className="flex items-center space-x-4 min-w-0">
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-800 text-white text-sm font-medium shadow hover:bg-gray-700 transition-colors duration-200 flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Dashboard</span>
                </button>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  ✏️ Edit Item
                </h1>
              </div>
              <div className="flex space-x-3 flex-shrink-0">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2 text-sm text-gray-600"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Cancel</span>
                </button>
                <button
                  onClick={handleSaveItem}
                  className="px-5 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2 text-sm font-semibold shadow-sm"
                >
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">

          {/* Section 1: Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span className="text-xl">📝</span> Basic Information
            </h2>
            <p className="text-sm text-gray-500 mb-6">Set the item's name, price, and category.</p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Item Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200"
                  placeholder="e.g., 1pc Chickenjoy"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Base Price <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-base pointer-events-none">₱</span>
                    <input
                      type="number"
                      value={formData.basePrice ?? 0}
                      onFocus={(e) => { if (Number(e.target.value) === 0) e.target.value = ''; }}
                      onBlur={(e) => { if (e.target.value === '') setFormData({ ...formData, basePrice: 0 }); }}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value === '' ? 0 : Number(e.target.value) })}
                      className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category <span className="text-red-400">*</span></label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200 appearance-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description <span className="text-red-400">*</span></label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200"
                  placeholder="Describe the item for customers..."
                  rows={3}
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 pt-2">
                <label className="inline-flex items-center gap-3 cursor-pointer select-none bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.popular || false}
                      onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-gray-300 rounded-full peer-checked:bg-delivery-primary transition-colors duration-200"></div>
                    <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform duration-200"></div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-800">⭐ Popular</span>
                    <p className="text-xs text-gray-400">Highlighted for customers</p>
                  </div>
                </label>

                <label className="inline-flex items-center gap-3 cursor-pointer select-none bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.available ?? true}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors duration-200"></div>
                    <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform duration-200"></div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-800">✅ Available</span>
                    <p className="text-xs text-gray-400">Shown on the menu</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Image */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span className="text-xl">🖼️</span> Item Image
            </h2>
            <p className="text-sm text-gray-500 mb-6">Upload a photo of this item.</p>
            <ImageUpload
              currentImage={formData.image}
              onImageChange={(imageUrl) => setFormData({ ...formData, image: imageUrl })}
            />
          </div>

          {/* Section 3: Discount Pricing */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span className="text-xl">🏷️</span> Discount Pricing
            </h2>
            <p className="text-sm text-gray-500 mb-6">Set a sale price and schedule when it's active.</p>
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Discount Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-base pointer-events-none">₱</span>
                    <input
                      type="number"
                      value={formData.discountPrice ?? 0}
                      onFocus={(e) => { if (Number(e.target.value) === 0) e.target.value = ''; }}
                      onBlur={(e) => { if (e.target.value === '') setFormData({ ...formData, discountPrice: undefined }); }}
                      onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Must be lower than the base price</p>
                </div>

                <div className="flex items-start pt-7">
                  <label className="inline-flex items-center gap-3 cursor-pointer select-none bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 hover:border-gray-300 transition-colors duration-200 w-full">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formData.discountActive || false}
                        onChange={(e) => setFormData({ ...formData, discountActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-gray-300 rounded-full peer-checked:bg-orange-500 transition-colors duration-200"></div>
                      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform duration-200"></div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-800">Enable Discount</span>
                      <p className="text-xs text-gray-400">Show sale price to customers</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date</label>
                  <input
                    type="datetime-local"
                    value={formData.discountStartDate || ''}
                    onChange={(e) => setFormData({ ...formData, discountStartDate: e.target.value || undefined })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date</label>
                  <input
                    type="datetime-local"
                    value={formData.discountEndDate || ''}
                    onChange={(e) => setFormData({ ...formData, discountEndDate: e.target.value || undefined })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200"
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700">
                  💡 <strong>Tip:</strong> Leave dates empty for an indefinite discount. The discount only shows if "Enable Discount" is turned on and the current time is within the date range.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Variations */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-xl">📐</span> {formData.variationGroupName || 'Size'} Variations
              </h2>
              <button
                onClick={addVariation}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-delivery-primary/10 text-delivery-primary rounded-lg hover:bg-delivery-primary/20 transition-colors duration-200 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">Add sizes or options customers can choose from (e.g., Small, Medium, Large).</p>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Group Label</label>
              <input
                type="text"
                value={formData.variationGroupName || ''}
                onChange={(e) => setFormData({ ...formData, variationGroupName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200"
                placeholder="e.g., Size, Flavor, Temperature (default: Size)"
              />
              <p className="text-xs text-gray-400 mt-1">
                Customers will see: "Choose {formData.variationGroupName || 'Size'}"
              </p>
            </div>

            {formData.variations && formData.variations.length > 0 ? (
              <div className="space-y-3">
                {formData.variations.map((variation, index) => (
                  <div key={variation.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <input
                      type="text"
                      value={variation.name}
                      onChange={(e) => updateVariation(index, 'name', e.target.value)}
                      className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200 text-sm"
                      placeholder="e.g., Small, Medium, Large"
                    />
                    <div className="relative flex-shrink-0">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm pointer-events-none">₱</span>
                      <input
                        type="number"
                        value={variation.price ?? 0}
                        onFocus={(e) => { if (Number(e.target.value) === 0) e.target.value = ''; }}
                        onBlur={(e) => { if (e.target.value === '') updateVariation(index, 'price', 0); }}
                        onChange={(e) => updateVariation(index, 'price', e.target.value === '' ? 0 : Number(e.target.value))}
                        className="w-24 pl-8 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200 text-sm"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariation(index)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No variations yet. Click "Add" to create one.</p>
              </div>
            )}
          </div>

          {/* Section 5: Add-ons */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-xl">➕</span> Add-ons
              </h2>
              <button
                onClick={addAddOn}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-delivery-primary/10 text-delivery-primary rounded-lg hover:bg-delivery-primary/20 transition-colors duration-200 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">Extra options customers can add (e.g., Extra Cheese, Spicy Sauce).</p>

            {formData.addOns && formData.addOns.length > 0 ? (
              <div className="space-y-3">
                {formData.addOns.map((addOn, index) => (
                  <div key={addOn.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <input
                      type="text"
                      value={addOn.name}
                      onChange={(e) => updateAddOn(index, 'name', e.target.value)}
                      className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200 text-sm"
                      placeholder="e.g., Extra Cheese"
                    />
                    <select
                      value={addOn.category}
                      onChange={(e) => updateAddOn(index, 'category', e.target.value)}
                      className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200 text-sm flex-shrink-0"
                    >
                      {addOnCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <div className="relative flex-shrink-0">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm pointer-events-none">₱</span>
                      <input
                        type="number"
                        value={addOn.price ?? 0}
                        onFocus={(e) => { if (Number(e.target.value) === 0) e.target.value = ''; }}
                        onBlur={(e) => { if (e.target.value === '') updateAddOn(index, 'price', 0); }}
                        onChange={(e) => updateAddOn(index, 'price', e.target.value === '' ? 0 : Number(e.target.value))}
                        className="w-24 pl-8 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200 text-sm"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAddOn(index)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 flex-shrink-0 self-end sm:self-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No add-ons yet. Click "Add" to create one.</p>
              </div>
            )}
          </div>

          {/* Floating Save Bar (Mobile) */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
            <button
              onClick={handleSaveItem}
              className="w-full py-3.5 bg-green-600 text-white rounded-xl font-semibold text-base shadow-sm hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Save className="h-5 w-5" />
              Save Changes
            </button>
          </div>
          {/* Bottom padding for mobile floating bar */}
          <div className="h-20 sm:hidden"></div>

        </div>
      </div>
    );
  }

  // Items List View
  if (currentView === 'items') {
    const filteredItems = menuItems.filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === '' || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 gap-4">
              <div className="flex items-center space-x-4 min-w-0">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="inline-flex items-center space-x-2 bg-gray-800 text-white px-4 py-2 rounded-full hover:bg-gray-700 shadow-sm transition-colors duration-200 flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="font-medium">Dashboard</span>
                </button>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">📋 Menu Items</h1>
              </div>
              <div className="flex items-center space-x-3 flex-shrink-0">
                {selectedItems.length > 0 && (
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                  >
                    <span>{selectedItems.length} selected</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-5">

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-gray-800/10 focus:border-gray-400 transition-all duration-200"
                  placeholder="Search items by name or description..."
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="relative flex-shrink-0">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-gray-800/10 focus:border-gray-400 transition-all duration-200 appearance-none min-w-[160px]"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Results summary */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing <span className="font-semibold text-gray-700">{filteredItems.length}</span> of{' '}
                <span className="font-semibold text-gray-700">{menuItems.length}</span> items
                {searchQuery && <span> matching "<span className="font-medium">{searchQuery}</span>"</span>}
                {filterCategory && <span> in <span className="font-medium">{categories.find(c => c.id === filterCategory)?.name}</span></span>}
              </p>
              {(searchQuery || filterCategory) && (
                <button
                  onClick={() => { setSearchQuery(''); setFilterCategory(''); }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Bulk Actions Panel */}
          {showBulkActions && selectedItems.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-blue-200 p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-0.5">⚡ Bulk Actions</h3>
                  <p className="text-sm text-gray-500">{selectedItems.length} item(s) selected</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-600">Move to:</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleBulkCategoryChange(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-sm transition-all duration-200"
                      disabled={isProcessing}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={handleBulkRemove}
                    disabled={isProcessing}
                    className="inline-flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{isProcessing ? 'Removing...' : 'Delete Selected'}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedItems([]);
                      setShowBulkActions(false);
                    }}
                    className="inline-flex items-center space-x-2 border border-gray-300 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors duration-200 text-sm"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Select All Bar */}
            {filteredItems.length > 0 && (
              <div className="bg-gray-50/70 border-b border-gray-200 px-5 py-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-gray-800 focus:ring-gray-500 h-4 w-4"
                    />
                    <span className="text-sm text-gray-600">
                      Select all <span className="font-medium">{filteredItems.length}</span> items
                    </span>
                  </label>
                  {selectedItems.length > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                        {selectedItems.length} selected
                      </span>
                      <button
                        onClick={() => setSelectedItems([])}
                        className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {filteredItems.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No items found</h3>
                <p className="text-sm text-gray-500">
                  {searchQuery || filterCategory
                    ? 'Try adjusting your search or filter.'
                    : 'No menu items have been added yet.'}
                </p>
                {(searchQuery || filterCategory) && (
                  <button
                    onClick={() => { setSearchQuery(''); setFilterCategory(''); }}
                    className="mt-4 text-sm text-gray-600 underline hover:text-gray-800 transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/70 border-b border-gray-200">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12"></th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Vars</th>
                        <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Add-ons</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredItems.map((item, idx) => (
                        <tr key={item.id} className={`group transition-colors duration-100 ${
                          selectedItems.includes(item.id)
                            ? 'bg-blue-50/60'
                            : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        } hover:bg-gray-100/60`}>
                          <td className="px-5 py-3.5">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item.id)}
                              onChange={() => handleSelectItem(item.id)}
                              className="rounded border-gray-300 text-gray-800 focus:ring-gray-500 h-4 w-4"
                            />
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                              <div className="text-xs text-gray-400 truncate max-w-[200px] mt-0.5">{item.description}</div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-medium text-gray-700">
                              {categories.find(cat => cat.id === item.category)?.name || '—'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {item.isOnDiscount && item.discountPrice ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-red-600">₱{item.discountPrice}</span>
                                <span className="text-xs text-gray-400 line-through">₱{item.basePrice}</span>
                              </div>
                            ) : (
                              <span className="text-sm font-semibold text-gray-900">₱{item.basePrice}</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="text-sm text-gray-600">{item.variations?.length || 0}</span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="text-sm text-gray-600">{item.addOns?.length || 0}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-1">
                              {item.popular && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700">
                                  ⭐ Popular
                                </span>
                              )}
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                                item.available 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-600'
                              }`}>
                                {item.available ? '✅ Available' : '❌ Unavailable'}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end space-x-1 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={() => handleEditItem(item)}
                                disabled={isProcessing}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                title="Edit item"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={isProcessing}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                title="Delete item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                  {filteredItems.map((item) => (
                    <div key={item.id} className={`p-4 ${selectedItems.includes(item.id) ? 'bg-blue-50/50' : ''}`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="rounded border-gray-300 text-gray-800 focus:ring-gray-500 h-4 w-4 mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h3>
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                            </div>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <button
                                onClick={() => handleEditItem(item)}
                                disabled={isProcessing}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={isProcessing}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-medium text-gray-600">
                              {categories.find(cat => cat.id === item.category)?.name}
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {item.isOnDiscount && item.discountPrice ? (
                                <><span className="text-red-600">₱{item.discountPrice}</span> <span className="text-gray-400 line-through text-xs font-normal">₱{item.basePrice}</span></>
                              ) : (
                                <>₱{item.basePrice}</>
                              )}
                            </span>
                            {item.popular && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700">⭐</span>
                            )}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                            }`}>
                              {item.available ? '✅' : '❌'}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                            <span>{item.variations?.length || 0} vars</span>
                            <span>{item.addOns?.length || 0} add-ons</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Categories View
  if (currentView === 'categories') {
    return <CategoryManager onBack={() => setCurrentView('dashboard')} />;
  }

  // Payment Methods View
  if (currentView === 'payments') {
    return <PaymentMethodManager onBack={() => setCurrentView('dashboard')} />;
  }

  // Site Settings View
  if (currentView === 'settings') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="flex items-center space-x-2 bg-gray-800 text-white px-4 py-2 rounded-full hover:bg-gray-700 shadow-sm transition-colors duration-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="font-medium">Dashboard</span>
                </button>
                <h1 className="text-2xl font-playfair font-semibold text-black">Site Settings</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <SiteSettingsManager />
        </div>
      </div>
    );
  }

  // Restaurants View
  if (currentView === 'restaurants') {
    return <RestaurantManager onBack={() => setCurrentView('dashboard')} />;
  }

  // Locations View
  if (currentView === 'locations') {
    return <LocationManager onBack={() => setCurrentView('dashboard')} />;
  }

  // Delivery Fees View
  if (currentView === 'delivery-fees') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="flex items-center space-x-2 bg-gray-800 text-white px-4 py-2 rounded-full hover:bg-gray-700 shadow-sm transition-colors duration-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="font-medium">Dashboard</span>
                </button>
                <h1 className="text-2xl font-playfair font-semibold text-black">Delivery Fee Settings</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <DeliveryFeeManager />
        </div>
      </div>
    );
  }


  // Dashboard View
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:h-16 gap-3 sm:gap-0">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl sm:text-2xl font-noto font-semibold text-black">Papa G's Admin</h1>
            </div>
            <div className="flex items-center space-x-3">
              <a
                href="/"
                className="flex items-center space-x-2 bg-gray-800 text-white px-4 py-2 rounded-full hover:bg-gray-700 shadow-sm transition-colors duration-200 text-sm font-medium"
              >
                <span>🌐</span>
                <span>View Website</span>
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-100 shadow-sm transition-colors duration-200 text-sm font-medium"
              >
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-600 rounded-lg">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{totalItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Available</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{availableItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Coffee className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Popular</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{popularItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Coffee className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Restaurants</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{activeRestaurants}/{restaurantCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-playfair font-medium text-black mb-4">Quick Actions</h3>
            <div className="space-y-1">
              {/* Content Management */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pt-2 pb-1">Content</p>
              <button
                onClick={() => setCurrentView('restaurants')}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <Coffee className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">Manage Restaurants</span>
              </button>
              <button
                onClick={() => setCurrentView('items')}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <Package className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">Manage Menu Items</span>
              </button>
              <button
                onClick={() => setCurrentView('categories')}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <FolderOpen className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">Manage Categories</span>
              </button>

              {/* Delivery & Locations */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pt-4 pb-1">Delivery</p>
              <button
                onClick={() => setCurrentView('locations')}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <MapPin className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">Manage Locations</span>
              </button>
              <button
                onClick={() => setCurrentView('delivery-fees')}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <TrendingUp className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">Delivery Fees</span>
              </button>

              {/* Settings */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pt-4 pb-1">Settings</p>
              <button
                onClick={() => setCurrentView('payments')}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <CreditCard className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">Payment Methods</span>
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <Settings className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">Site Settings</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-playfair font-medium text-black mb-4">Categories Overview</h3>
            <div className="space-y-3">
              {categoryCounts.map((category) => (
                <div key={category.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{category.icon}</span>
                    <span className="font-medium text-gray-900">{category.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{category.count} items</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;