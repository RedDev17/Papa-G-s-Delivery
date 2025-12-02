import React, { useState } from 'react';
import { ArrowLeft, MapPin, Navigation } from 'lucide-react';
import { CartItem, PaymentMethod } from '../types';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { useOpenStreetMap } from '../hooks/useOpenStreetMap';
import { useRestaurants } from '../hooks/useRestaurants';
import DeliveryMap from './DeliveryMap';

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
  
  // Get the restaurant from the first cart item
  const currentRestaurantId = cartItems.length > 0 ? cartItems[0].restaurantId : null;
  const currentRestaurant = restaurants.find(r => r.id === currentRestaurantId);
  
  // Use restaurant location if available, otherwise default
  const restaurantLocation = currentRestaurant?.latitude && currentRestaurant?.longitude
    ? { lat: currentRestaurant.latitude, lng: currentRestaurant.longitude }
    : defaultRestaurantLocation;

  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [notes, setNotes] = useState('');
  // Delivery fee calculation
  const [distance, setDistance] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(60); // Default base fee
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  // Delivery area validation
  const [isWithinArea, setIsWithinArea] = useState<boolean | null>(null);
  const [areaCheckError, setAreaCheckError] = useState<string | null>(null);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Set default payment method when payment methods are loaded
  React.useEffect(() => {
    if (paymentMethods.length > 0 && !paymentMethod) {
      setPaymentMethod(paymentMethods[0].id as PaymentMethod);
    }
  }, [paymentMethods]);

  // Get customer's current location using browser geolocation
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please enter your address manually.');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCustomerLocation({ lat: latitude, lng: longitude });
        
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'E-Run-Delivery-App'
              }
            }
          );
          const data = await response.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          }
        } catch (err) {
          console.error('Reverse geocoding error:', err);
        }
        
        // Calculate distance
        const distanceResult = await calculateDistance(`${latitude},${longitude}`);
        if (distanceResult) {
          setDistance(distanceResult.distance);
          const fee = calculateDeliveryFee(distanceResult.distance);
          setDeliveryFee(fee);
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Could not get your location. Please enter your address manually.');
        setIsGettingLocation(false);
      }
    );
  };

  // Handle location selection from map
  const handleLocationSelect = async (lat: number, lng: number) => {
    setCustomerLocation({ lat, lng });
    
    // Get address from coordinates
    const newAddress = await reverseGeocode(lat, lng);
    if (newAddress) {
      setAddress(newAddress);
      
      // Trigger distance calculation
      setIsCalculatingDistance(true);
      const result = await calculateDistance(`${lat},${lng}`, restaurantLocation);
      if (result) {
        setDistance(result.distance);
        const fee = calculateDeliveryFee(result.distance);
        setDeliveryFee(fee);
        setIsWithinArea(true);
      } else {
        // If distance calculation fails, it might be too far
        setIsWithinArea(false);
      }
      setIsCalculatingDistance(false);
    }
  };

  // Calculate distance and delivery fee when address changes
  React.useEffect(() => {
    if (address.trim()) {
      const timeoutId = setTimeout(async () => {
        setIsCalculatingDistance(true);
        setAreaCheckError(null);
        
        // First check if address is within delivery area
        const areaCheck = await isWithinDeliveryArea(address, restaurantLocation);
        setIsWithinArea(areaCheck.within);
        
        if (areaCheck.error) {
          setAreaCheckError(areaCheck.error);
        }
        
        // Only calculate distance and fee if address is within delivery area
        if (areaCheck.within) {
          const result = await calculateDistance(address, restaurantLocation);
          if (result) {
            setDistance(result.distance);
            const fee = calculateDeliveryFee(result.distance);
            setDeliveryFee(fee);
          } else {
            setDistance(null);
            setDeliveryFee(60);
          }
          
          // Get coordinates for the address to show on map
          // Normalize address to fix common typos (pangpaga -> Pampanga, etc.)
          try {
            let normalizedAddress = address.trim();
            // Fix common typos
            normalizedAddress = normalizedAddress.replace(/\bpangpaga\b/gi, 'Pampanga');
            normalizedAddress = normalizedAddress.replace(/\bpampanga\b/gi, 'Pampanga');
            normalizedAddress = normalizedAddress.replace(/\bbrgy\b/gi, 'Barangay');
            normalizedAddress = normalizedAddress.replace(/\bbgy\b/gi, 'Barangay');
            normalizedAddress = normalizedAddress.replace(/\bpurok\b/gi, 'Purok');
            normalizedAddress = normalizedAddress.replace(/\bblk\b/gi, 'Block');
            normalizedAddress = normalizedAddress.replace(/\bfloridablanca\b/gi, 'Floridablanca');
            
            // Check if address contains a Plus Code pattern
            const hasPlusCode = /[A-Z0-9]{2,4}\+[A-Z0-9]{2,4}/i.test(normalizedAddress);
            const fullAddress = hasPlusCode || normalizedAddress.includes('Pampanga') || normalizedAddress.includes('Philippines') 
              ? normalizedAddress 
              : `${normalizedAddress}, Pampanga, Philippines`;
            
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1&countrycodes=ph`,
              {
                headers: {
                  'User-Agent': 'E-Run-Delivery-App'
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
        } else {
          // Address is outside delivery area
          setDistance(null);
          setDeliveryFee(0);
          setCustomerLocation(null);
        }
        setIsCalculatingDistance(false);
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(timeoutId);
    } else {
      setDistance(null);
      setDeliveryFee(60);
      setCustomerLocation(null);
      setIsWithinArea(null);
      setAreaCheckError(null);
    }
  }, [address, calculateDistance, calculateDeliveryFee, isWithinDeliveryArea]);

  // Calculate total price including delivery fee
  const finalTotalPrice = React.useMemo(() => {
    return totalPrice + deliveryFee;
  }, [totalPrice, deliveryFee]);

  const selectedPaymentMethod = paymentMethods.find(method => method.id === paymentMethod);

  const handleProceedToPayment = () => {
    setStep('payment');
  };

  const handlePlaceOrder = () => {
    const googleMapsLink = customerLocation 
      ? `https://www.google.com/maps/search/?api=1&query=${customerLocation.lat},${customerLocation.lng}`
      : '';

    const orderDetails = `
🛒 Papa G's Delivery ORDER

👤 Customer: ${customerName}
📞 Contact: ${contactNumber}
📍 Service: Delivery
🏠 Address: ${address}${landmark ? `\n🗺️ Landmark: ${landmark}` : ''}
${googleMapsLink ? `📍 Map Location: ${googleMapsLink}` : ''}


📋 ORDER DETAILS:
${(() => {
  // Group items by restaurant
  const itemsByRestaurant: { [key: string]: CartItem[] } = {};
  cartItems.forEach(item => {
    const restId = item.restaurantId || 'unknown';
    if (!itemsByRestaurant[restId]) {
      itemsByRestaurant[restId] = [];
    }
    itemsByRestaurant[restId].push(item);
  });

  // Format message
  return Object.entries(itemsByRestaurant).map(([restId, items]) => {
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
  }).join('\n\n');
})()}

💰 Subtotal: ₱${totalPrice}
🛵 Delivery Fee: ₱${deliveryFee.toFixed(2)}${distance !== null ? ` (${distance} km)` : ''}
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Cart</span>
          </button>
          <h1 className="text-3xl font-noto font-semibold text-black ml-8">Delivery Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-noto font-medium text-black mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200">
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
            
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">₱{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Delivery Fee:
                  {isCalculatingDistance && (
                    <span className="text-xs text-gray-500 ml-1">(calculating...)</span>
                  )}
                  {distance !== null && !isCalculatingDistance && (
                    <span className="text-xs text-gray-500 ml-1">({distance} km)</span>
                  )}
                </span>
                <span className="text-gray-900 font-semibold">₱{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-2xl font-noto font-semibold text-black pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span>₱{finalTotalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Customer Details Form */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-noto font-medium text-black mb-6">Delivery Information</h2>
            
            <form className="space-y-6">
              {/* Customer Information */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent transition-all duration-200"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent transition-all duration-200"
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
                  {isWithinArea === true && distance !== null && !isCalculatingDistance && (
                    <span className="ml-2 text-xs text-green-600">✓ Within area • Distance: {distance} km</span>
                  )}
                  {isWithinArea === false && !isCalculatingDistance && (
                    <span className="ml-2 text-xs text-red-600">✗ Outside delivery area</span>
                  )}
                </label>
                <div className="flex gap-2 mb-2">
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent transition-all duration-200 ${
                      isWithinArea === false ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter complete address or pin location on map"
                    rows={3}
                    required
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    title="Use my current location"
                  >
                    <Navigation className={`h-5 w-5 ${isGettingLocation ? 'animate-spin' : ''}`} />
                    <span className="font-medium whitespace-nowrap text-sm">Locate Me</span>
                  </button>
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
                      restaurantLocation={restaurantLocation}
                      customerLocation={customerLocation}
                      distance={distance}
                      address={address}
                      onLocationSelect={handleLocationSelect}
                      restaurantName={currentRestaurant?.name}
                      restaurantAddress={currentRestaurant?.deliveryTime ? `Delivery Time: ${currentRestaurant.deliveryTime}` : undefined}
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      💡 Tip: You can drag the pin to adjust your exact location
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">Landmark</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent transition-all duration-200"
                  placeholder="e.g., Near McDonald's, Beside 7-Eleven, In front of school"
                />
              </div>

              {/* Special Notes */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">Special Instructions</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-delivery-primary focus:border-transparent transition-all duration-200"
                  placeholder="Any special requests or notes..."
                  rows={3}
                />
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={!isDetailsValid}
                className={`w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform ${
                  isDetailsValid
                    ? 'bg-delivery-primary text-white hover:bg-delivery-dark hover:scale-[1.02] shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Proceed to Payment
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Payment Step
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <button
          onClick={() => setStep('details')}
          className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Details</span>
        </button>
        <h1 className="text-3xl font-noto font-semibold text-black ml-8">Payment</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Method Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-noto font-medium text-black mb-6">Choose Payment Method</h2>
          
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
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-noto font-medium text-black mb-6">Final Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <h4 className="font-medium text-black mb-2">Customer Details</h4>
              <p className="text-sm text-gray-600">Name: {customerName}</p>
              <p className="text-sm text-gray-600">Contact: {contactNumber}</p>
              <p className="text-sm text-gray-600">Service: Delivery</p>
              <p className="text-sm text-gray-600">Address: {address}</p>
              {landmark && <p className="text-sm text-gray-600">Landmark: {landmark}</p>}
            </div>

            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200">
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
          
          <div className="border-t border-gray-200 pt-4 mb-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-900">₱{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Delivery Fee:
                {distance !== null && (
                  <span className="text-xs text-gray-500 ml-1">({distance} km)</span>
                )}
              </span>
              <span className="text-gray-900 font-semibold">₱{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-2xl font-noto font-semibold text-black pt-2 border-t border-gray-200">
              <span>Total:</span>
              <span>₱{finalTotalPrice.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            className="w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform bg-delivery-primary text-white hover:bg-delivery-dark hover:scale-[1.02] shadow-lg"
          >
            Place Order via Messenger
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-3">
            You'll be redirected to Facebook Messenger to confirm your order. Don't forget to attach your payment screenshot!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
