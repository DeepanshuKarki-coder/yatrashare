import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/db';

export interface AuditLogRecord {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export class AuditLogRepository {
  async log(adminId: string, action: string, entityType: string, entityId: string, details?: any, ipAddress?: string): Promise<void> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const detailsStr = details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null;

    await db.execute(
      'INSERT INTO audit_logs (id, admin_id, action, entity_type, entity_id, details, ip_address, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, adminId, action, entityType, entityId, detailsStr, ipAddress || null, now]
    );
  }

  async getRecentLogs(limit: number = 50): Promise<any[]> {
    const sql = `
      SELECT a.*, u.full_name as admin_name, u.email as admin_email
      FROM audit_logs a
      JOIN users u ON a.admin_id = u.id
      ORDER BY a.created_at DESC
      LIMIT $1
    `;
    return db.query(sql, [limit]);
  }
}

export const auditLogRepository = new AuditLogRepository();
