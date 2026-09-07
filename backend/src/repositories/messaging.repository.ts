import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/db';

export interface MessageRecord {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: number;
  created_at: string;
}

export class MessagingRepository {
  async findOrCreateDirectConversation(user1Id: string, user2Id: string): Promise<string> {
    const existing = await db.queryOne<{ id: string }>(
      `SELECT c.id
       FROM conversations c
       JOIN conversation_members m1 ON c.id = m1.conversation_id AND m1.user_id = $1
       JOIN conversation_members m2 ON c.id = m2.conversation_id AND m2.user_id = $2
       WHERE c.type = 'DIRECT' LIMIT 1`,
      [user1Id, user2Id]
    );

    if (existing) return existing.id;

    const convId = uuidv4();
    const now = new Date().toISOString();

    await db.execute(
      'INSERT INTO conversations (id, type, created_at, updated_at) VALUES ($1, $2, $3, $4)',
      [convId, 'DIRECT', now, now]
    );

    await db.execute(
      'INSERT INTO conversation_members (conversation_id, user_id, last_read_at) VALUES ($1, $2, $3)',
      [convId, user1Id, now]
    );

    await db.execute(
      'INSERT INTO conversation_members (conversation_id, user_id, last_read_at) VALUES ($1, $2, $3)',
      [convId, user2Id, null]
    );

    return convId;
  }

  async findOrCreateJourneyConversation(journeyId: string, driverId: string): Promise<string> {
    const existing = await db.queryOne<{ id: string }>(
      `SELECT id FROM conversations WHERE journey_id = $1 AND type = 'JOURNEY_CHAT' LIMIT 1`,
      [journeyId]
    );

    if (existing) return existing.id;

    const convId = uuidv4();
    const now = new Date().toISOString();

    await db.execute(
      'INSERT INTO conversations (id, journey_id, type, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
      [convId, journeyId, 'JOURNEY_CHAT', now, now]
    );

    await db.execute(
      'INSERT INTO conversation_members (conversation_id, user_id, last_read_at) VALUES ($1, $2, $3)',
      [convId, driverId, now]
    );

    return convId;
  }

  async addMemberToConversation(conversationId: string, userId: string): Promise<void> {
    const existing = await db.queryOne(
      'SELECT conversation_id FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId]
    );
    if (!existing) {
      await db.execute(
        'INSERT INTO conversation_members (conversation_id, user_id, last_read_at) VALUES ($1, $2, $3)',
        [conversationId, userId, null]
      );
    }
  }

  async getConversationsForUser(userId: string): Promise<any[]> {
    const sql = `
      SELECT c.id, c.journey_id, c.type, c.updated_at,
             other_u.id as other_user_id, other_u.full_name as other_user_name, other_u.avatar_url as other_user_avatar,
             (SELECT m.content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_content,
             (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time,
             (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != $1 AND m.is_read = 0) as unread_count
      FROM conversations c
      JOIN conversation_members cm ON c.id = cm.conversation_id AND cm.user_id = $1
      LEFT JOIN conversation_members other_cm ON c.id = other_cm.conversation_id AND other_cm.user_id != $1
      LEFT JOIN users other_u ON other_cm.user_id = other_u.id
      ORDER BY c.updated_at DESC
    `;
    return db.query(sql, [userId]);
  }

  async getMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    const sql = `
      SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
      LIMIT $2 OFFSET $3
    `;
    return db.query(sql, [conversationId, limit, offset]);
  }

  async createMessage(conversationId: string, senderId: string, content: string): Promise<MessageRecord> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.execute(
      'INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at) VALUES ($1, $2, $3, $4, 0, $5)',
      [id, conversationId, senderId, content, now]
    );

    await db.execute('UPDATE conversations SET updated_at = $1 WHERE id = $2', [now, conversationId]);

    const created = await db.queryOne<MessageRecord>('SELECT * FROM messages WHERE id = $1', [id]);
    if (!created) throw new Error('Message creation failed');
    return created;
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const now = new Date().toISOString();
    await db.execute(
      'UPDATE messages SET is_read = 1 WHERE conversation_id = $1 AND sender_id != $2 AND is_read = 0',
      [conversationId, userId]
    );
    await db.execute(
      'UPDATE conversation_members SET last_read_at = $1 WHERE conversation_id = $2 AND user_id = $3',
      [now, conversationId, userId]
    );
  }

  async isMember(conversationId: string, userId: string): Promise<boolean> {
    const record = await db.queryOne(
      'SELECT conversation_id FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId]
    );
    return !!record;
  }
}

export const messagingRepository = new MessagingRepository();
