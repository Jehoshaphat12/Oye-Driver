import React, { useEffect, useRef, useCallback } from 'react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

interface MapViewProps {
  userLocation: { lat: number; lng: number } | null;
  pickup?: { latitude: number; longitude: number; address: string } | null;
  destination?: { latitude: number; longitude: number; address: string } | null;
  driverLocation?: { lat: number; lng: number };
  onRouteReady?: (distance: number, duration: number) => void;
  showRoute?: boolean;
  travelMode: "BICYCLING"
}

let mapsLoaded = false;
let mapsLoading = false;
const mapsCallbacks: (() => void)[] = [];

function loadGoogleMaps(callback: () => void) {
  if (mapsLoaded) { callback(); return; }
  mapsCallbacks.push(callback);
  if (mapsLoading) return;
  mapsLoading = true;
  window.initGoogleMaps = () => {
    mapsLoaded = true;
    mapsCallbacks.forEach((cb) => cb());
    mapsCallbacks.length = 0;
  };
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export default function MapView({
  userLocation,
  pickup,
  destination,
  driverLocation,
  onRouteReady,
  showRoute,
  travelMode,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const routeDrawnRef = useRef<string>('');

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const center = userLocation || { lat: 5.6037, lng: -0.187 };
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: false,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#f8f8f8' }] },
        { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
        { featureType: 'water', stylers: [{ color: '#dde8f0' }] },
        { featureType: 'landscape', stylers: [{ color: '#f2f4f0' }] },
      ],
      
    });
    directionsServiceRef.current = new window.google.maps.DirectionsService();
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#061ffa',
        strokeWeight: 4,
        strokeOpacity: 0.85,
      },
    });
    directionsRendererRef.current.setMap(mapInstanceRef.current);
  }, [userLocation]);

  useEffect(() => {
    loadGoogleMaps(() => {
      initMap();
    });
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;
    if (!pickup && !destination) {
      mapInstanceRef.current.panTo(userLocation);
    }
    if (!userMarkerRef.current) {
      userMarkerRef.current = new window.google.maps.Marker({
        position: userLocation,
        map: mapInstanceRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#061ffa',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2.5,
        },
        zIndex: 10,
      });
    } else {
      userMarkerRef.current.setPosition(userLocation);
    }
  }, [userLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (pickup) {
      const pos = { lat: pickup.latitude, lng: pickup.longitude };
      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = new window.google.maps.Marker({
          position: pos,
          map: mapInstanceRef.current,
          icon: createDotIcon('#061ffa', 'A'),
          zIndex: 20,
        });
      } else {
        pickupMarkerRef.current.setPosition(pos);
      }
    } else {
      pickupMarkerRef.current?.setMap(null);
      pickupMarkerRef.current = null;
    }
  }, [pickup]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (destination) {
      const pos = { lat: destination.latitude, lng: destination.longitude };
      if (!destMarkerRef.current) {
        destMarkerRef.current = new window.google.maps.Marker({
          position: pos,
          map: mapInstanceRef.current,
          icon: createDotIcon('#ff7300', 'B'),
          zIndex: 20,
        });
      } else {
        destMarkerRef.current.setPosition(pos);
      }
    } else {
      destMarkerRef.current?.setMap(null);
      destMarkerRef.current = null;
    }
  }, [destination]);

  // Draw route
  useEffect(() => {
    if (!mapInstanceRef.current || !directionsServiceRef.current || !showRoute || !pickup || !destination) {
      if (!showRoute && directionsRendererRef.current) {
        directionsRendererRef.current.setDirections({ routes: [] });
      }
      return;
    }
    const routeKey = `${pickup.latitude},${pickup.longitude}-${destination.latitude},${destination.longitude}`;
    if (routeKey === routeDrawnRef.current) return;
    routeDrawnRef.current = routeKey;

    directionsServiceRef.current.route(
      {
        origin: { lat: pickup.latitude, lng: pickup.longitude },
        destination: { lat: destination.latitude, lng: destination.longitude },
        travelMode: window.google.maps.TravelMode.WALKING,
      },
      (result: any, status: any) => {
        if (status === 'OK') {
          directionsRendererRef.current.setDirections(result);
          const leg = result.routes[0].legs[0];
          const distanceKm = leg.distance.value / 1000;
          const durationMin = leg.duration.value / 60;
          onRouteReady?.(distanceKm, durationMin);

          // Fit bounds
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend({ lat: pickup.latitude, lng: pickup.longitude });
          bounds.extend({ lat: destination.latitude, lng: destination.longitude });
          mapInstanceRef.current.fitBounds(bounds, { top: 100, bottom: 350, left: 40, right: 40 });
        }
      },
    );
  }, [pickup, destination, showRoute]);

  // Driver marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (driverLocation) {
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = new window.google.maps.Marker({
          position: driverLocation,
          map: mapInstanceRef.current,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="19" fill="#ff7300" stroke="white" stroke-width="2.5"/>
                <g transform="translate(9,12)" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none">
                  <circle cx="4.5" cy="12" r="3"/>
                  <circle cx="19.5" cy="12" r="3"/>
                  <path d="M16 4h2l3 5"/>
                  <path d="M9 4l1.5 3H5L4 9c-.5 1 .5 2 1.5 2h1"/>
                  <path d="M9 4h7"/>
                  <path d="M12 4l3 5H9"/>
                  <path d="M16 9h3"/>
                </g>
              </svg>`),
            scaledSize: { width: 42, height: 42 },
            anchor: { x: 21, y: 21 },
          },
          zIndex: 30,
        });
      } else {
        driverMarkerRef.current.setPosition(driverLocation);
      }
    } else {
      driverMarkerRef.current?.setMap(null);
      driverMarkerRef.current = null;
    }
  }, [driverLocation]);

  return (
    <div ref={mapRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
  );
}

function createDotIcon(color: string, label: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2.5"/>
      <text x="16" y="21" text-anchor="middle" fill="white" font-size="13" font-weight="bold" font-family="Arial">${label}</text>
      <line x1="16" y1="30" x2="16" y2="40" stroke="${color}" stroke-width="2.5"/>
    </svg>`;
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: { width: 32, height: 40 },
    anchor: { x: 16, y: 40 },
  };
}
