import React from 'react';
import { useSiteSettings } from '../hooks/useSiteSettings';

interface ServiceSelectionProps {
  onServiceSelect: (service: 'food' | 'pabili' | 'padala' | 'requests') => void;
}

const ServiceSelection: React.FC<ServiceSelectionProps> = ({ onServiceSelect }) => {
  const { siteSettings, loading } = useSiteSettings();

  const allServices = [
    {
      id: 'food' as const,
      name: 'Food',
      icon: '🍔',
      description: 'Order from restaurants',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
      iconColor: 'text-orange-600',
      settingKey: 'service_food_visible' as const,
    },
    {
      id: 'pabili' as const,
      name: 'Pabili',
      icon: '🛒',
      description: 'Grocery / Pabili service',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      iconColor: 'text-blue-600',
      settingKey: 'service_pabili_visible' as const,
    },
    {
      id: 'padala' as const,
      name: 'Padala',
      icon: '📦',
      description: 'Send packages',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
      iconColor: 'text-purple-600',
      settingKey: 'service_padala_visible' as const,
    },
  ];

  // Filter services based on admin visibility settings
  const services = siteSettings
    ? allServices.filter(service => siteSettings[service.settingKey] !== false)
    : allServices;

  const handleServiceClick = (serviceId: 'food' | 'pabili' | 'padala') => {
    onServiceSelect(serviceId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(117,117,117)] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            Hello there! <span className="text-4xl">👋</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-lg mx-auto">
            What can we do for you today? Choose a service below to get started.
          </p>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500">No services are currently available.</p>
            <p className="text-sm text-gray-400 mt-2">Please check back later.</p>
          </div>
        ) : (
          /* Services Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceClick(service.id)}
                className={`group relative overflow-hidden bg-white border border-gray-100 rounded-2xl p-8 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-delivery-primary/20 w-full text-left`}
              >
                {/* Background accent block inside button */}
                <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full transition-transform duration-500 group-hover:scale-150 opacity-20 ${service.color.split(' ')[0]}`} />
                
                <div className="relative z-10">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-sm transition-transform duration-300 group-hover:scale-110 ${service.color.split(' ')[0]}`}>
                    <span className="text-5xl">{service.icon}</span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {service.name}
                  </h2>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceSelection;