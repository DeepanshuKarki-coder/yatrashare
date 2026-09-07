import { db, DatabaseClient } from '../models/db';
import { VehicleType } from '@yatrashare/shared';

export interface VehicleRecord {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  seat_capacity: number;
  vehicle_type: VehicleType;
  amenities: string; // JSON string
  photo_url?: string | null;
  is_default: number;
  created_at: string;
  updated_at: string;
}

export class VehicleRepository {
  async findById(id: string, client?: DatabaseClient): Promise<VehicleRecord | null> {
    const runner = client || db;
    return runner.queryOne<VehicleRecord>('SELECT * FROM vehicles WHERE id = $1', [id]);
  }

  async findByUserId(userId: string): Promise<VehicleRecord[]> {
    return db.query<VehicleRecord>('SELECT * FROM vehicles WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC', [userId]);
  }

  async create(vehicle: Omit<VehicleRecord, 'created_at' | 'updated_at'>): Promise<VehicleRecord> {
    const now = new Date().toISOString();

    if (vehicle.is_default === 1) {
      await db.execute('UPDATE vehicles SET is_default = 0 WHERE user_id = $1', [vehicle.user_id]);
    }

    await db.execute(
      `INSERT INTO vehicles (id, user_id, make, model, year, color, license_plate, seat_capacity, vehicle_type, amenities, photo_url, is_default, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        vehicle.id, vehicle.user_id, vehicle.make, vehicle.model, vehicle.year, vehicle.color,
        vehicle.license_plate, vehicle.seat_capacity, vehicle.vehicle_type, vehicle.amenities,
        vehicle.photo_url || null, vehicle.is_default, now, now
      ]
    );

    const created = await this.findById(vehicle.id);
    if (!created) throw new Error('Vehicle creation failed');
    return created;
  }

  async update(id: string, userId: string, updates: Partial<VehicleRecord>): Promise<VehicleRecord> {
    const existing = await this.findById(id);
    if (!existing || existing.user_id !== userId) {
      throw new Error('Vehicle not found or unauthorized');
    }

    if (updates.is_default === 1) {
      await db.execute('UPDATE vehicles SET is_default = 0 WHERE user_id = $1', [userId]);
    }

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'user_id' && key !== 'created_at') {
        fields.push(`${key} = $${idx}`);
        values.push(val);
        idx++;
      }
    }

    fields.push(`updated_at = $${idx}`);
    values.push(now);
    idx++;

    values.push(id);
    await db.execute(`UPDATE vehicles SET ${fields.join(', ')} WHERE id = $${idx}`, values);

    const updated = await this.findById(id);
    if (!updated) throw new Error('Vehicle not found after update');
    return updated;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing || existing.user_id !== userId) return false;

    // Check if vehicle is used in active journeys
    const activeJourneys = await db.queryOne<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM journeys WHERE vehicle_id = $1 AND status IN ('PUBLISHED', 'STARTING_SOON', 'IN_PROGRESS')`,
      [id]
    );
    if (activeJourneys && activeJourneys.cnt > 0) {
      throw new Error('Cannot delete vehicle that has active or upcoming journeys');
    }

    const res = await db.execute('DELETE FROM vehicles WHERE id = $1 AND user_id = $2', [id, userId]);
    return res.changes > 0;
  }
}

export const vehicleRepository = new VehicleRepository();
