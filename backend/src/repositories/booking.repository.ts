import { db, DatabaseClient } from '../models/db';
import { BookingStatus } from '@yatrashare/shared';

export interface BookingRecord {
  id: string;
  journey_id: string;
  passenger_id: string;
  seats_booked: number;
  total_amount: number;
  currency: string;
  pickup_stop_id?: string | null;
  dropoff_stop_id?: string | null;
  status: BookingStatus;
  cancellation_reason?: string | null;
  cancelled_by?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  updated_at: string;
}

export class BookingRepository {
  async findById(id: string, client?: DatabaseClient): Promise<BookingRecord | null> {
    const runner = client || db;
    return runner.queryOne<BookingRecord>('SELECT * FROM bookings WHERE id = $1', [id]);
  }

  async findByPassengerId(passengerId: string): Promise<any[]> {
    const sql = `
      SELECT b.*,
             j.origin_name, j.origin_address, j.origin_lat, j.origin_lng,
             j.destination_name, j.destination_address, j.destination_lat, j.destination_lng,
             j.departure_time, j.estimated_arrival_time, j.status as journey_status,
             u.id as driver_id, u.full_name as driver_name, u.avatar_url as driver_avatar, u.phone as driver_phone,
             v.make as vehicle_make, v.model as vehicle_model, v.license_plate as vehicle_plate,
             p.id as payment_id, p.status as payment_status, p.gateway as payment_gateway
      FROM bookings b
      JOIN journeys j ON b.journey_id = j.id
      JOIN users u ON j.driver_id = u.id
      JOIN vehicles v ON j.vehicle_id = v.id
      LEFT JOIN payments p ON b.id = p.booking_id
      WHERE b.passenger_id = $1
      ORDER BY b.created_at DESC
    `;
    return db.query(sql, [passengerId]);
  }

  async findByJourneyId(journeyId: string): Promise<any[]> {
    const sql = `
      SELECT b.*,
             u.id as passenger_id, u.full_name as passenger_name, u.avatar_url as passenger_avatar,
             u.phone as passenger_phone, u.rating_average as passenger_rating,
             p.id as payment_id, p.status as payment_status
      FROM bookings b
      JOIN users u ON b.passenger_id = u.id
      LEFT JOIN payments p ON b.id = p.booking_id
      WHERE b.journey_id = $1
      ORDER BY b.created_at ASC
    `;
    return db.query(sql, [journeyId]);
  }

  async create(booking: Omit<BookingRecord, 'created_at' | 'updated_at'>, client?: DatabaseClient): Promise<BookingRecord> {
    const runner = client || db;
    const now = new Date().toISOString();

    await runner.execute(
      `INSERT INTO bookings (
        id, journey_id, passenger_id, seats_booked, total_amount, currency,
        pickup_stop_id, dropoff_stop_id, status, cancellation_reason, cancelled_by, cancelled_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        booking.id, booking.journey_id, booking.passenger_id, booking.seats_booked,
        booking.total_amount, booking.currency, booking.pickup_stop_id || null, booking.dropoff_stop_id || null,
        booking.status, booking.cancellation_reason || null, booking.cancelled_by || null,
        booking.cancelled_at || null, now, now
      ]
    );

    return {
      id: booking.id,
      journey_id: booking.journey_id,
      passenger_id: booking.passenger_id,
      seats_booked: booking.seats_booked,
      total_amount: booking.total_amount,
      currency: booking.currency,
      pickup_stop_id: booking.pickup_stop_id || null,
      dropoff_stop_id: booking.dropoff_stop_id || null,
      status: booking.status,
      cancellation_reason: booking.cancellation_reason || null,
      cancelled_by: booking.cancelled_by || null,
      cancelled_at: booking.cancelled_at || null,
      created_at: now,
      updated_at: now,
    };
  }

  async updateStatus(id: string, status: BookingStatus, client?: DatabaseClient): Promise<void> {
    const runner = client || db;
    await runner.execute(
      'UPDATE bookings SET status = $1, updated_at = $2 WHERE id = $3',
      [status, new Date().toISOString(), id]
    );
  }

  async cancelBooking(id: string, cancelledBy: string, reason: string, client?: DatabaseClient): Promise<void> {
    const runner = client || db;
    const now = new Date().toISOString();
    await runner.execute(
      `UPDATE bookings
       SET status = $1, cancellation_reason = $2, cancelled_by = $3, cancelled_at = $4, updated_at = $5
       WHERE id = $6`,
      [BookingStatus.CANCELLED, reason, cancelledBy, now, now, id]
    );
  }
}

export const bookingRepository = new BookingRepository();
