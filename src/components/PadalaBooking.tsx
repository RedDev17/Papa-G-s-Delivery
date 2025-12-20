import React, { useState } from 'react';
import { ArrowLeft, MapPin, X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import Header from './Header';
import LocationPicker from './LocationPicker';

interface PadalaBookingProps {
  onBack: () => void;
  title?: string;
  mode?: 'simple' | 'full';
}

interface PabiliItem {
  name: string;
  qty: string;
}

const PadalaBooking: React.FC<PadalaBookingProps> = ({ onBack, title = 'Padala', mode = 'full' }) => {
  const { calculateDistanceBetweenAddresses, calculateDeliveryFee } = useGoogleMaps();
  const [formData, setFormData] = useState({
    customer_name: '',
    contact_number: '',
    receiver_name: '',
    receiver_contact: '',
    pickup_address: '',
    delivery_address: '',
    item_description: '',
    item_weight: '',
    item_value: '',
    special_instructions: '',
    preferred_date: '',
    preferred_time: 'Morning',
    notes: '',
    store_name: '' // New field for Pabili
  });
  
  // State for Pabili items list
  const [pabiliItems, setPabiliItems] = useState<PabiliItem[]>([{ name: '', qty: '' }]);

  const [distance, setDistance] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(60);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [activeAddressField, setActiveAddressField] = useState<'pickup' | 'delivery' | null>(null);

  const handleOpenMap = (field: 'pickup' | 'delivery') => {
    setActiveAddressField(field);
    setShowMapModal(true);
  };

  const handleLocationSelect = (address: string, lat: number, lng: number) => {
    if (activeAddressField) {
      const fieldName = activeAddressField === 'pickup' ? 'pickup_address' : 'delivery_address';
      setFormData(prev => ({ ...prev, [fieldName]: address }));
      
      // If we're setting delivery address, trigger fee calculation
      if (activeAddressField === 'delivery') {
        // We need to wait for state update or pass values directly
        // For simplicity, we'll just let the user blur or we can trigger it manually if we had the other address
      }
    }
    setShowMapModal(false);
    setActiveAddressField(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Pabili Item Handlers
  const handlePabiliItemChange = (index: number, field: keyof PabiliItem, value: string) => {
    const newItems = [...pabiliItems];
    newItems[index][field] = value;
    setPabiliItems(newItems);
  };

  const addPabiliItem = () => {
    setPabiliItems([...pabiliItems, { name: '', qty: '' }]);
  };

  const removePabiliItem = (index: number) => {
    if (pabiliItems.length > 1) {
      const newItems = [...pabiliItems];
      newItems.splice(index, 1);
      setPabiliItems(newItems);
    }
  };

  const calculateFee = async () => {
    if ((title !== 'Pabili' && !formData.pickup_address.trim()) || !formData.delivery_address.trim()) {
      return;
    }

    // For Pabili, we use the pickup address (Store Location) if provided
    const pickup = formData.pickup_address || 'Tagbilaran City';

    setIsCalculating(true);
    try {
      // Calculate distance from pickup to delivery (not from delivery center)
      const result = await calculateDistanceBetweenAddresses(
        pickup,
        formData.delivery_address
      );

      if (result && !isNaN(result.distance)) {
        setDistance(result.distance);
        const fee = calculateDeliveryFee(result.distance);
        setDeliveryFee(fee);
      } else {
        setDistance(null);
        setDeliveryFee(60);
      }
    } catch (error) {
      console.error('Error calculating fee:', error);
      setDistance(null);
      setDeliveryFee(60);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate Pabili items if applicable
    let finalItemDescription = formData.item_description;
    if (title === 'Pabili') {
      const validItems = pabiliItems.filter(item => item.name.trim() !== '');
      if (validItems.length === 0) {
        alert('Please add at least one item');
        return;
      }
      // Format items into description string
      finalItemDescription = validItems.map(item => `${item.name} (Qty: ${item.qty})`).join('\n');
    }

    if (
      !formData.customer_name ||
      !formData.contact_number ||
      (title === 'Pabili' && !formData.store_name) ||
      !formData.pickup_address || // Required for both now (Store Location for Pabili)
      !formData.delivery_address ||
      (title !== 'Pabili' && !formData.item_description)
    ) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('padala_bookings')
        .insert({
          customer_name: formData.customer_name,
          contact_number: formData.contact_number,
          receiver_name: formData.receiver_name || null,
          receiver_contact: formData.receiver_contact || null,
          pickup_address: formData.pickup_address, // Now used for Store Location in Pabili
          delivery_address: formData.delivery_address,
          item_description: finalItemDescription || null,
          item_weight: mode === 'full' && formData.item_weight ? formData.item_weight : null,
          item_value: mode === 'full' && formData.item_value ? parseFloat(formData.item_value) : null,
          special_instructions: formData.special_instructions || null,
          preferred_date: mode === 'full' && formData.preferred_date ? formData.preferred_date : null,
          preferred_time: mode === 'full' ? formData.preferred_time : null,
          delivery_fee: deliveryFee || null,
          distance_km: distance || null,
          notes: title === 'Pabili' ? `Store: ${formData.store_name}\n${formData.notes}` : (mode === 'full' && formData.notes ? formData.notes : null),
          status: 'pending'
        });

      if (error) throw error;

      // Create Messenger message
      const headingEmoji = title === 'Pabili' ? '🛒' : '📦';
      const serviceLabel = title === 'Pabili' ? 'Pabili' : 'Padala';
      
      let message = '';
      
      if (title === 'Pabili') {
        // Pabili Format
        message = `${headingEmoji} ${serviceLabel}

 👤 Customer: ${formData.customer_name}
 📞 Phone: ${formData.contact_number}

 👤 Receiver: ${formData.receiver_name || 'N/A'}
 📞 Phone: ${formData.receiver_contact || 'N/A'}
 📍 Map Location (Delivery):
 ${formData.delivery_address}

 🏪 Store Name: ${formData.store_name}
 📍 Map Location (Store):
 ${formData.pickup_address}

 📦 Items:
${pabiliItems.filter(i => i.name).map(i => `${i.name.padEnd(20, '.')} ${i.qty}`).join('\n')}

${distance ? `📏 Distance: ${distance} km` : ''}
💰 Delivery Fee: ₱${deliveryFee.toFixed(2)}

${formData.special_instructions ? `📝 Special Instructions: ${formData.special_instructions}` : ''}

Please confirm this ${serviceLabel} booking. Thank you! 🛵`;

      } else {
        // Standard Padala Format
        message = `${headingEmoji} ${serviceLabel}

 👤 Sender: ${formData.customer_name}
 📞 Contact: ${formData.contact_number}

 👤 Receiver: ${formData.receiver_name || 'N/A'}
 📞 Contact: ${formData.receiver_contact || 'N/A'}

 📍 Pickup Address:
 ${formData.pickup_address}

 📍 Delivery Address:
 ${formData.delivery_address}

${formData.item_description ? `📦 Item Details:\n${formData.item_description}\n` : ''}${
        mode === 'full' && formData.item_weight ? `Weight: ${formData.item_weight}\n` : ''
      }${
        mode === 'full' && formData.item_value ? `Declared Value: ₱${formData.item_value}\n` : ''
      }
${mode === 'full' ? `📅 Preferred Date: ${formData.preferred_date || 'Any'}\n⏰ Preferred Time: ${formData.preferred_time}\n` : ''}
${distance ? `📏 Distance: ${distance} km` : ''}
💰 Delivery Fee: ₱${deliveryFee.toFixed(2)}

${formData.special_instructions ? `📝 Special Instructions: ${formData.special_instructions}` : ''}${
        mode === 'full' && formData.notes ? `\n📝 Notes: ${formData.notes}` : ''
      }

Please confirm this ${serviceLabel} booking. Thank you! 🛵`;
      }

      const encodedMessage = encodeURIComponent(message);
      const messengerUrl = `https://m.me/856261030909952?text=${encodedMessage}`;
      
      window.open(messengerUrl, '_blank');
      
      // Reset form
      setFormData({
        customer_name: '',
        contact_number: '',
        receiver_name: '',
        receiver_contact: '',
        pickup_address: '',
        delivery_address: '',
        item_description: '',
        item_weight: '',
        item_value: '',
        special_instructions: '',
        preferred_date: '',
        preferred_time: 'Morning',
        notes: '',
        store_name: ''
      });
      setPabiliItems([{ name: '', qty: '' }]);
      setDistance(null);
      setDeliveryFee(60);
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-offwhite font-inter">
      <Header 
        cartItemsCount={0}
        onCartClick={() => {}}
        onMenuClick={onBack}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to Services button - positioned on the left */}
        <div className="relative mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-delivery-primary text-white text-sm sm:text-base font-medium shadow hover:bg-delivery-dark transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Services</span>
          </button>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-black flex items-center gap-2">
            {title !== 'Pabili' && (
              <span className="text-2xl sm:text-3xl">
                📦
              </span>
            )}
            {title}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 md:p-8 space-y-6">
          {/* Customer Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {title === 'Pabili' ? 'Customer Information' : 'Sender Information'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {title === 'Pabili' ? 'Name of Customer *' : 'Sender Name *'}
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {title === 'Pabili' ? 'Phone No. *' : 'Sender Contact No. *'}
                </label>
                <input
                  type="tel"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Receiver Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Receiver Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {title === 'Pabili' ? 'Name of Receiver' : 'Receiver Name'}
                </label>
                <input
                  type="text"
                  name="receiver_name"
                  value={formData.receiver_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {title === 'Pabili' ? 'Phone No.' : 'Receiver Contact No.'}
                </label>
                <input
                  type="tel"
                  name="receiver_contact"
                  value={formData.receiver_contact}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Addresses
            </h2>
            <div className="space-y-4">
              {/* Delivery Address (Map Location for Receiver) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {title === 'Pabili' ? 'Map Location (Receiver) *' : 'Delivery Address *'}
                </label>
                <div className="relative">
                  <textarea
                    name="delivery_address"
                    value={formData.delivery_address}
                    onChange={handleInputChange}
                    onBlur={calculateFee}
                    required
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent pr-10"
                    placeholder="Enter complete address or pin location on map"
                  />
                  <button
                    type="button"
                    onClick={() => handleOpenMap('delivery')}
                    className="absolute right-2 top-2 text-gray-400 hover:text-delivery-primary p-1"
                    title="Pin on Map"
                  >
                    <MapPin className="h-5 w-5" />
                  </button>
                </div>
                {isCalculating && (
                  <p className="text-xs text-gray-500 mt-1">Calculating distance...</p>
                )}
              </div>

              {/* Store Info for Pabili */}
              {title === 'Pabili' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Store Name *</label>
                    <input
                      type="text"
                      name="store_name"
                      value={formData.store_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent"
                      placeholder="e.g., 7-Eleven, Jollibee"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Map Location (Store) *</label>
                    <div className="relative">
                      <textarea
                        name="pickup_address"
                        value={formData.pickup_address}
                        onChange={handleInputChange}
                        onBlur={calculateFee}
                        required
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent pr-10"
                        placeholder="Enter store address or pin location on map"
                      />
                      <button
                        type="button"
                        onClick={() => handleOpenMap('pickup')}
                        className="absolute right-2 top-2 text-gray-400 hover:text-delivery-primary p-1"
                        title="Pin on Map"
                      >
                        <MapPin className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Standard Pickup Address for Padala */}
              {title !== 'Pabili' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Address *</label>
                  <div className="relative">
                    <textarea
                      name="pickup_address"
                      value={formData.pickup_address}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent pr-10"
                      placeholder="Enter complete pickup address"
                    />
                    <button
                      type="button"
                      onClick={() => handleOpenMap('pickup')}
                      className="absolute right-2 top-2 text-gray-400 hover:text-delivery-primary p-1"
                      title="Pin on Map"
                    >
                      <MapPin className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Item Details */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Item Details</h2>
            <div className="space-y-4">
              {title === 'Pabili' ? (
                // Pabili Item List
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700">
                    <div className="col-span-8">Item</div>
                    <div className="col-span-3">Qty</div>
                    <div className="col-span-1"></div>
                  </div>
                  {pabiliItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-8">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handlePabiliItemChange(index, 'name', e.target.value)}
                          placeholder="Item name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={item.qty}
                          onChange={(e) => handlePabiliItemChange(index, 'qty', e.target.value)}
                          placeholder="Qty"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {pabiliItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePabiliItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addPabiliItem}
                    className="flex items-center text-delivery-primary font-medium hover:text-delivery-dark mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </button>
                </div>
              ) : (
                // Standard Padala Item Description
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Item Description *</label>
                    <textarea
                      name="item_description"
                      value={formData.item_description}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent"
                      placeholder="Describe what you are sending"
                    />
                  </div>
                  {mode === 'full' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Item Weight (optional)</label>
                        <input
                          type="text"
                          name="item_weight"
                          value={formData.item_weight}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent"
                          placeholder="e.g., 1kg, 2kg, light"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Item Value (optional)</label>
                        <input
                          type="number"
                          name="item_value"
                          value={formData.item_value}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent"
                          placeholder="₱0.00"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Preferred Schedule (full mode only) */}
          {mode === 'full' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>📅</span>
                Preferred Schedule
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label>
                  <input
                    type="date"
                    name="preferred_date"
                    value={formData.preferred_date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
                  <select
                    name="preferred_time"
                    value={formData.preferred_time}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Any">Any</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions (optional)</label>
            <textarea
              name="special_instructions"
              value={formData.special_instructions}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-primary focus:border-transparent"
              placeholder="Any special instructions for delivery"
            />
          </div>

          {/* Delivery Fee Display */}
          {distance !== null && deliveryFee > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Estimated Distance</p>
                  <p className="text-lg font-semibold text-gray-900">{distance} km</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Delivery Fee</p>
                  <p className="text-2xl font-bold text-delivery-primary">₱{deliveryFee.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform bg-delivery-primary text-white hover:bg-delivery-dark hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? 'Submitting...'
              : mode === 'simple'
                ? 'Submit'
                : 'Submit Booking Request'}
          </button>
        </form>
      </div>

      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Pin {activeAddressField === 'pickup' ? 'Store' : 'Delivery'} Location
              </h3>
              <button
                onClick={() => setShowMapModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <LocationPicker onLocationSelect={handleLocationSelect} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PadalaBooking;

