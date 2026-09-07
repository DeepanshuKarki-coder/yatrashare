export interface PlaceSuggestion {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface RouteInfo {
  distanceKm: number;
  durationMinutes: number;
  polyline?: string;
}

export interface IMapService {
  name: 'OSM' | 'GOOGLE' | 'MAPBOX';
  searchPlaces(query: string): Promise<PlaceSuggestion[]>;
  geocode(address: string): Promise<{ lat: number; lng: number; displayName: string } | null>;
  reverseGeocode(lat: number, lng: number): Promise<string | null>;
  calculateRoute(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<RouteInfo>;
}
