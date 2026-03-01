"use client";

import React, { useEffect, useState } from 'react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, MapMouseEvent, Pin } from '@vis.gl/react-google-maps';
import { Coordinates, Drop } from '@/types';
import { Navigation, MapPin, Maximize, Minimize, Layers } from 'lucide-react';
import { MapConfiguration } from '@/lib/MapConfiguration';

interface MapRadarProps {
  userLocation: Coordinates | null;
  selectedLocation: Coordinates | null;
  onLocationSelect: (coords: Coordinates) => void;
  drops?: Drop[];
  onDropClick?: (drop: Drop) => void;
}

const MapRadar = React.memo(function MapRadar({ userLocation, selectedLocation, onLocationSelect, drops = [], onDropClick }: MapRadarProps) {
  const [apiKey, setApiKey] = useState<string | undefined>(undefined);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapTypeId, setMapTypeId] = useState<string>('roadmap');

  useEffect(() => {
    setApiKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  }, []);

  // When userLocation is first discovered, center the map on it
  useEffect(() => {
    if (userLocation && !mapCenter) {
      setMapCenter({ lat: userLocation.latitude, lng: userLocation.longitude });
    }
  }, [userLocation, mapCenter]);

  if (!apiKey) {
    return (
      <div className="w-full h-full min-h-[400px] bg-background border-2 border-dashed border-primary/30 rounded-[2rem] flex flex-col items-center justify-center text-primary p-6 text-center">
        <Navigation className="h-10 w-10 mb-4 animate-pulse" strokeWidth={2.5} />
        <h3 className="font-bold text-lg mb-2">Radar Offline</h3>
        <p className="text-sm font-medium text-foreground/50 max-w-xs">
          Missing Google Maps API Key. Please insert it in your .env.local file to initialize the tracking map.
        </p>
      </div>
    );
  }

  const handleMapClick = (e: MapMouseEvent) => {
    if (e.detail.latLng) {
      onLocationSelect({
        latitude: e.detail.latLng.lat,
        longitude: e.detail.latLng.lng,
      });
    }
  };

  const defaultCenter = { lat: -6.2088, lng: 106.8456 }; // Jakarta fallback

  const toggleMapType = () => {
    setMapTypeId((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'));
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Determine container classes based on full screen state
  const containerClasses = isFullscreen
    ? "fixed inset-0 z-[100] bg-background" // Full screen layout overriding parent padding
    : "w-full h-[60vh] min-h-[500px] rounded-[2rem] overflow-hidden shadow-[0_10px_40px_rgb(56,189,248,0.15)] border-4 border-white relative z-0 mt-4 group";

  return (
    <div className={containerClasses}>
      <APIProvider apiKey={apiKey}>
        <GoogleMap
          defaultZoom={16}
          defaultCenter={defaultCenter}
          center={mapCenter}
          onCameraChanged={(ev) => setMapCenter(ev.detail.center)} // Keep track of manual dragging so we don't snap back improperly
          onClick={handleMapClick}
          mapId={MapConfiguration.MAP_ID}
          disableDefaultUI={true}
          gestureHandling="greedy" // Allows zooming and panning easily
          mapTypeId={mapTypeId}
        >
          {/* Render the User's Current Location with a playful ripple */}
          {userLocation && (
            <AdvancedMarker position={{ lat: userLocation.latitude, lng: userLocation.longitude }}>
              <div className="relative flex items-center justify-center pointer-events-none">
                <div className="absolute h-16 w-16 bg-primary/30 rounded-full animate-ripple pointer-events-none"></div>
                <div className="relative bg-surface p-2 rounded-full shadow-lg border-2 border-primary">
                  <div className="bg-primary h-3 w-3 rounded-full"></div>
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Render the Custom Selected Drop Location */}
          {selectedLocation && (
            <AdvancedMarker position={{ lat: selectedLocation.latitude, lng: selectedLocation.longitude }}>
              <div className="flex flex-col items-center animate-bounce origin-bottom drop-shadow-xl text-accent">
                <MapPin className="h-10 w-10 fill-accent/20" strokeWidth={2.5} />
              </div>
            </AdvancedMarker>
          )}

          {/* Render all surrounding Drops from Firestore */}
          {drops.map((drop) => (
            <AdvancedMarker 
              key={drop.drop_id} 
              position={{ lat: drop.latitude, lng: drop.longitude }}
              onClick={() => onDropClick && onDropClick(drop)}
            >
              <Pin 
                background={drop.is_guest_post ? '#FACC15' : '#38BDF8'} // Yellow for guest, Blue for members
                borderColor={'#FFFFFF'} 
                glyphColor={'#FFFFFF'} 
                scale={1.2}
              />
            </AdvancedMarker>
          ))}
        </GoogleMap>
      </APIProvider>
      
      {/* Map Control Buttons (Absolute Overlay) */}
      <div className="absolute top-6 right-6 flex flex-col gap-3 z-10">
        <button
          onClick={toggleFullscreen}
          className="bg-surface p-3 rounded-xl shadow-lg border border-foreground/10 text-foreground hover:bg-primary hover:text-white transition-all duration-300 ease-out hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize className="h-5 w-5" strokeWidth={2.5} /> : <Maximize className="h-5 w-5" strokeWidth={2.5} />}
        </button>
        
        <button
          onClick={toggleMapType}
          className={`p-3 rounded-xl shadow-lg border border-foreground/10 transition-all duration-300 ease-out hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center ${mapTypeId === 'hybrid' ? 'bg-primary text-white' : 'bg-surface text-foreground hover:bg-primary hover:text-white'}`}
          title="Toggle Real-World Map"
        >
          <Layers className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Recenter button mapping back to user location */}
      {userLocation && (
        <button
          onClick={() => setMapCenter({ lat: userLocation.latitude, lng: userLocation.longitude })}
          className={`absolute bottom-6 right-6 ${isFullscreen ? 'mb-10 mr-4' : ''} bg-surface p-4 rounded-full shadow-xl border border-foreground/10 text-primary hover:bg-primary hover:text-white transition-all duration-300 ease-out hover:scale-110 active:scale-95 z-10 cursor-pointer flex items-center justify-center`}
          title="Recenter Map"
        >
          <Navigation className="h-6 w-6" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
});

export default MapRadar;
