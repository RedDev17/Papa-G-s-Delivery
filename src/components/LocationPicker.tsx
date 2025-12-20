import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useOpenStreetMap } from '../hooks/useOpenStreetMap';

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

interface LocationPickerProps {
  onLocationSelect: (address: string, lat: number, lng: number) => void;
  initialLocation?: { lat: number; lng: number };
  initialAddress?: string;
}

// Component to handle map clicks and dragging
const LocationMarker = ({ 
  position, 
  setPosition, 
  onLocationSelect 
}: { 
  position: L.LatLng | null, 
  setPosition: (pos: L.LatLng) => void,
  onLocationSelect: (address: string, lat: number, lng: number) => void
}) => {
  const { reverseGeocode } = useOpenStreetMap();
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      handleLocationSelect(e.latlng);
    },
  });

  const handleLocationSelect = async (latlng: L.LatLng) => {
    const address = await reverseGeocode(latlng.lat, latlng.lng);
    if (address) {
      onLocationSelect(address, latlng.lat, latlng.lng);
    } else {
      onLocationSelect(`${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`, latlng.lat, latlng.lng);
    }
  };

  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const latlng = marker.getLatLng();
        setPosition(latlng);
        handleLocationSelect(latlng);
      }
    },
  };

  return position === null ? null : (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={eventHandlers}
      ref={markerRef}
    />
  );
};

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

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, initialLocation }) => {
  // Default to Tagbilaran City if no initial location
  const defaultCenter = { lat: 9.6445, lng: 123.8550 };
  const [position, setPosition] = useState<L.LatLng | null>(
    initialLocation ? new L.LatLng(initialLocation.lat, initialLocation.lng) : new L.LatLng(defaultCenter.lat, defaultCenter.lng)
  );

  useEffect(() => {
    // Try to get user's current location if no initial location provided
    if (!initialLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition(new L.LatLng(latitude, longitude));
        },
        (err) => {
          console.error("Error getting location:", err);
        }
      );
    }
  }, [initialLocation]);

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-300 relative">
      <MapContainer
        center={position || [defaultCenter.lat, defaultCenter.lng]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapFixer />
        <LocationMarker 
          position={position} 
          setPosition={setPosition} 
          onLocationSelect={onLocationSelect} 
        />
      </MapContainer>
      <div className="absolute top-2 right-2 z-[1000] bg-white p-2 rounded shadow-md text-xs text-gray-600">
        Click map or drag marker to pin location
      </div>
    </div>
  );
};

export default LocationPicker;
