import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Package } from 'lucide-react';
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
      } catch (_error) {
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
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back</span>
                </button>
                <h1 className="text-2xl font-playfair font-semibold text-black">
                  {currentView === 'add' ? 'Add Menu Item' : 'Edit Menu Item'}
                </h1>
                <span className="text-sm text-gray-500">for {restaurantName}</span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSaveItem}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Item Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter item name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Base Price *</label>
                <input
                  type="number"
                  value={formData.basePrice || ''}
                  onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Category *</label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.popular || false}
                    onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-black">Mark as Popular</span>
                </label>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.available ?? true}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-black">Available for Order</span>
                </label>
              </div>
            </div>

            {/* Discount Pricing Section */}
            <div className="mb-8">
              <h3 className="text-lg font-playfair font-medium text-black mb-4">Discount Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Discount Price</label>
                  <input
                    type="number"
                    value={formData.discountPrice || ''}
                    onChange={(e) => setFormData({ ...formData, discountPrice: Number(e.target.value) || undefined })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter discount price"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.discountActive || false}
                      onChange={(e) => setFormData({ ...formData, discountActive: e.target.checked })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-black">Enable Discount</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Discount Start Date</label>
                  <input
                    type="datetime-local"
                    value={formData.discountStartDate || ''}
                    onChange={(e) => setFormData({ ...formData, discountStartDate: e.target.value || undefined })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Discount End Date</label>
                  <input
                    type="datetime-local"
                    value={formData.discountEndDate || ''}
                    onChange={(e) => setFormData({ ...formData, discountEndDate: e.target.value || undefined })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-black mb-2">Description *</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter item description"
                rows={3}
              />
            </div>

            <div className="mb-8">
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

            {/* Variations Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-playfair font-medium text-black">Size Variations</h3>
                <button
                  onClick={addVariation}
                  className="flex items-center space-x-2 px-3 py-2 bg-cream-100 text-black rounded-lg hover:bg-cream-200 transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Variation</span>
                </button>
              </div>

              {formData.variations?.map((variation, index) => (
                <div key={variation.id} className="flex items-center space-x-3 mb-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={variation.name}
                    onChange={(e) => updateVariation(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Variation name (e.g., Small, Medium, Large)"
                  />
                  <input
                    type="number"
                    value={variation.price}
                    onChange={(e) => updateVariation(index, 'price', Number(e.target.value))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Price"
                  />
                  <button
                    onClick={() => removeVariation(index)}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add-ons Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-playfair font-medium text-black">Add-ons</h3>
                <button
                  onClick={addAddOn}
                  className="flex items-center space-x-2 px-3 py-2 bg-cream-100 text-black rounded-lg hover:bg-cream-200 transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Add-on</span>
                </button>
              </div>

              {formData.addOns?.map((addOn, index) => (
                <div key={addOn.id} className="flex items-center space-x-3 mb-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={addOn.name}
                    onChange={(e) => updateAddOn(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Add-on name"
                  />
                  <select
                    value={addOn.category}
                    onChange={(e) => updateAddOn(index, 'category', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {addOnCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={addOn.price}
                    onChange={(e) => updateAddOn(index, 'price', Number(e.target.value))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Price"
                  />
                  <button
                    onClick={() => removeAddOn(index)}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Restaurants</span>
              </button>
              <h1 className="text-2xl font-playfair font-semibold text-black">
                Menu Items - {restaurantName}
              </h1>
            </div>
            <button
              onClick={handleAddItem}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>Add Menu Item</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {menuItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items yet</h3>
            <p className="text-gray-600 mb-4">Start by adding your first menu item</p>
            <button
              onClick={handleAddItem}
              className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>Add Menu Item</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Variations</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Add-ons</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {menuItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {categories.find(cat => cat.id === item.category)?.name}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.isOnDiscount && item.discountPrice ? (
                          <>
                            <span className="text-red-600 font-semibold">₱{item.discountPrice}</span>
                            <span className="text-gray-500 line-through text-xs ml-1">₱{item.basePrice}</span>
                          </>
                        ) : (
                          `₱${item.basePrice}`
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.variations?.length || 0} variations
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.addOns?.length || 0} add-ons
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          {item.popular && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                              Popular
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.available 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.available ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
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
            <div className="md:hidden">
              {menuItems.map((item) => (
                <div key={item.id} className="p-4 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <span className="ml-1 text-gray-900">
                        {categories.find(cat => cat.id === item.category)?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Price:</span>
                      <span className="ml-1 font-medium text-gray-900">
                        {item.isOnDiscount && item.discountPrice ? (
                          <>
                            <span className="text-red-600">₱{item.discountPrice}</span>
                            <span className="text-gray-500 line-through text-xs ml-1">₱{item.basePrice}</span>
                          </>
                        ) : (
                          `₱${item.basePrice}`
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Variations:</span>
                      <span className="ml-1 text-gray-900">{item.variations?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Add-ons:</span>
                      <span className="ml-1 text-gray-900">{item.addOns?.length || 0}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-3">
                    {item.popular && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                        Popular
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantMenuManager;

