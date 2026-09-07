import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/db';
import { NotificationType } from '@yatrashare/shared';

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: string | null;
  is_read: number;
  created_at: string;
}

export class NotificationRepository {
  async create(notification: Omit<NotificationRecord, 'id' | 'is_read' | 'created_at'>): Promise<NotificationRecord> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.execute(
      'INSERT INTO notifications (id, user_id, type, title, body, data, is_read, created_at) VALUES ($1, $2, $3, $4, $5, $6, 0, $7)',
      [id, notification.user_id, notification.type, notification.title, notification.body, notification.data || null, now]
    );

    const created = await db.queryOne<NotificationRecord>('SELECT * FROM notifications WHERE id = $1', [id]);
    if (!created) throw new Error('Notification creation failed');
    return created;
  }

  async findByUserId(userId: string, limit: number = 30): Promise<NotificationRecord[]> {
    return db.query<NotificationRecord>(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    const res = await db.queryOne<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM notifications WHERE user_id = $1 AND is_read = 0',
      [userId]
    );
    return res?.cnt || 0;
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await db.execute('UPDATE notifications SET is_read = 1 WHERE id = $1 AND user_id = $2', [id, userId]);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await db.execute('UPDATE notifications SET is_read = 1 WHERE user_id = $1 AND is_read = 0', [userId]);
  }
}

export const notificationRepository = new NotificationRepository();
