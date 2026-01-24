import React, { useState } from 'react';
import { ArrowLeft, MapPin, Plus, Trash2, Navigation, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import AddressAutocomplete from './AddressAutocomplete';
import Header from './Header';

import DeliveryMap from './DeliveryMap';

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
  const { calculateDistanceBetweenAddresses, calculateDeliveryFee, restaurantLocation } = useGoogleMaps();
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

  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);



  const [distance, setDistance] = useState<number | null>(null);
  const [hubDistance, setHubDistance] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [debouncedPickupAddress, setDebouncedPickupAddress] = useState('');
  const [debouncedDeliveryAddress, setDebouncedDeliveryAddress] = useState('');

  // Debounce address changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPickupAddress(formData.pickup_address);
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData.pickup_address]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDeliveryAddress(formData.delivery_address);
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData.delivery_address]);

  // Trigger calculation when debounced addresses change
  React.useEffect(() => {
    if (debouncedPickupAddress || debouncedDeliveryAddress) {
      calculateFee();
    }
  }, [debouncedPickupAddress, debouncedDeliveryAddress]);







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
    if (!formData.delivery_address.trim()) {
      return;
    }

    // For Pabili, we use the pickup address (Store Location) if provided
    // For Padala, we use the pickup address
    const pickup = formData.pickup_address || (restaurantLocation?.address || 'Floridablanca, Pampanga');



    try {
      // We only charge for the distance between Pickup/Store and Customer
      // The Hub -> Pickup distance is internal logistics and shouldn't be charged to the customer
      
      // Calculate Pickup/Store -> Customer Delivery
      const result = await calculateDistanceBetweenAddresses(pickup, formData.delivery_address);
      
      // Calculate Hub -> Pickup (for informational purposes)
      if (restaurantLocation && formData.pickup_address.trim()) {
        const hubResult = await calculateDistanceBetweenAddresses(restaurantLocation.address, pickup);
        if (hubResult) setHubDistance(hubResult.distance);
      } else {
        setHubDistance(null);
      }

      if (result && !isNaN(result.distance)) {
        setDistance(result.distance);

        // Calculate fee using service-specific settings
        const serviceType = title === 'Pabili' ? 'pabili' : 'padala';
        const fee = calculateDeliveryFee(result.distance, serviceType);
        setDeliveryFee(fee);

        // Update map coordinates if available
        // Only show pin if the address input is not empty
        if (result.pickupCoordinates && formData.pickup_address.trim()) {
            setPickupCoords(result.pickupCoordinates);
        } else if (!formData.pickup_address.trim()) {
            // Clear pin if input is empty
            setPickupCoords(null);
        }

        if (result.dropoffCoordinates && formData.delivery_address.trim()) {
            setDeliveryCoords(result.dropoffCoordinates);
        } else if (!formData.delivery_address.trim()) {
             // Clear pin if input is empty
            setDeliveryCoords(null);
        }

      } else {
        // Use service-specific settings for fallback fee
        const serviceType = title === 'Pabili' ? 'pabili' : 'padala';
        setDeliveryFee(calculateDeliveryFee(null, serviceType));
        // Do not clear coords here, as we might keep old valid coords if calculation fails momentarily
        // or we could clear them if that's safer. Let's rely on the input check above.
      }
    } catch (error) {
      console.error('Error calculating fee:', error);
      setDistance(null);
      setDeliveryFee(60);
    } finally {
      // setIsCalculating(false);
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
      (title !== 'Pabili' && !formData.pickup_address) || // Only required for Padala
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
          pickup_address: formData.pickup_address || formData.store_name, // Fallback to Store Name if map location not provided
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
        message = `${headingEmoji} ${serviceLabel} ORDER

👤 Customer: ${formData.customer_name}
📞 Phone: ${formData.contact_number}

👤 Receiver: ${formData.receiver_name || 'N/A'}
📞 Phone: ${formData.receiver_contact || 'N/A'}

🏪 Store: ${formData.store_name}
📍 Store Location:
${formData.pickup_address}

📍 Delivery Location:
${formData.delivery_address}

📦 ITEMS TO BUY:
${pabiliItems.filter(i => i.name).map(i => `• ${i.name} (Qty: ${i.qty})`).join('\n')}

💰 TOTAL: ₱${deliveryFee.toFixed(2)} (Delivery Fee)
${distance ? `📏 Distance: ${distance} km` : ''}

${formData.special_instructions ? `📝 Instructions: ${formData.special_instructions}` : ''}

Please confirm this Pabili request. Thank you! 🛵`;

      } else {
        // Standard Padala Format
        message = `${headingEmoji} ${serviceLabel} REQUEST

👤 Sender: ${formData.customer_name}
📞 Contact: ${formData.contact_number}

👤 Receiver: ${formData.receiver_name || 'N/A'}
📞 Contact: ${formData.receiver_contact || 'N/A'}

📍 PICKUP FROM:
${formData.pickup_address}

📍 DELIVER TO:
${formData.delivery_address}

📦 ITEM DETAILS:
${formData.item_description}
${mode === 'full' && formData.item_weight ? `Weight: ${formData.item_weight}\n` : ''}${mode === 'full' && formData.item_value ? `Value: ₱${formData.item_value}\n` : ''}
${mode === 'full' ? `📅 Date: ${formData.preferred_date || 'Any'}\n⏰ Time: ${formData.preferred_time}\n` : ''}
💰 TOTAL: ₱${deliveryFee.toFixed(2)} (Delivery Fee)
${distance ? `📏 Distance: ${distance} km` : ''}

${formData.special_instructions ? `📝 Instructions: ${formData.special_instructions}` : ''}${mode === 'full' && formData.notes ? `\n📝 Notes: ${formData.notes}` : ''}

Please confirm this Padala request. Thank you! 🛵`;
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
      // Use service-specific base fee when resetting
      const serviceType = title === 'Pabili' ? 'pabili' : 'padala';
      setDeliveryFee(calculateDeliveryFee(null, serviceType));
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
              <Package className="h-7 w-7 sm:h-8 sm:w-8 text-delivery-primary" />
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
              <div className="relative">
                <AddressAutocomplete
                  label={title === 'Pabili' ? 'Map Location (Receiver) *' : 'Delivery Address *'}
                  value={formData.delivery_address}
                  onChange={(value) => setFormData(prev => ({ ...prev, delivery_address: value }))}
                  onSelect={(address, lat, lng) => {
                    setFormData(prev => ({ ...prev, delivery_address: address }));
                    setDeliveryCoords({ lat, lng });
                  }}
                  required
                  placeholder="Enter complete address or pin location on map"
                />

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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Map Location (Store)</label>
                  <div className="relative">
                    <AddressAutocomplete
                        value={formData.pickup_address}
                        onChange={(value) => setFormData(prev => ({ ...prev, pickup_address: value }))}
                        onSelect={(address, lat, lng) => {
                            setFormData(prev => ({ ...prev, pickup_address: address }));
                            setPickupCoords({ lat, lng });
                        }}
                        placeholder="Enter store address or pin location on map (optional)"
                    />

                  </div>
                  </div>
                </>
              )}

              {/* Standard Pickup Address for Padala */}
              {title !== 'Pabili' && (
                <div className="relative">
                  <AddressAutocomplete
                    label="Pickup Address *"
                    value={formData.pickup_address}
                    onChange={(value) => setFormData(prev => ({ ...prev, pickup_address: value }))}
                    onSelect={(address, lat, lng) => {
                        setFormData(prev => ({ ...prev, pickup_address: address }));
                        setPickupCoords({ lat, lng });
                    }}
                    required
                    placeholder="Enter complete pickup address"
                  />

                </div>
              )}

              {/* Delivery Map Visualization */}
              {(pickupCoords || deliveryCoords || restaurantLocation) && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Route Preview</label>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <DeliveryMap
                      hubLocation={restaurantLocation} // Delivery Center
                      restaurantLocation={pickupCoords} // Pickup Location (User selected)
                      customerLocation={deliveryCoords || null} // Receiver Location
                      distance={distance}
                      address={formData.delivery_address}
                      restaurantName={title === 'Pabili' ? 'Store Location' : 'Pickup Location'}
                      restaurantAddress={formData.pickup_address}
                      markerType={title === 'Pabili' ? 'store' : 'package'}
                    />
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
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-medium text-gray-900">Delivery Summary</h3>
            
            {/* Distance Row */}
            {hubDistance !== null && (
              <>
                <div className="flex items-start justify-between text-sm text-gray-500">
                   <span className="flex items-start gap-2">
                      <Navigation className="h-4 w-4 mt-0.5 text-orange-500" />
                      <div>
                          <span className="font-medium">Distance to Pickup (from Hub)</span>
                      </div>
                   </span>
                   <span className="font-medium">{hubDistance} km</span>
                </div>
                <div className="border-t border-gray-100 my-2"></div>
              </>
            )}

            {distance !== null && (
              <>
                <div className="flex items-start justify-between text-sm">
                   <span className="text-gray-600 flex items-start gap-2">
                      <Navigation className="h-4 w-4 mt-0.5" />
                      <div>
                          <span className="font-medium">Total Distance (Delivery)</span>
                      </div>
                   </span>
                   <span className="text-gray-900 font-medium">{distance} km</span>
                </div>

                <div className="border-t border-gray-100"></div>
              </>
            )}

            {/* Fee Row */}
            <div className="flex items-start justify-between">
              <span className="text-gray-600 flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1" />
                <div>
                    <span className="font-medium">Total Delivery Fee</span>
                    {distance === null && (
                      <p className="text-xs text-gray-500 font-normal">Base rate (distance not calculated)</p>
                    )}
                </div>
              </span>
              <span className="text-xl font-bold text-delivery-primary">₱{deliveryFee.toFixed(2)}</span>
            </div>
          </div>

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


    </div>
  );
};

export default PadalaBooking;

