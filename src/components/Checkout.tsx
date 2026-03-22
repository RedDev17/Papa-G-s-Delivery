import React, { useState } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { CartItem, PaymentMethod } from '../types';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { useOpenStreetMap } from '../hooks/useOpenStreetMap';
import { useRestaurants } from '../hooks/useRestaurants';
import { rateLimitedFetch } from '../lib/nominatimRateLimiter';
import DeliveryMap from './DeliveryMap';
import AddressAutocomplete from './AddressAutocomplete';

interface CheckoutProps {
  cartItems: CartItem[];
  totalPrice: number;
  onBack: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ cartItems, totalPrice, onBack }) => {
  const { paymentMethods } = usePaymentMethods();
  const { restaurants } = useRestaurants();
  const { calculateDistance, calculateDeliveryFee, isWithinDeliveryArea, restaurantLocation: defaultRestaurantLocation, maxDeliveryRadius } = useGoogleMaps();
  const { reverseGeocode } = useOpenStreetMap();
  
  // Group cart items by restaurant
  const itemsByRestaurant = React.useMemo(() => {
    const groups: { [key: string]: CartItem[] } = {};
    cartItems.forEach(item => {
      const restId = item.restaurantId || 'unknown';
      if (!groups[restId]) groups[restId] = [];
      groups[restId].push(item);
    });
    return groups;
  }, [cartItems]);

  // Get unique restaurant IDs from cart
  const restaurantIds = React.useMemo(() => Object.keys(itemsByRestaurant), [itemsByRestaurant]);

  // Get restaurant location by ID (with fallback to default)
  const getRestaurantLocation = React.useCallback((restId: string) => {
    const rest = restaurants.find(r => r.id === restId);
    return rest?.latitude && rest?.longitude
      ? { lat: rest.latitude, lng: rest.longitude }
      : defaultRestaurantLocation;
  }, [restaurants, defaultRestaurantLocation]);

  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [notes, setNotes] = useState('');
  // Per-restaurant delivery fee calculation
  const [restaurantFees, setRestaurantFees] = useState<Record<string, { distance: number | null; fee: number }>>({});
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);
  // Delivery area validation
  const [isWithinArea, setIsWithinArea] = useState<boolean | null>(null);
  const [areaCheckError, setAreaCheckError] = useState<string | null>(null);
  const [debouncedAddress, setDebouncedAddress] = useState('');
  // Flag to skip address re-geocoding when location was selected by exact coordinates (GPS/map/autocomplete)
  const locationSelectedByCoords = React.useRef(false);

  // Computed total delivery fee (sum of all restaurant fees, with fallback base fee)
  const totalDeliveryFee = React.useMemo(() => {
    return restaurantIds.reduce((sum, restId) => {
      const feeInfo = restaurantFees[restId];
      return sum + (feeInfo?.fee ?? calculateDeliveryFee(null));
    }, 0);
  }, [restaurantIds, restaurantFees, calculateDeliveryFee]);

  // Memoize map props so DeliveryMap doesn't re-render on unrelated keystrokes
  const mapRestaurantLocation = React.useMemo(
    () => getRestaurantLocation(restaurantIds[0] || ''),
    [getRestaurantLocation, restaurantIds]
  );
  const mapDistance = React.useMemo(
    () => restaurantFees[restaurantIds[0]]?.distance ?? null,
    [restaurantFees, restaurantIds]
  );

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Set default payment method when payment methods are loaded
  React.useEffect(() => {
    if (paymentMethods.length > 0 && !paymentMethod) {
      setPaymentMethod(paymentMethods[0].id as PaymentMethod);
    }
  }, [paymentMethods, paymentMethod]);



  // Handle location selection from map
  const handleLocationSelect = React.useCallback(async (lat: number, lng: number) => {
    // Mark that we already have exact coordinates — skip forward-geocoding in the address useEffect
    locationSelectedByCoords.current = true;
    setCustomerLocation({ lat, lng });
    
    // Get address from coordinates
    const newAddress = await reverseGeocode(lat, lng);
    if (newAddress) {
      setAddress(newAddress);
      // Update debounced address immediately when selecting from map
      setDebouncedAddress(newAddress);
      
      // Trigger distance calculation for each restaurant
      setIsCalculatingDistance(true);
      const newFees: Record<string, { distance: number | null; fee: number }> = {};
      let allWithinArea = true;
      
      for (const restId of restaurantIds) {
        const restLocation = getRestaurantLocation(restId);
        const result = await calculateDistance(`${lat},${lng}`, restLocation);
        if (result) {
          newFees[restId] = {
            distance: result.distance,
            fee: calculateDeliveryFee(result.distance)
          };
        } else {
          allWithinArea = false;
          newFees[restId] = { distance: null, fee: calculateDeliveryFee(null) };
        }
      }
      
      setRestaurantFees(newFees);
      setIsWithinArea(allWithinArea);
      setIsCalculatingDistance(false);
    }
  }, [reverseGeocode, calculateDistance, calculateDeliveryFee, restaurantIds, getRestaurantLocation]);

  // Calculate distance and delivery fee when address changes — per restaurant
  React.useEffect(() => {
    if (address.trim()) {
      const timeoutId = setTimeout(async () => {
        setDebouncedAddress(address);
        setIsCalculatingDistance(true);
        setAreaCheckError(null);
        
        // Check if address is within delivery area (use default location for area check)
        const areaCheck = await isWithinDeliveryArea(address, defaultRestaurantLocation);
        setIsWithinArea(areaCheck.within);
        
        if (areaCheck.error) {
          setAreaCheckError(areaCheck.error);
        }
        
        // Only calculate distance and fee if address is within delivery area
        if (areaCheck.within) {
          // Calculate delivery fee for EACH restaurant separately
          const newFees: Record<string, { distance: number | null; fee: number }> = {};
          
          for (const restId of restaurantIds) {
            const restLocation = getRestaurantLocation(restId);
            const result = await calculateDistance(address, restLocation);
            if (result) {
              newFees[restId] = {
                distance: result.distance,
                fee: calculateDeliveryFee(result.distance)
              };
            } else {
              newFees[restId] = { distance: null, fee: calculateDeliveryFee(null) };
            }
          }
          
          setRestaurantFees(newFees);
          
          // Get coordinates for the address to show on map
          // Skip if location was already set by exact coordinates (GPS/map click/autocomplete)
          if (locationSelectedByCoords.current) {
            locationSelectedByCoords.current = false;
          } else {
            try {
              let normalizedAddress = address.trim();
              normalizedAddress = normalizedAddress.replace(/\bpangpaga\b/gi, 'Pampanga');
              normalizedAddress = normalizedAddress.replace(/\bpampanga\b/gi, 'Pampanga');
              normalizedAddress = normalizedAddress.replace(/\bbrgy\b/gi, 'Barangay');
              normalizedAddress = normalizedAddress.replace(/\bbgy\b/gi, 'Barangay');
              normalizedAddress = normalizedAddress.replace(/\bpurok\b/gi, 'Purok');
              normalizedAddress = normalizedAddress.replace(/\bblk\b/gi, 'Block');
              normalizedAddress = normalizedAddress.replace(/\bfloridablanca\b/gi, 'Floridablanca');
              
              const hasPlusCode = /[A-Z0-9]{2,4}\+[A-Z0-9]{2,4}/i.test(normalizedAddress);
              const fullAddress = hasPlusCode || normalizedAddress.includes('Pampanga') || normalizedAddress.includes('Philippines') 
                ? normalizedAddress 
                : `${normalizedAddress}, Pampanga, Philippines`;
              
              const response = await rateLimitedFetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1&countrycodes=ph`,
                {
                  headers: {
                    'User-Agent': 'PapaGsDelivery/1.0'
                  }
                }
              );
              const data = await response.json();
              if (data && data.length > 0) {
                setCustomerLocation({
                  lat: parseFloat(data[0].lat),
                  lng: parseFloat(data[0].lon)
                });
              }
            } catch (err) {
              console.error('Geocoding error:', err);
            }
          }
        } else {
          // Address is outside delivery area
          setRestaurantFees({});
          setCustomerLocation(null);
        }
        setIsCalculatingDistance(false);
      }, 1000);

      return () => clearTimeout(timeoutId);
    } else {
      setRestaurantFees({});
      setCustomerLocation(null);
      setIsWithinArea(null);
      setAreaCheckError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, calculateDistance, calculateDeliveryFee, isWithinDeliveryArea, restaurantIds.join(',')]);

  // Calculate total price including all delivery fees
  const finalTotalPrice = React.useMemo(() => {
    return totalPrice + totalDeliveryFee;
  }, [totalPrice, totalDeliveryFee]);

  const selectedPaymentMethod = paymentMethods.find(method => method.id === paymentMethod);

  const handleProceedToPayment = () => {
    setStep('payment');
  };

  const handlePlaceOrder = () => {
    const googleMapsLink = customerLocation 
      ? `https://www.google.com/maps?q=${customerLocation.lat},${customerLocation.lng}`
      : '';

    // Build per-restaurant delivery fee breakdown for messenger
    const deliveryFeeBreakdown = Object.entries(itemsByRestaurant).map(([restId]) => {
      const restaurantName = restaurants.find(r => r.id === restId)?.name || 'Papa G\'s Delivery';
      const feeInfo = restaurantFees[restId];
      const fee = feeInfo?.fee ?? calculateDeliveryFee(null);
      const dist = feeInfo?.distance;
      return `  🏪 ${restaurantName}: ₱${fee.toFixed(2)}${dist !== null && dist !== undefined ? ` (${dist} km)` : ''}`;
    }).join('\n');

    const orderDetails = `
🛒 Papa G's Delivery ORDER

👤 Customer: ${customerName}
📞 Contact: ${contactNumber}
📍 Service: Delivery
🏠 Address: ${address}${landmark ? `\n🗺️ Landmark: ${landmark}` : ''}
${googleMapsLink ? `📍 Map Location: ${googleMapsLink}` : ''}


📋 ORDER DETAILS:
${Object.entries(itemsByRestaurant).map(([restId, items]) => {
    const restaurantName = restaurants.find(r => r.id === restId)?.name || 'Papa G\'s Delivery';
    
    const itemsList = items.map(item => {
      let itemDetails = `• ${item.name}`;
      if (item.selectedVariation) {
        itemDetails += ` (${item.selectedVariation.name})`;
      }
      if (item.selectedAddOns && item.selectedAddOns.length > 0) {
        itemDetails += ` + ${item.selectedAddOns.map(addOn => 
          addOn.quantity && addOn.quantity > 1 
            ? `${addOn.name} x${addOn.quantity}`
            : addOn.name
        ).join(', ')}`;
      }
      itemDetails += ` x${item.quantity} - ₱${item.totalPrice * item.quantity}`;
      return itemDetails;
    }).join('\n');

    return `🏪 ${restaurantName.toUpperCase()}\n${itemsList}`;
  }).join('\n\n')}

💰 Subtotal: ₱${totalPrice}
🛵 Delivery Fees:
${deliveryFeeBreakdown}
🛵 Total Delivery Fee: ₱${totalDeliveryFee.toFixed(2)}
💰 TOTAL: ₱${finalTotalPrice.toFixed(2)}

⚠️ Notice: The price will be different at the store or restaurant.

💳 Payment: ${selectedPaymentMethod?.name || paymentMethod}
📸 Payment Screenshot: Please attach your payment receipt screenshot

${notes ? `📝 Notes: ${notes}` : ''}

Please confirm this order to proceed. Thank you for choosing Papa G's Delivery! 🛵
    `.trim();

    const encodedMessage = encodeURIComponent(orderDetails);
    const messengerUrl = `https://m.me/856261030909952?text=${encodedMessage}`;
    
    window.open(messengerUrl, '_blank');
  };

  const isDetailsValid = customerName && contactNumber && address && isWithinArea === true;

  if (step === 'details') {
    return (
      <div className="min-h-screen bg-gray-50 pb-12">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 sm:mb-8">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition-colors duration-200 bg-white px-4 py-2 rounded-full shadow-sm hover:shadow"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline font-medium">Back to Cart</span>
              <span className="sm:hidden font-medium">Back</span>
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight sm:ml-4">Checkout</h1>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">📋</span> Order Summary
            </h2>
            
            <div className="space-y-6 mb-6">
              {Object.entries(itemsByRestaurant).map(([restId, items]) => {
                const restaurantName = restaurants.find(r => r.id === restId)?.name || 'Papa G\'s Delivery';
                const feeInfo = restaurantFees[restId];
                
                return (
                  <div key={restId} className="border border-gray-100 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center gap-2">
                      <span className="text-lg">🏪</span>
                      <h3 className="font-medium text-gray-900">{restaurantName}</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-white">
                          <div>
                            <h4 className="font-medium text-black">{item.name}</h4>
                            {item.selectedVariation && (
                              <p className="text-sm text-gray-600">Size: {item.selectedVariation.name}</p>
                            )}
                            {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                              <p className="text-sm text-gray-600">
                                Add-ons: {item.selectedAddOns.map(addOn => addOn.name).join(', ')}
                              </p>
                            )}
                            <p className="text-sm text-gray-600">₱{item.totalPrice} x {item.quantity}</p>
                          </div>
                          <span className="font-semibold text-black">₱{item.totalPrice * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    {/* Per-restaurant delivery fee */}
                    <div className="bg-green-50 px-4 py-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Delivery Fee
                        {isCalculatingDistance && (
                          <span className="text-xs text-gray-500 ml-1">(calculating...)</span>
                        )}
                        {feeInfo?.distance !== null && feeInfo?.distance !== undefined && !isCalculatingDistance && (
                          <span className="text-xs text-gray-500 ml-1">({feeInfo.distance} km)</span>
                        )}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        ₱{(feeInfo?.fee ?? calculateDeliveryFee(null)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">₱{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Total Delivery Fee{restaurantIds.length > 1 ? ` (${restaurantIds.length} restaurants)` : ''}:
                  {isCalculatingDistance && (
                    <span className="text-xs text-gray-500 ml-1">(calculating...)</span>
                  )}
                </span>
                <span className="text-gray-900 font-semibold">₱{totalDeliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-2xl font-bold text-gray-900 pt-3 border-t border-gray-200">
                <span>Total:</span>
                <span className="text-delivery-primary">₱{finalTotalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Customer Details Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">📍</span> Delivery Details
            </h2>
            
            <form className="space-y-6">
              {/* Customer Information */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Contact Number *</label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200"
                  placeholder="09XX XXX XXXX"
                  required
                />
              </div>

              {/* Delivery Address with Map */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Delivery Address *
                  {isCalculatingDistance && (
                    <span className="ml-2 text-xs text-gray-500">Checking delivery area...</span>
                  )}
                  {isWithinArea === true && restaurantFees[restaurantIds[0]]?.distance != null && !isCalculatingDistance && (
                    <span className="ml-2 text-xs text-green-600">✓ Within area • Distance: {restaurantFees[restaurantIds[0]].distance} km</span>
                  )}
                  {isWithinArea === false && !isCalculatingDistance && (
                    <span className="ml-2 text-xs text-red-600">✗ Outside delivery area</span>
                  )}
                </label>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1">
                    <AddressAutocomplete
                      value={address}
                      onChange={(value) => setAddress(value)}
                      onSelect={(newAddress, lat, lng) => {
                        setAddress(newAddress);
                        handleLocationSelect(lat, lng);
                      }}
                      placeholder="Enter complete address or pin location on map"
                      required
                      className="w-full"
                    />
                  </div>
                </div>
                {isWithinArea === false && !isCalculatingDistance && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ Delivery not available to this address
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      We only deliver to addresses within {maxDeliveryRadius}km from our restaurant location.
                    </p>
                    {areaCheckError && (
                      <p className="text-xs text-red-500 mt-1">{areaCheckError}</p>
                    )}
                  </div>
                )}
                
                
                {/* Map Display */}
                {(customerLocation || address) && (
                  <div className="mt-4">
                    <DeliveryMap
                      restaurantLocation={mapRestaurantLocation}
                      customerLocation={customerLocation}
                      distance={mapDistance}
                      address={debouncedAddress}
                      onLocationSelect={handleLocationSelect}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">Landmark</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200"
                  placeholder="e.g., Near McDonald's, Beside 7-Eleven, In front of school"
                />
              </div>

              {/* Special Notes */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">Special Instructions</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200"
                  placeholder="Any special requests or notes..."
                  rows={3}
                />
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={!isDetailsValid}
                className={`w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform ${
                  isDetailsValid
                    ? 'bg-delivery-primary text-white hover:bg-delivery-dark hover:-translate-y-1 shadow-md hover:shadow-xl'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Proceed to Payment
              </button>
            </form>
          </div>
        </div>
      </div>
      </div>
    );
  }

  // Payment Step
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 sm:mb-8">
          <button
            onClick={() => setStep('details')}
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition-colors duration-200 bg-white px-4 py-2 rounded-full shadow-sm hover:shadow"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline font-medium">Back to Details</span>
            <span className="sm:hidden font-medium">Back</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight sm:ml-4">Payment</h1>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Method Selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-2xl">💳</span> Choose Payment
          </h2>
          
          <div className="grid grid-cols-1 gap-4 mb-6">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center space-x-3 ${
                  paymentMethod === method.id
                    ? 'border-delivery-primary bg-delivery-primary text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-delivery-primary'
                }`}
              >
                <span className="text-2xl">💳</span>
                <span className="font-medium">{method.name}</span>
              </button>
            ))}
          </div>

          {/* Payment Details with QR Code */}
          {selectedPaymentMethod && (
            <div className="bg-red-50 rounded-lg p-6 mb-6 border border-red-100">
              <h3 className="font-medium text-black mb-4">Payment Details</h3>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{selectedPaymentMethod.name}</p>
                  <p className="font-mono text-black font-medium">{selectedPaymentMethod.account_number}</p>
                  <p className="text-sm text-gray-600 mb-3">Account Name: {selectedPaymentMethod.account_name}</p>
                  <p className="text-xl font-semibold text-black">Amount: ₱{finalTotalPrice.toFixed(2)}</p>
                </div>
                <div className="flex-shrink-0">
                  <img 
                    src={selectedPaymentMethod.qr_code_url} 
                    alt={`${selectedPaymentMethod.name} QR Code`}
                    className="w-32 h-32 rounded-lg border-2 border-red-300 shadow-sm"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop';
                    }}
                  />
                  <p className="text-xs text-gray-500 text-center mt-2">Scan to pay</p>
                </div>
              </div>
            </div>
          )}

          {/* Reference Number */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-black mb-2">📸 Payment Proof Required</h4>
            <p className="text-sm text-gray-700">
              After making your payment, please take a screenshot of your payment receipt and attach it when you send your order via Messenger. This helps us verify and process your order quickly.
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-2xl">📝</span> Final Order Summary
          </h2>
          
          <div className="space-y-4 mb-6">
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <h4 className="font-medium text-black mb-2">Customer Details</h4>
              <p className="text-sm text-gray-600">Name: {customerName}</p>
              <p className="text-sm text-gray-600">Contact: {contactNumber}</p>
              <p className="text-sm text-gray-600">Service: Delivery</p>
              <p className="text-sm text-gray-600">Address: {address}</p>
              {landmark && <p className="text-sm text-gray-600">Landmark: {landmark}</p>}
            </div>

            {Object.entries(itemsByRestaurant).map(([restId, items]) => {
              const restaurantName = restaurants.find(r => r.id === restId)?.name || 'Papa G\'s Delivery';
              const feeInfo = restaurantFees[restId];
              
              return (
                <div key={restId} className="border border-gray-100 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center gap-2">
                    <span className="text-lg">🏪</span>
                    <h3 className="font-medium text-gray-900">{restaurantName}</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-white">
                        <div>
                          <h4 className="font-medium text-black">{item.name}</h4>
                          {item.selectedVariation && (
                            <p className="text-sm text-gray-600">Size: {item.selectedVariation.name}</p>
                          )}
                          {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                            <p className="text-sm text-gray-600">
                              Add-ons: {item.selectedAddOns.map(addOn => 
                                addOn.quantity && addOn.quantity > 1 
                                  ? `${addOn.name} x${addOn.quantity}`
                                  : addOn.name
                              ).join(', ')}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">₱{item.totalPrice} x {item.quantity}</p>
                        </div>
                        <span className="font-semibold text-black">₱{item.totalPrice * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  {/* Per-restaurant delivery fee */}
                  <div className="bg-green-50 px-4 py-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Delivery Fee
                      {feeInfo?.distance !== null && feeInfo?.distance !== undefined && (
                        <span className="text-xs text-gray-500 ml-1">({feeInfo.distance} km)</span>
                      )}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₱{(feeInfo?.fee ?? calculateDeliveryFee(null)).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="border-t border-gray-200 pt-4 mb-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-900">₱{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Total Delivery Fee{restaurantIds.length > 1 ? ` (${restaurantIds.length} restaurants)` : ''}:
              </span>
              <span className="text-gray-900 font-semibold">₱{totalDeliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-2xl font-bold text-gray-900 pt-3 border-t border-gray-200">
              <span>Total:</span>
              <span className="text-delivery-primary">₱{finalTotalPrice.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            className="w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform bg-delivery-primary text-white hover:bg-delivery-dark hover:-translate-y-1 shadow-md hover:shadow-xl"
          >
            Place Order via Messenger
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-3">
            You'll be redirected to Facebook Messenger to confirm your order. Don't forget to attach your payment screenshot!
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
