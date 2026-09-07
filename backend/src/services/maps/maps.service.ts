import { IMapService } from './maps.interface';
import { osmService } from './osm.service';
import { env } from '../../config/env';

export class MapsService {
  private provider: IMapService;

  constructor() {
    // Default to OSM. Google/Mapbox can be plugged in when respective keys are configured
    this.provider = osmService;
  }

  getProvider(): IMapService {
    return this.provider;
  }

  async searchPlaces(query: string) {
    return this.provider.searchPlaces(query);
  }

  async calculateRoute(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) {
    return this.provider.calculateRoute(origin, destination);
  }

  async geocode(address: string) {
    return this.provider.geocode(address);
  }

  async reverseGeocode(lat: number, lng: number) {
    return this.provider.reverseGeocode(lat, lng);
  }
}

export const mapsService = new MapsService();
