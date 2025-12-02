import React, { useState } from 'react';
import { ArrowLeft, MapPin, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import Header from './Header';
import LocationPicker from './LocationPicker';

interface PadalaBookingProps {
  onBack: () => void;
  title?: string;
  mode?: 'simple' | 'full';
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
    notes: ''
  });
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

  const calculateFee = async () => {
    if ((title !== 'E-Run' && !formData.pickup_address.trim()) || !formData.delivery_address.trim()) {
      return;
    }

    // For E-Run, use a default pickup location or current location if available
    // For now we'll just use the delivery address for distance calculation if pickup is empty (which it will be for E-Run)
    const pickup = title === 'E-Run' ? 'Tagbilaran City' : formData.pickup_address;

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

    if (
      !formData.customer_name ||
      !formData.contact_number ||
      (title !== 'E-Run' && !formData.pickup_address) ||
      !formData.delivery_address ||
      !formData.item_description
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
          pickup_address: title === 'E-Run' ? 'E-ran Service' : formData.pickup_address,
          delivery_address: formData.delivery_address,
          item_description: formData.item_description || null,
          item_weight: mode === 'full' && formData.item_weight ? formData.item_weight : null,
          item_value: mode === 'full' && formData.item_value ? parseFloat(formData.item_value) : null,
          special_instructions: formData.special_instructions || null,
          preferred_date: mode === 'full' && formData.preferred_date ? formData.preferred_date : null,
          preferred_time: mode === 'full' ? formData.preferred_time : null,
          delivery_fee: deliveryFee || null,
          distance_km: distance || null,
          notes: mode === 'full' && formData.notes ? formData.notes : null,
          status: 'pending'
        });

      if (error) throw error;

      // Create Messenger message
      const headingEmoji = title === 'E-Run' ? '🛒' : '📦';
      const serviceLabel = title === 'E-Run' ? 'E-Run' : 'Padala';
      const message = `${headingEmoji} ${serviceLabel}

 👤 Sender: ${formData.customer_name}
 📞 Contact: ${formData.contact_number}

 👤 Receiver: ${formData.receiver_name || 'N/A'}
 📞 Contact: ${formData.receiver_contact || 'N/A'}

${title !== 'E-Run' ? `📍 Pickup Address:
${formData.pickup_address}
` : ''}
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

      const encodedMessage = encodeURIComponent(message);
      const messengerUrl = `https://m.me/375641885639863?text=${encodedMessage}`;
      
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
        notes: ''
      });
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
            {title !== 'E-Run' && (
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sender Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sender Name *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Sender Contact No. *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Receiver Name</label>
                <input
                  type="text"
                  name="receiver_name"
                  value={formData.receiver_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Receiver Contact No.</label>
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
              {title !== 'E-Run' && (
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address *</label>
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
            </div>
          </div>

          {/* Item Details */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Item Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Description *</label>
                <textarea
                  name="item_description"
                  value={formData.item_description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent"
                  placeholder={mode === 'simple' ? 'What should we buy for you?' : 'Describe what you are sending'}
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
                Pin {activeAddressField === 'pickup' ? 'Pickup' : 'Delivery'} Location
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

