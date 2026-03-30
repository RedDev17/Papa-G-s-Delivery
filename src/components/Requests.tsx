import React, { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import Header from './Header';

interface RequestsProps {
  onBack: () => void;
}

const Requests: React.FC<RequestsProps> = ({ onBack }) => {
  const { calculateDistanceBetweenAddresses, calculateDeliveryFee } = useGoogleMaps();

  // Angkas/Padala form data
  const [angkasData, setAngkasData] = useState({
    customer_name: '',
    contact_number: '',
    request_type: 'angkas',
    subject: '',
    description: '',
    pickup_address: '',
    dropoff_address: ''
  });
  const [isSubmittingAngkas, setIsSubmittingAngkas] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(calculateDeliveryFee(null));
  const [isCalculating, setIsCalculating] = useState(false);

  const requestTypes = [
    { value: 'angkas', label: 'Angkas (Motorcycle Ride)' }
  ];

  // Angkas/Padala handlers
  const handleAngkasInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'contact_number') {
      const digits = value.replace(/\D/g, '').slice(0, 11);
      setAngkasData(prev => ({ ...prev, [name]: digits }));
    } else {
      setAngkasData(prev => ({ ...prev, [name]: value }));
    }
  };

  const calculateFee = async () => {
    if (!angkasData.pickup_address.trim() || !angkasData.dropoff_address.trim()) {
      return;
    }

    try {
      setIsCalculating(true);
      const result = await calculateDistanceBetweenAddresses(
        angkasData.pickup_address,
        angkasData.dropoff_address
      );
      if (result && !isNaN(result.distance)) {
        setDistance(result.distance);
        const fee = calculateDeliveryFee(result.distance);
        setDeliveryFee(fee);
      } else {
        setDistance(null);
        setDeliveryFee(calculateDeliveryFee(null));
      }
    } catch (error) {
      console.error('Error calculating Angkas fee:', error);
      setDistance(null);
      setDeliveryFee(calculateDeliveryFee(null));
    } finally {
      setIsCalculating(false);
    }
  };

  const handleAngkasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !angkasData.customer_name ||
      !angkasData.contact_number ||
      !angkasData.subject ||
      !angkasData.description ||
      !angkasData.pickup_address ||
      !angkasData.dropoff_address
    ) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmittingAngkas(true);
    try {
      const { error } = await supabase
        .from('requests')
        .insert({
          customer_name: angkasData.customer_name,
          contact_number: angkasData.contact_number,
          request_type: angkasData.request_type,
          subject: angkasData.subject,
          description: angkasData.description,
          address: `${angkasData.pickup_address} -> ${angkasData.dropoff_address}`,
          status: 'pending'
        });

      if (error) throw error;

      const requestTypeLabel = requestTypes.find(t => t.value === angkasData.request_type)?.label || angkasData.request_type;
      const message = `🏍️ ANGKAS/PADALA REQUEST

Type: ${requestTypeLabel}
Subject: ${angkasData.subject}

👤 Customer: ${angkasData.customer_name}
📞 Contact: ${angkasData.contact_number}
📍 Pickup Address:
${angkasData.pickup_address}

📍 Drop-off Address:
${angkasData.dropoff_address}

${distance !== null ? `📏 Distance: ${distance} km` : ''}
💰 Estimated Fare (delivery fee logic): ₱${deliveryFee.toFixed(2)}

📄 Description:
${angkasData.description}

Thank you for your Angkas/Padala request. We will get back to you soon! 🛵`;

      const encodedMessage = encodeURIComponent(message);
      const messengerUrl = `https://m.me/856261030909952?text=${encodedMessage}`;
      
      window.open(messengerUrl, '_blank');
      
      // Reset form
      setAngkasData({
        customer_name: '',
        contact_number: '',
        request_type: 'angkas',
        subject: '',
        description: '',
        pickup_address: '',
        dropoff_address: ''
      });
      setDistance(null);
      setDeliveryFee(calculateDeliveryFee(null));
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setIsSubmittingAngkas(false);
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
            🛵 Angkas
          </h1>
        </div>

        <form onSubmit={handleAngkasSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="customer_name"
                  value={angkasData.customer_name}
                  onChange={handleAngkasInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number *</label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-sm font-medium text-gray-600 select-none">+63</span>
                  <input
                    type="tel"
                    name="contact_number"
                    value={angkasData.contact_number}
                    onChange={handleAngkasInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-r-xl focus:bg-white focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200"
                    placeholder="09XX XXX XXXX"
                    maxLength={11}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </div>
                {angkasData.contact_number && angkasData.contact_number.length < 11 && (
                  <p className="text-xs text-amber-600 mt-1">{11 - angkasData.contact_number.length} more digit{11 - angkasData.contact_number.length !== 1 ? 's' : ''} needed</p>
                )}
                {angkasData.contact_number && angkasData.contact_number.length === 11 && !angkasData.contact_number.startsWith('09') && (
                  <p className="text-xs text-red-500 mt-1">Must start with 09</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Type *</label>
            <select
              name="request_type"
              value={angkasData.request_type}
              onChange={handleAngkasInputChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200"
            >
              {requestTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
            <input
              type="text"
              name="subject"
              value={angkasData.subject}
              onChange={handleAngkasInputChange}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200"
              placeholder="Brief summary of your request (e.g., Need Angkas ride)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              name="description"
              value={angkasData.description}
              onChange={handleAngkasInputChange}
              required
              rows={6}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200"
              placeholder="Please provide detailed information about your Angkas request (pickup location, destination, time needed, etc.)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Address *</label>
            <textarea
              name="pickup_address"
              value={angkasData.pickup_address}
              onChange={handleAngkasInputChange}
              required
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200"
              placeholder="Where to pick up (complete address)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Drop-off Address *</label>
            <textarea
              name="dropoff_address"
              value={angkasData.dropoff_address}
              onChange={handleAngkasInputChange}
              onBlur={calculateFee}
              required
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-delivery-primary/20 focus:border-delivery-primary transition-all duration-200"
              placeholder="Where to drop off (complete address)"
            />
            {isCalculating && (
              <p className="text-xs text-gray-500 mt-1">Calculating distance and fee...</p>
            )}
            {!isCalculating && distance !== null && (
              <p className="text-xs text-delivery-primary mt-1">
                Estimated distance: {distance} km • Estimated fee: ₱{deliveryFee.toFixed(2)} (₱60 base + ₱13 per km)
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmittingAngkas}
            className="w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform bg-delivery-primary text-white hover:bg-delivery-dark hover:-translate-y-1 shadow-md hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            <Send className="h-5 w-5" />
            {isSubmittingAngkas ? 'Submitting...' : 'Submit Angkas Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Requests;

