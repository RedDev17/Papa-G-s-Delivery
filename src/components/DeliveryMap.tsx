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
  onRestaurantSelect?: (lat: number, lng: number) => void;
  restaurantName?: string;
  restaurantAddress?: string;
}

const MapBounds: React.FC<{
  restaurantLocation: { lat: number; lng: number };
  customerLocation?: { lat: number; lng: number };
}> = ({ restaurantLocation, customerLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (customerLocation) {
      const bounds = L.latLngBounds(
        [restaurantLocation.lat, restaurantLocation.lng],
        [customerLocation.lat, customerLocation.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([restaurantLocation.lat, restaurantLocation.lng], 15);
    }
  }, [restaurantLocation, customerLocation, map]);

  return null;
};



const DeliveryMap: React.FC<DeliveryMapProps> = ({ 
  restaurantLocation, 
  customerLocation, 
  distance, 
  address,
  onLocationSelect,
  onRestaurantSelect,
  restaurantName = "Papa G's Delivery",
  restaurantAddress = "Floridablanca, Pampanga"
}) => {


  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden shadow-md border border-gray-200 relative z-0">
      <MapContainer 
        center={[restaurantLocation.lat, restaurantLocation.lng]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBounds restaurantLocation={restaurantLocation} customerLocation={customerLocation || undefined} />

        {/* Route Line */}
        {customerLocation && (
          <RoutingMachine 
            restaurantLocation={restaurantLocation} 
            customerLocation={customerLocation} 
          />
        )}

        {/* Restaurant Marker */}
        <Marker 
          position={[restaurantLocation.lat, restaurantLocation.lng]} 
          icon={restaurantIcon}
          draggable={!!onRestaurantSelect}
          eventHandlers={{
            dragend: (e) => {
              if (onRestaurantSelect) {
                const marker = e.target;
                const position = marker.getLatLng();
                onRestaurantSelect(position.lat, position.lng);
              }
            }
          }}
        >
          <Popup>
            <div className="text-center">
              <p className="font-semibold text-green-600">🛵 {restaurantName}</p>
              <p className="text-xs text-gray-600 mt-1">{restaurantAddress}</p>
              {onRestaurantSelect && <p className="text-xs text-gray-500 mt-1">(Drag to move)</p>}
            </div>
          </Popup>
        </Marker>

        {/* Customer Marker */}
        {customerLocation && (
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
        )}
      </MapContainer>
    </div>
  );
};

export default React.memo(DeliveryMap);

