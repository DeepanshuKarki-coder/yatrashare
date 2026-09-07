import { db, DatabaseClient } from '../models/db';
import { UserRole, UserStatus } from '@yatrashare/shared';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  role: UserRole;
  is_email_verified: number;
  is_phone_verified: number;
  is_identity_verified: number;
  rating_average: number;
  rating_count: number;
  completed_rides_count: number;
  status: UserStatus;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export class UserRepository {
  async findByEmail(email: string, client?: DatabaseClient): Promise<UserRecord | null> {
    const runner = client || db;
    return runner.queryOne<UserRecord>(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL',
      [email]
    );
  }

  async findById(id: string, client?: DatabaseClient): Promise<UserRecord | null> {
    const runner = client || db;
    return runner.queryOne<UserRecord>(
      'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
  }

  async create(user: Omit<UserRecord, 'rating_average' | 'rating_count' | 'completed_rides_count' | 'created_at' | 'updated_at'>, client?: DatabaseClient): Promise<UserRecord> {
    const runner = client || db;
    const now = new Date().toISOString();
    await runner.execute(
      `INSERT INTO users (
        id, email, password_hash, full_name, phone, avatar_url, bio, role,
        is_email_verified, is_phone_verified, is_identity_verified,
        rating_average, rating_count, completed_rides_count, status,
        emergency_contact_name, emergency_contact_phone, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 5.0, 0, 0, $12, $13, $14, $15, $16)`,
      [
        user.id, user.email, user.password_hash, user.full_name, user.phone || null,
        user.avatar_url || null, user.bio || null, user.role,
        user.is_email_verified, user.is_phone_verified, user.is_identity_verified,
        user.status, user.emergency_contact_name || null, user.emergency_contact_phone || null,
        now, now
      ]
    );

    const created = await this.findById(user.id, client);
    if (!created) throw new Error('User creation failed');
    return created;
  }

  async update(id: string, updates: Partial<UserRecord>, client?: DatabaseClient): Promise<UserRecord> {
    const runner = client || db;
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${idx}`);
        values.push(val);
        idx++;
      }
    }

    fields.push(`updated_at = $${idx}`);
    values.push(now);
    idx++;

    values.push(id);
    await runner.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );

    const updated = await this.findById(id, client);
    if (!updated) throw new Error('User not found after update');
    return updated;
  }

  async updateRating(userId: string, newRating: number, client?: DatabaseClient): Promise<void> {
    const runner = client || db;
    const user = await this.findById(userId, runner);
    if (!user) return;

    const newCount = user.rating_count + 1;
    const newAverage = Math.round(((user.rating_average * user.rating_count + newRating) / newCount) * 100) / 100;

    await runner.execute(
      'UPDATE users SET rating_average = $1, rating_count = $2, updated_at = $3 WHERE id = $4',
      [newAverage, newCount, new Date().toISOString(), userId]
    );
  }

  async incrementRidesCount(userId: string, client?: DatabaseClient): Promise<void> {
    const runner = client || db;
    await runner.execute(
      'UPDATE users SET completed_rides_count = completed_rides_count + 1, updated_at = $1 WHERE id = $2',
      [new Date().toISOString(), userId]
    );
  }

  async findAll(limit: number = 50, offset: number = 0, search?: string): Promise<{ users: UserRecord[]; total: number }> {
    let sql = 'SELECT * FROM users WHERE deleted_at IS NULL';
    const params: any[] = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      sql += ' AND (LOWER(full_name) LIKE $1 OR LOWER(email) LIKE $1 OR phone LIKE $1)';
    }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as cnt');
    const countRes = await db.queryOne<{ cnt: number }>(countSql, params);
    const total = countRes?.cnt || 0;

    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;
    sql += ` ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
    params.push(limit, offset);

    const users = await db.query<UserRecord>(sql, params);
    return { users, total };
  }

  async softDelete(id: string): Promise<void> {
    await db.execute(
      'UPDATE users SET deleted_at = $1, status = $2, updated_at = $3 WHERE id = $4',
      [new Date().toISOString(), UserStatus.SUSPENDED, new Date().toISOString(), id]
    );
  }
}

export const userRepository = new UserRepository();
