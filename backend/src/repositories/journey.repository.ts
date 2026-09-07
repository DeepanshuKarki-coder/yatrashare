import { db, DatabaseClient } from '../models/db';
import { JourneyStatus, LuggagePolicy, VehicleType } from '@yatrashare/shared';
import { calculateHaversineDistanceKm } from '../utils/geo';

export interface JourneyRecord {
  id: string;
  driver_id: string;
  vehicle_id: string;
  origin_name: string;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  destination_name: string;
  destination_address: string;
  destination_lat: number;
  destination_lng: number;
  route_polyline?: string | null;
  distance_km: number;
  estimated_duration_min: number;
  departure_time: string;
  estimated_arrival_time: string;
  total_seats: number;
  available_seats: number;
  price_per_seat: number;
  currency: string;
  auto_accept: number;
  luggage_policy: LuggagePolicy;
  smoking_allowed: number;
  pets_allowed: number;
  music_allowed: number;
  ac_available: number;
  women_only: number;
  description?: string | null;
  status: JourneyStatus;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface WaypointRecord {
  id: string;
  journey_id: string;
  stop_order: number;
  place_name: string;
  address: string;
  lat: number;
  lng: number;
  estimated_time_offset_min: number;
  price_offset: number;
}

export interface JourneySearchParams {
  origin?: string;
  destination?: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  date?: string;
  seats?: number;
  minPrice?: number;
  maxPrice?: number;
  vehicleType?: VehicleType;
  acAvailable?: boolean;
  womenOnly?: boolean;
  smokingAllowed?: boolean;
  petsAllowed?: boolean;
  sortBy?: 'departureTime' | 'price' | 'duration' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class JourneyRepository {
  async findById(id: string, client?: DatabaseClient): Promise<JourneyRecord | null> {
    const runner = client || db;
    return runner.queryOne<JourneyRecord>('SELECT * FROM journeys WHERE id = $1', [id]);
  }

  async getWaypoints(journeyId: string, client?: DatabaseClient): Promise<WaypointRecord[]> {
    const runner = client || db;
    return runner.query<WaypointRecord>(
      'SELECT * FROM journey_waypoints WHERE journey_id = $1 ORDER BY stop_order ASC',
      [journeyId]
    );
  }

  async create(journey: Omit<JourneyRecord, 'version' | 'created_at' | 'updated_at'>, waypoints: Omit<WaypointRecord, 'journey_id'>[] = [], client?: DatabaseClient): Promise<JourneyRecord> {
    const runner = client || db;
    const now = new Date().toISOString();

    await runner.execute(
      `INSERT INTO journeys (
        id, driver_id, vehicle_id, origin_name, origin_address, origin_lat, origin_lng,
        destination_name, destination_address, destination_lat, destination_lng,
        route_polyline, distance_km, estimated_duration_min, departure_time, estimated_arrival_time,
        total_seats, available_seats, price_per_seat, currency, auto_accept,
        luggage_policy, smoking_allowed, pets_allowed, music_allowed, ac_available, women_only,
        description, status, version, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, 1, $30, $31)`,
      [
        journey.id, journey.driver_id, journey.vehicle_id, journey.origin_name, journey.origin_address,
        journey.origin_lat, journey.origin_lng, journey.destination_name, journey.destination_address,
        journey.destination_lat, journey.destination_lng, journey.route_polyline || null,
        journey.distance_km, journey.estimated_duration_min, journey.departure_time, journey.estimated_arrival_time,
        journey.total_seats, journey.available_seats, journey.price_per_seat, journey.currency, journey.auto_accept,
        journey.luggage_policy, journey.smoking_allowed, journey.pets_allowed, journey.music_allowed,
        journey.ac_available, journey.women_only, journey.description || null, journey.status, now, now
      ]
    );

    for (const wp of waypoints) {
      await runner.execute(
        `INSERT INTO journey_waypoints (id, journey_id, stop_order, place_name, address, lat, lng, estimated_time_offset_min, price_offset)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [wp.id, journey.id, wp.stop_order, wp.place_name, wp.address, wp.lat, wp.lng, wp.estimated_time_offset_min, wp.price_offset]
      );
    }

    const created = await this.findById(journey.id, runner);
    if (!created) throw new Error('Journey creation failed');
    return created;
  }

  /**
   * Concurrency-safe lock for update inside a transaction
   */
  async lockForUpdate(id: string, client: DatabaseClient): Promise<JourneyRecord | null> {
    return client.queryOne<JourneyRecord>(
      'SELECT * FROM journeys WHERE id = $1',
      [id]
    );
  }

  async updateSeats(id: string, newAvailableSeats: number, client: DatabaseClient): Promise<void> {
    const status = newAvailableSeats === 0 ? JourneyStatus.FULL : JourneyStatus.PUBLISHED;
    await client.execute(
      'UPDATE journeys SET available_seats = $1, status = $2, version = version + 1, updated_at = $3 WHERE id = $4',
      [newAvailableSeats, status, new Date().toISOString(), id]
    );
  }

  async updateStatus(id: string, status: JourneyStatus, client?: DatabaseClient): Promise<void> {
    const runner = client || db;
    await runner.execute(
      'UPDATE journeys SET status = $1, updated_at = $2 WHERE id = $3',
      [status, new Date().toISOString(), id]
    );
  }

  async findByDriverId(driverId: string): Promise<JourneyRecord[]> {
    return db.query<JourneyRecord>(
      'SELECT * FROM journeys WHERE driver_id = $1 ORDER BY departure_time DESC',
      [driverId]
    );
  }

  async searchJourneys(params: JourneySearchParams): Promise<{ items: any[]; total: number }> {
    let sql = `
      SELECT j.*,
             u.full_name as driver_name, u.avatar_url as driver_avatar, u.rating_average as driver_rating, u.rating_count as driver_reviews_count,
             v.make as vehicle_make, v.model as vehicle_model, v.color as vehicle_color, v.vehicle_type, v.amenities as vehicle_amenities
      FROM journeys j
      JOIN users u ON j.driver_id = u.id
      JOIN vehicles v ON j.vehicle_id = v.id
      WHERE j.status = 'PUBLISHED'
        AND j.departure_time > $1
        AND j.available_seats >= $2
    `;

    const nowIso = new Date().toISOString();
    const queryParams: any[] = [nowIso, params.seats || 1];

    if (params.date) {
      queryParams.push(`${params.date}%`);
      sql += ` AND j.departure_time LIKE $${queryParams.length}`;
    }

    if (params.minPrice !== undefined) {
      queryParams.push(params.minPrice);
      sql += ` AND j.price_per_seat >= $${queryParams.length}`;
    }

    if (params.maxPrice !== undefined) {
      queryParams.push(params.maxPrice);
      sql += ` AND j.price_per_seat <= $${queryParams.length}`;
    }

    if (params.vehicleType) {
      queryParams.push(params.vehicleType);
      sql += ` AND v.vehicle_type = $${queryParams.length}`;
    }

    if (params.acAvailable) {
      sql += ` AND j.ac_available = 1`;
    }

    if (params.womenOnly) {
      sql += ` AND j.women_only = 1`;
    }

    if (params.smokingAllowed !== undefined) {
      sql += ` AND j.smoking_allowed = ${params.smokingAllowed ? 1 : 0}`;
    }

    if (params.petsAllowed !== undefined) {
      sql += ` AND j.pets_allowed = ${params.petsAllowed ? 1 : 0}`;
    }

    if (params.origin) {
      queryParams.push(`%${params.origin.toLowerCase()}%`);
      sql += ` AND (LOWER(j.origin_name) LIKE $${queryParams.length} OR LOWER(j.origin_address) LIKE $${queryParams.length})`;
    }

    if (params.destination) {
      queryParams.push(`%${params.destination.toLowerCase()}%`);
      sql += ` AND (LOWER(j.destination_name) LIKE $${queryParams.length} OR LOWER(j.destination_address) LIKE $${queryParams.length})`;
    }

    const rows = await db.query<any>(sql, queryParams);

    // Apply Geospatial Distance Filtering if coordinates provided
    let filtered = rows;
    if (params.originLat && params.originLng) {
      filtered = filtered.filter((j) => {
        const dist = calculateHaversineDistanceKm(params.originLat!, params.originLng!, j.origin_lat, j.origin_lng);
        return dist <= 50; // within 50 km
      });
    }

    if (params.destinationLat && params.destinationLng) {
      filtered = filtered.filter((j) => {
        const dist = calculateHaversineDistanceKm(params.destinationLat!, params.destinationLng!, j.destination_lat, j.destination_lng);
        return dist <= 50; // within 50 km
      });
    }

    // Sorting
    const sortOrderFactor = params.sortOrder === 'desc' ? -1 : 1;
    filtered.sort((a, b) => {
      if (params.sortBy === 'price') {
        return (a.price_per_seat - b.price_per_seat) * sortOrderFactor;
      }
      if (params.sortBy === 'duration') {
        return (a.estimated_duration_min - b.estimated_duration_min) * sortOrderFactor;
      }
      if (params.sortBy === 'rating') {
        return (a.driver_rating - b.driver_rating) * sortOrderFactor;
      }
      return (new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime()) * sortOrderFactor;
    });

    const total = filtered.length;
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return { items: paginated, total };
  }
}

export const journeyRepository = new JourneyRepository();
