import { db } from '../models/db';

export interface SessionRecord {
  id: string;
  user_id: string;
  token_hash: string;
  family_id: string;
  expires_at: string;
  user_agent?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export class SessionRepository {
  async createSession(session: SessionRecord): Promise<void> {
    await db.execute(
      `INSERT INTO sessions (id, user_id, token_hash, family_id, expires_at, user_agent, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        session.id, session.user_id, session.token_hash, session.family_id,
        session.expires_at, session.user_agent || null, session.ip_address || null, session.created_at
      ]
    );
  }

  async findByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    return db.queryOne<SessionRecord>(
      'SELECT * FROM sessions WHERE token_hash = $1',
      [tokenHash]
    );
  }

  async deleteById(id: string): Promise<void> {
    await db.execute('DELETE FROM sessions WHERE id = $1', [id]);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await db.execute('DELETE FROM sessions WHERE user_id = $1', [userId]);
  }

  async revokeFamily(familyId: string): Promise<void> {
    await db.execute('DELETE FROM sessions WHERE family_id = $1', [familyId]);
  }

  async cleanExpired(): Promise<number> {
    const res = await db.execute(
      'DELETE FROM sessions WHERE expires_at < $1',
      [new Date().toISOString()]
    );
    return res.changes;
  }
}

export const sessionRepository = new SessionRepository();
