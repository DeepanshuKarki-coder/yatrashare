import { IMapService, PlaceSuggestion, RouteInfo } from './maps.interface';
import { calculateHaversineDistanceKm, estimateDurationMinutes } from '../../utils/geo';
import { logger } from '../../config/logger';

export class OpenStreetMapService implements IMapService {
  readonly name = 'OSM';

  // Well-known Indian hubs fallback cache for instant offline autocomplete
  private fallbackPlaces: PlaceSuggestion[] = [
    { placeId: 'blr_1', name: 'Bengaluru, Karnataka', address: 'Bengaluru, Karnataka, India', lat: 12.9716, lng: 77.5946 },
    { placeId: 'mys_1', name: 'Mysuru, Karnataka', address: 'Mysuru, Karnataka, India', lat: 12.2958, lng: 76.6394 },
    { placeId: 'bom_1', name: 'Mumbai, Maharashtra', address: 'Mumbai, Maharashtra, India', lat: 19.0760, lng: 72.8777 },
    { placeId: 'pnq_1', name: 'Pune, Maharashtra', address: 'Pune, Maharashtra, India', lat: 18.5204, lng: 73.8567 },
    { placeId: 'del_1', name: 'New Delhi, Delhi', address: 'New Delhi, Delhi, India', lat: 28.6139, lng: 77.2090 },
    { placeId: 'hyd_1', name: 'Hyderabad, Telangana', address: 'Hyderabad, Telangana, India', lat: 17.3850, lng: 78.4867 },
    { placeId: 'maa_1', name: 'Chennai, Tamil Nadu', address: 'Chennai, Tamil Nadu, India', lat: 13.0827, lng: 80.2707 },
    { placeId: 'amd_1', name: 'Ahmedabad, Gujarat', address: 'Ahmedabad, Gujarat, India', lat: 23.0225, lng: 72.5714 },
    { placeId: 'ccu_1', name: 'Kolkata, West Bengal', address: 'Kolkata, West Bengal, India', lat: 22.5726, lng: 88.3639 },
    { placeId: 'jpr_1', name: 'Jaipur, Rajasthan', address: 'Jaipur, Rajasthan, India', lat: 26.9124, lng: 75.7873 },
  ];

  async searchPlaces(query: string): Promise<PlaceSuggestion[]> {
    if (!query || query.trim().length < 2) return [];

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=in`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'YatraShare-RideSharing-App/1.0' },
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data: any = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((item: any) => ({
            placeId: String(item.place_id),
            name: item.name || item.display_name.split(',')[0],
            address: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }));
        }
      }
    } catch (err) {
      logger.debug('OSM Nominatim search timed out or failed, falling back to local dataset');
    }

    // Fallback to substring matching on static places
    const qLower = query.toLowerCase();
    return this.fallbackPlaces.filter(
      (p) => p.name.toLowerCase().includes(qLower) || p.address.toLowerCase().includes(qLower)
    );
  }

  async geocode(address: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
    const places = await this.searchPlaces(address);
    if (places.length > 0) {
      return { lat: places[0].lat, lng: places[0].lng, displayName: places[0].address };
    }
    return null;
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'YatraShare-RideSharing-App/1.0' },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data: any = await res.json();
        return data.display_name || null;
      }
    } catch (err) {
      logger.debug('OSM reverse geocode timed out');
    }
    return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }

  async calculateRoute(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<RouteInfo> {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=simplified`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });

      if (res.ok) {
        const data: any = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          return {
            distanceKm: Math.round((route.distance / 1000) * 10) / 10,
            durationMinutes: Math.round(route.duration / 60),
            polyline: route.geometry,
          };
        }
      }
    } catch (err) {
      logger.debug('OSRM routing request timed out, using Haversine calculation');
    }

    // Fallback formula calculation
    const distanceKm = calculateHaversineDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
    const durationMinutes = estimateDurationMinutes(distanceKm);
    return { distanceKm, durationMinutes };
  }
}

export const osmService = new OpenStreetMapService();
