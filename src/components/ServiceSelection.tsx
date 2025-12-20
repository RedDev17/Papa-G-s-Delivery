import React from 'react';

interface ServiceSelectionProps {
  onServiceSelect: (service: 'food' | 'pabili' | 'padala' | 'requests') => void;
}

const ServiceSelection: React.FC<ServiceSelectionProps> = ({ onServiceSelect }) => {
  const services = [
    {
      id: 'food' as const,
      name: 'Food',
      icon: '🍔',
      description: 'Order from restaurants',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
      iconColor: 'text-orange-600'
    },
    {
      id: 'pabili' as const,
      name: 'Pabili',
      icon: '🛒',
      description: 'Grocery / Pabili service',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      iconColor: 'text-blue-600'
    },
    {
      id: 'padala' as const,
      name: 'Padala',
      icon: '📦',
      description: 'Padala',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
      iconColor: 'text-purple-600'
    },
  ];

  const handleServiceClick = (serviceId: 'food' | 'pabili' | 'padala') => {
    onServiceSelect(serviceId);
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with gray background */}
        <div className="bg-[rgb(117,117,117)] text-white py-6 px-6 rounded-t-xl mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center">
            Select service
          </h1>
        </div>

        {/* Services Grid - 2 columns with last item centered */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-md mx-auto">
          {services.map((service, index) => (
            <div
              key={service.id}
              className={index === services.length - 1 && services.length % 2 !== 0 ? "col-span-2 flex justify-center" : ""}
            >
              <button
                onClick={() => handleServiceClick(service.id)}
                className="bg-white border-2 border-[rgb(117,117,117)] rounded-xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:border-delivery-primary focus:outline-none focus:ring-2 focus:ring-delivery-primary focus:ring-offset-2 w-full max-w-[200px]"
              >
                <div className="text-center">
                  <div className="text-6xl md:text-7xl mb-3">{service.icon}</div>
                  <h2 className="text-lg md:text-xl font-semibold text-[rgb(117,117,117)]">
                    {service.name}
                  </h2>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServiceSelection;