import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import RoutingMachine from './RoutingMachine';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom restaurant icon
const restaurantIcon = L.divIcon({
  className: 'custom-restaurant-marker',
  html: `<div style="
    background-color: #22c55e;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
  ">🛵</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

// Custom customer icon
const customerIcon = L.divIcon({
  className: 'custom-customer-marker',
  html: `<div style="
    background-color: #3b82f6;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
  ">📍</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

interface DeliveryMapProps {
  restaurantLocation: { lat: number; lng: number };
  customerLocation: { lat: number; lng: number } | null;
  distance?: number | null;
  address?: string;
  onLocationSelect?: (lat: number, lng: number) => void;
  restaurantName?: string;
  restaurantAddress?: string;
}

// Component to fix map rendering issues
function MapFixer() {
  const map = useMap();
  useEffect(() => {
    // Immediate fix
    map.invalidateSize();

    // Fix after short delay
    const timeout1 = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Fix after longer delay (animation completion)
    const timeout2 = setTimeout(() => {
      map.invalidateSize();
    }, 500);

    // Resize observer to handle container resizing
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    
    const container = map.getContainer();
    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      resizeObserver.disconnect();
    };
  }, [map]);
  return null;
}

// Component to fit map bounds to show both markers
function MapBounds({ restaurantLocation, customerLocation }: { restaurantLocation: { lat: number; lng: number }; customerLocation: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (customerLocation) {
      const bounds = L.latLngBounds(
        [restaurantLocation.lat, restaurantLocation.lng],
        [customerLocation.lat, customerLocation.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([restaurantLocation.lat, restaurantLocation.lng], 13);
    }
  }, [map, restaurantLocation, customerLocation]);

  return null;
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({
  restaurantLocation,
  customerLocation,
  distance,
  address,
  onLocationSelect,
  restaurantName = "Papa G's Delivery",
  restaurantAddress = "Floridablanca, Pampanga"
}) => {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // Only render map on client side
    if (typeof window !== 'undefined') {
      setMapReady(true);
    }
  }, []);

  if (!mapReady || typeof window === 'undefined') {
    return (
      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  const center = customerLocation 
    ? [(restaurantLocation.lat + customerLocation.lat) / 2, (restaurantLocation.lng + customerLocation.lng) / 2]
    : [restaurantLocation.lat, restaurantLocation.lng];

  const path: [number, number][] = customerLocation
    ? [[restaurantLocation.lat, restaurantLocation.lng], [customerLocation.lat, customerLocation.lng]]
    : [];

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border-2 border-gray-300 shadow-lg">
      <MapContainer
        center={center as [number, number]}
        zoom={customerLocation ? 12 : 13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapFixer />
        <MapBounds restaurantLocation={restaurantLocation} customerLocation={customerLocation} />

        {/* Restaurant Marker */}
        <Marker position={[restaurantLocation.lat, restaurantLocation.lng]} icon={restaurantIcon}>
          <Popup>
            <div className="text-center">
              <p className="font-semibold text-green-600">🛵 {restaurantName}</p>
              <p className="text-xs text-gray-600 mt-1">{restaurantAddress}</p>
            </div>
          </Popup>
        </Marker>

        {/* Customer Marker */}
        {customerLocation && (
          <>
            <Marker 
              position={[customerLocation.lat, customerLocation.lng]} 
              icon={customerIcon}
              draggable={!!onLocationSelect}
              eventHandlers={{
                dragend: (e) => {
                  if (onLocationSelect) {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    onLocationSelect(position.lat, position.lng);
                  }
                }
              }}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold text-blue-600">📍 Delivery Address</p>
                  {address && <p className="text-xs text-gray-600 mt-1">{address}</p>}
                  {distance && (
                    <p className="text-xs font-semibold text-gray-800 mt-1">
                      Distance: {distance.toFixed(1)} km
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>

            {/* Route line connecting restaurant and customer */}
            {/* Route line connecting restaurant and customer */}
            <RoutingMachine 
              restaurantLocation={restaurantLocation} 
              customerLocation={customerLocation} 
            />
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default React.memo(DeliveryMap);

