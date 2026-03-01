export const MapConfiguration = {
  // Cloud-based Map Styling ID for both Web & Android
  MAP_ID: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "PLOOOP_MAIN_MAP",
  
  // Throttle values
  MIN_DISPLACEMENT_METERS: 20, // Only refresh map or APIs if moved more than 20 meters
  
  // Geohash configurations
  GEOHASH_PRECISION: 5, // For querying areas
  CACHE_GEOHASH_PRECISION: 7, // 7-character geohash for cache partitioning
  
  // Helper to construct Static Map URL (Cost-optimization pattern)
  getStaticMapUrl: (lat: number, lng: number, zoom: number = 15, size: string = "400x200") => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return "";
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${size}&map_id=${MapConfiguration.MAP_ID}&markers=color:0x38BDF8%7C${lat},${lng}&key=${apiKey}`;
  }
};

/**
 * Returns true if the user has moved beyond the minimum displacement threshold (e.g., 20 meters)
 * compared to the old location.
 */
export function shouldRefreshMap(
  newLocation: { latitude: number; longitude: number }, 
  oldLocation: { latitude: number; longitude: number } | null
): boolean {
  if (!oldLocation) return true;

  // Haversine formula to calculate distance in meters
  const R = 6371e3; // Earth radius in meters
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  
  const dLat = toRadians(newLocation.latitude - oldLocation.latitude);
  const dLon = toRadians(newLocation.longitude - oldLocation.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(oldLocation.latitude)) *
      Math.cos(toRadians(newLocation.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance >= MapConfiguration.MIN_DISPLACEMENT_METERS;
}
