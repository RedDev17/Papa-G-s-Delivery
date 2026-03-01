import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

interface RoutingMachineProps {
  restaurantLocation: { lat: number; lng: number };
  customerLocation: { lat: number; lng: number };
  lineOptions?: Record<string, unknown>; // Allow custom line options
}

const RoutingMachine = ({ restaurantLocation, customerLocation, lineOptions }: RoutingMachineProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const routingControl = (L as any).Routing.control({
      waypoints: [
        L.latLng(restaurantLocation.lat, restaurantLocation.lng),
        L.latLng(customerLocation.lat, customerLocation.lng)
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      lineOptions: lineOptions || {
        styles: [{ color: '#22c55e', opacity: 0.8, weight: 6 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      createMarker: () => null, // Don't create default markers, we use our own
      containerClassName: 'hidden', // Hide the instructions panel
      show: false // Hide the instructions panel
    }).addTo(map);

    // Hide the routing container explicitly via CSS if the option doesn't work
    const container = routingControl.getContainer();
    if (container) {
      container.style.display = 'none';
    }

    return () => {
      try {
        if (map && routingControl) { 
            // Safe removal
            map.removeControl(routingControl);
            
            // Manually clear layers if they persist (sometimes needed for LRM)
            // But usually removeControl is enough. The error 'removeLayer' of null suggests 
            // LRM internal events firing after removal.
            // We can mute errors or ensure we don't double remove.
        }
      } catch (e) {
        // Ignore removal errors as they are likely due to map/layer already being destroyed
        console.warn('Error removing routing control:', e);
      }
    };
  }, [map, restaurantLocation, customerLocation, lineOptions]);

  return null;
};

export default RoutingMachine;
