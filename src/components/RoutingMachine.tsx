import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

interface RoutingMachineProps {
  restaurantLocation: { lat: number; lng: number };
  customerLocation: { lat: number; lng: number };
}

const RoutingMachine = ({ restaurantLocation, customerLocation }: RoutingMachineProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(restaurantLocation.lat, restaurantLocation.lng),
        L.latLng(customerLocation.lat, customerLocation.lng)
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      lineOptions: {
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
      map.removeControl(routingControl);
    };
  }, [map, restaurantLocation, customerLocation]);

  return null;
};

export default RoutingMachine;
