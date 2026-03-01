import { useState, useEffect, useRef } from 'react';
import geohash from 'ngeohash';
import { shouldRefreshMap } from '@/lib/MapConfiguration';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationState {
  coords: Coordinates | null;
  geohash7: string | null;
  error: string | null;
  loading: boolean;
}

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    coords: null,
    geohash7: null,
    error: null,
    loading: true,
  });

  // Keep track of the last emitted coordinates for throttling
  const lastCoordsRef = useRef<Coordinates | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      const timeout = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          error: 'Geolocation is not supported by your browser',
          loading: false,
        }));
      }, 0);
      return () => clearTimeout(timeout);
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      // Throttling: Return early if displacement is less than threshold
      if (lastCoordsRef.current && !shouldRefreshMap(coords, lastCoordsRef.current)) {
        return;
      }
      lastCoordsRef.current = coords;

      setState({
        coords,
        geohash7: geohash.encode(coords.latitude, coords.longitude, 7),
        error: null,
        loading: false,
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      setState((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    };

    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return state;
}

export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // Earth radius in meters
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) *
      Math.cos(toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
