import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Package, Search, Filter } from 'lucide-react';
import { RestaurantMenuItem, Variation, AddOn } from '../types';
import { useRestaurantMenuAdmin } from '../hooks/useRestaurantMenuAdmin';
import { useCategories } from '../hooks/useCategories';
import { addOnCategories } from '../data/menuData';
import ImageUpload from './ImageUpload';

interface RestaurantMenuManagerProps {
  restaurantId: string;
  restaurantName: string;
  onBack: () => void;
}

const RestaurantMenuManager: React.FC<RestaurantMenuManagerProps> = ({
  restaurantId,
  restaurantName,
  onBack
}) => {
  const { menuItems, loading, addMenuItem, updateMenuItem, deleteMenuItem } = useRestaurantMenuAdmin(restaurantId);
  const { categories } = useCategories();
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingItem, setEditingItem] = useState<RestaurantMenuItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [formData, setFormData] = useState<Partial<RestaurantMenuItem>>({
    name: '',
    description: '',
    basePrice: 0,
    category: '',
    popular: false,
    available: true,
    variations: [],
    addOns: []
  });

  // Update category when categories load
  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: categories[0].id }));
    }
  }, [categories, formData.category]);

  const handleAddItem = () => {
    if (categories.length === 0) {
      alert('Please wait for categories to load, or create a category first.');
      return;
    }
    
    setCurrentView('add');
    const defaultCategory = categories[0].id;
    setFormData({
      name: '',
      description: '',
      basePrice: 0,
      category: defaultCategory,
      popular: false,
      available: true,
      image: undefined,
      variations: [],
      addOns: []
    });
    setEditingItem(null);
  };

  const handleEditItem = (item: RestaurantMenuItem) => {
    setEditingItem(item);
    setFormData(item);
    setCurrentView('edit');
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      try {
        await deleteMenuItem(id);
      } catch {
        alert('Failed to delete item. Please try again.');
      }
    }
  };

  const handleSaveItem = async () => {
    if (!formData.name || !formData.description || !formData.basePrice || !formData.category) {
      alert('Please fill in all required fields (Name, Description, Base Price, and Category)');
      return;
    }

    // Validate base price
    if (formData.basePrice <= 0) {
      alert('Base price must be greater than 0');
      return;
    }

    setIsSaving(true);

    try {
      // Validate variations - remove empty ones
      const validVariations = formData.variations?.filter(v => v.name && v.name.trim() !== '') || [];
      
      // Validate add-ons - remove empty ones
      const validAddOns = formData.addOns?.filter(a => a.name && a.name.trim() !== '') || [];

      // Prepare clean form data
      const cleanFormData = {
        ...formData,
        image: formData.image && formData.image.trim() !== '' ? formData.image : undefined,
        variations: validVariations.length > 0 ? validVariations : undefined,
        addOns: validAddOns.length > 0 ? validAddOns : undefined,
        discountPrice: formData.discountPrice && formData.discountPrice > 0 ? formData.discountPrice : undefined,
        discountStartDate: formData.discountStartDate && formData.discountStartDate.trim() !== '' ? formData.discountStartDate : undefined,
        discountEndDate: formData.discountEndDate && formData.discountEndDate.trim() !== '' ? formData.discountEndDate : undefined,
      };

      if (editingItem) {
        await updateMenuItem(editingItem.id, cleanFormData);
      } else {
        await addMenuItem(cleanFormData as Omit<RestaurantMenuItem, 'id' | 'restaurant_id'>, restaurantId);
      }
      
      setCurrentView('list');
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving menu item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save item';
      alert(`Failed to save item: ${errorMessage}\n\nPlease check:\n- All required fields are filled\n- Image URL is valid (if provided)\n- Category exists in the system\n- Database connection is working`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCurrentView('list');
    setEditingItem(null);
  };

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

  if (loading && menuItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu items...</p>
        </div>
      </div>
    );
  }

  // Form View (Add/Edit)
  if (currentView === 'add' || currentView === 'edit') {
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
                  <span>Menu</span>
                </button>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {currentView === 'add' ? '➕ Add Item' : '✏️ Edit Item'}
                  </h1>
                  <p className="text-xs text-gray-500 truncate">for {restaurantName}</p>
                </div>
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
                  disabled={isSaving}
                  className="px-5 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2 text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save</span>
                    </>
                  )}
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
              onImageChange={(imageUrl) => {
                setFormData({ 
                  ...formData, 
                  image: imageUrl && imageUrl.trim() !== '' ? imageUrl : undefined 
                });
              }}
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
              disabled={isSaving}
              className="w-full py-3.5 bg-green-600 text-white rounded-xl font-semibold text-base shadow-sm hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
          {/* Bottom padding for mobile floating bar */}
          <div className="h-20 sm:hidden"></div>

        </div>
      </div>
    );
  }
  // List View
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
                onClick={onBack}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-800 text-white text-sm font-medium shadow hover:bg-gray-700 transition-colors duration-200 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Restaurants</span>
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                📋 Menu Items — {restaurantName}
              </h1>
            </div>
            <button
              onClick={handleAddItem}
              className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors duration-200 text-sm font-semibold shadow-sm flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add Item</span>
            </button>
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

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 px-4">
              {menuItems.length === 0 ? (
                <>
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No menu items yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Start by adding your first menu item</p>
                  <button
                    onClick={handleAddItem}
                    className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors duration-200 text-sm font-semibold"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Menu Item</span>
                  </button>
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No items found</h3>
                  <p className="text-sm text-gray-500">Try adjusting your search or filter.</p>
                  <button
                    onClick={() => { setSearchQuery(''); setFilterCategory(''); }}
                    className="mt-4 text-sm text-gray-600 underline hover:text-gray-800 transition-colors"
                  >
                    Clear all filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-200">
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
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      } hover:bg-gray-100/60`}>
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
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              title="Edit item"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
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
                  <div key={item.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h3>
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
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
};

export default RestaurantMenuManager;

