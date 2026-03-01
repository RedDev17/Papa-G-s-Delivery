import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Grocery } from '../types';
import ImageUpload from './ImageUpload';
import { useCategories } from '../hooks/useCategories';

interface GroceryManagerProps {
  onBack: () => void;
}

const GroceryManager: React.FC<GroceryManagerProps> = ({ onBack }) => {
  const { categories } = useCategories();
  const [groceries, setGroceries] = useState<Grocery[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingGrocery, setEditingGrocery] = useState<Grocery | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    unit: 'piece',
    available: true,
    popular: false,
    sort_order: '0'
  });

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !formData.category && currentView === 'add') {
      setFormData(prev => ({ ...prev, category: categories[0].id }));
    }
  }, [categories, currentView, formData.category]);

  useEffect(() => {
    fetchGroceries();
  }, []);

  const fetchGroceries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('groceries')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      if (data) setGroceries(data);
    } catch (error) {
      console.error('Error fetching groceries:', error);
      alert('Failed to load groceries');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.price || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      return;
    }

    try {
      const groceryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: price,
        category: formData.category.trim(),
        image_url: formData.image_url?.trim() || null,
        unit: formData.unit,
        available: formData.available,
        popular: formData.popular,
        sort_order: parseInt(formData.sort_order) || 0
      };

      if (editingGrocery) {
        const { error } = await supabase
          .from('groceries')
          .update(groceryData)
          .eq('id', editingGrocery.id);
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('groceries')
          .insert(groceryData);
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
      }

      await fetchGroceries();
      setCurrentView('list');
      setEditingGrocery(null);
      resetForm();
    } catch (error) {
      console.error('Error saving grocery:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save grocery. Please check your database connection and try again.';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this grocery item?')) return;

    try {
      const { error } = await supabase
        .from('groceries')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchGroceries();
    } catch (error) {
      console.error('Error deleting grocery:', error);
      alert('Failed to delete grocery');
    }
  };

  const handleEdit = (grocery: Grocery) => {
    setEditingGrocery(grocery);
    setFormData({
      name: grocery.name,
      description: grocery.description,
      price: grocery.price.toString(),
      category: grocery.category,
      image_url: grocery.image_url || '',
      unit: grocery.unit,
      available: grocery.available,
      popular: grocery.popular,
      sort_order: grocery.sort_order.toString()
    });
    setCurrentView('edit');
  };

  const resetForm = () => {
    const defaultCategory = categories.length > 0 ? categories[0].id : '';
    setFormData({
      name: '',
      description: '',
      price: '',
      category: defaultCategory,
      image_url: '',
      unit: 'piece',
      available: true,
      popular: false,
      sort_order: '0'
    });
  };

  const handleImageChange = (imageUrl: string | undefined) => {
    setFormData({ ...formData, image_url: imageUrl || '' });
  };

  if (currentView === 'add' || currentView === 'edit') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{currentView === 'add' ? 'Add Grocery' : 'Edit Grocery'}</h2>
            <button onClick={() => { setCurrentView('list'); setEditingGrocery(null); resetForm(); }} className="text-gray-600 hover:text-black">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Unit *</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="piece">Piece</option>
                  <option value="kg">Kilogram</option>
                  <option value="pack">Pack</option>
                  <option value="bottle">Bottle</option>
                  <option value="box">Box</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-primary focus:border-transparent"
                required
              >
                {categories.length === 0 ? (
                  <option value="">Loading categories...</option>
                ) : (
                  categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))
                )}
              </select>
              {categories.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  No categories found. Please create categories first in the Categories section.
                </p>
              )}
            </div>
            <div>
              <ImageUpload
                currentImage={formData.image_url || undefined}
                onImageChange={handleImageChange}
                label="Grocery Image"
              />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="mr-2"
                />
                Available
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.popular}
                  onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                  className="mr-2"
                />
                Popular
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Sort Order</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                className="flex-1 bg-green-primary text-white py-3 rounded-lg hover:bg-green-dark"
              >
                Save
              </button>
              <button
                onClick={() => { setCurrentView('list'); setEditingGrocery(null); resetForm(); }}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-600 hover:text-black">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold">Grocery Management</h1>
        </div>
        <button
          onClick={() => { setCurrentView('add'); resetForm(); }}
          className="bg-green-primary text-white px-6 py-3 rounded-lg hover:bg-green-dark flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Grocery
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {groceries.map(grocery => (
                <tr key={grocery.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{grocery.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{grocery.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₱{grocery.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{grocery.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded ${grocery.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {grocery.available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                    <button onClick={() => handleEdit(grocery)} className="text-blue-600 hover:text-blue-800">
                      <Edit className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(grocery.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GroceryManager;

