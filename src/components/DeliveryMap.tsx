import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import RoutingMachine from './RoutingMachine';
import L from 'leaflet';
import { Locate } from 'lucide-react';

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

// Custom restaurant icon (store)
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
  ">🏪</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

// Custom package icon for Padala
const packageIcon = L.divIcon({
  className: 'custom-package-marker',
  html: `<div style="
    background-color: #f97316;
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
  ">📦</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

// Custom hub icon (Delivery Center)
const hubIcon = L.divIcon({
  className: 'custom-hub-marker',
  html: `<div style="
    background-color: #fff;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 3px solid #f59e0b;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  ">
    <img src="/papa.jpg" alt="Center" style="width: 100%; height: 100%; object-fit: cover;" />
  </div>`,
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  popupAnchor: [0, -50]
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
  hubLocation?: { lat: number; lng: number };
  restaurantLocation: { lat: number; lng: number } | null;
  customerLocation: { lat: number; lng: number } | null;
  distance?: number | null;
  address?: string;
  onLocationSelect?: (lat: number, lng: number) => void;
  onRestaurantSelect?: (lat: number, lng: number) => void;
  restaurantName?: string;
  restaurantAddress?: string;
  markerType?: 'store' | 'package';
}

const MapBounds: React.FC<{
  restaurantLocation?: { lat: number; lng: number };
  customerLocation?: { lat: number; lng: number };
  hubLocation?: { lat: number; lng: number };
}> = ({ restaurantLocation, customerLocation, hubLocation }) => {
  const map = useMap();

  useEffect(() => {
    const locations = [];
    if (hubLocation) locations.push([hubLocation.lat, hubLocation.lng]);
    if (restaurantLocation) locations.push([restaurantLocation.lat, restaurantLocation.lng]);
    if (customerLocation) locations.push([customerLocation.lat, customerLocation.lng]);

    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => loc as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [restaurantLocation, customerLocation, hubLocation, map]);

  return null;
};

// Component to handle "Locate Me" functionality
const LocateControl = () => {
    const map = useMap();
    
    const handleLocate = () => {
        map.locate({ setView: true, maxZoom: 16 });
    };

    return (
        <div className="leaflet-bottom leaflet-right mb-20 mr-2 z-[1000]">
            <div className="leaflet-control leaflet-bar">
                <button 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLocate();
                    }}
                    className="bg-white w-[30px] h-[30px] flex items-center justify-center cursor-pointer hover:bg-gray-100 border-none rounded-sm shadow-sm"
                    title="Locate Me"
                >
                    <Locate className="h-5 w-5 text-gray-700" />
                </button>
            </div>
        </div>
    );
};

const DeliveryMap: React.FC<DeliveryMapProps> = ({ 
  hubLocation,
  restaurantLocation, 
  customerLocation, 
  distance, 
  address,
  onLocationSelect,
  onRestaurantSelect,
  restaurantName = "Papa G's Delivery",
  restaurantAddress = "Floridablanca, Pampanga",
  markerType = 'store'
}) => {

  // Select the appropriate icon based on markerType
  const pickupIcon = markerType === 'package' ? packageIcon : restaurantIcon;


  return (
    <div className="h-[300px] sm:h-[400px] lg:h-[500px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 relative z-0">
      <MapContainer 
        center={hubLocation ? [hubLocation.lat, hubLocation.lng] : (restaurantLocation ? [restaurantLocation.lat, restaurantLocation.lng] : [14.9666, 120.5055])} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false} // Disable default zoom control to move it
      >
        {/* Default OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Custom Zoom Control at Bottom Right */}
        <ZoomControl position="bottomright" />
        
        <LocateControl />

        <MapBounds 
          hubLocation={hubLocation}
          restaurantLocation={restaurantLocation || undefined} 
          customerLocation={customerLocation || undefined} 
        />

        {/* Route Line (Hub -> Pickup) - Orange Dashed */}
        {hubLocation && restaurantLocation && (
          <RoutingMachine 
            restaurantLocation={hubLocation} 
            customerLocation={restaurantLocation}
            lineOptions={{
              styles: [{ color: '#f59e0b', opacity: 0.6, weight: 5, dashArray: '10, 10' }],
              extendToWaypoints: true,
              missingRouteTolerance: 0
            }}
          />
        )}

        {/* Route Line (Pickup -> Customer) - Green Solid */}
        {customerLocation && restaurantLocation && (
          <RoutingMachine 
            restaurantLocation={restaurantLocation} 
            customerLocation={customerLocation} 
          />
        )}

        {/* Hub Marker */}
        {hubLocation && (
          <Marker 
            position={[hubLocation.lat, hubLocation.lng]} 
            icon={hubIcon}
          >
            <Popup className="custom-popup">
              <div className="text-center p-1">
                <p className="font-semibold text-orange-600 text-sm">🏢 Delivery Center</p>
                <p className="text-xs text-gray-600 mt-1">Floridablanca Municipal Hall</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Restaurant/Pickup Marker */}
        {restaurantLocation && (
          <Marker 
            position={[restaurantLocation.lat, restaurantLocation.lng]} 
            icon={pickupIcon}
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
            <Popup className="custom-popup">
              <div className="text-center p-1">
                <p className="font-semibold text-green-600 text-sm">🏪 {restaurantName}</p>
                <p className="text-xs text-gray-600 mt-1">{restaurantAddress}</p>
                {onRestaurantSelect && <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">(Drag to move)</p>}
              </div>
            </Popup>
          </Marker>
        )}

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
            <Popup className="custom-popup">
              <div className="text-center p-1">
                <p className="font-semibold text-blue-600 text-sm">📍 Delivery Address</p>
                {address && <p className="text-xs text-gray-600 mt-1">{address}</p>}
                {distance && (
                  <p className="text-xs font-bold text-gray-800 mt-1 bg-gray-100 py-1 px-2 rounded-full inline-block">
                    {distance.toFixed(1)} km
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

