import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/db';
import { TicketPriority, TicketStatus, ReportCategory, ReportStatus } from '@yatrashare/shared';

export interface TicketRecord {
  id: string;
  user_id: string;
  booking_id?: string | null;
  category: string;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}

export interface TicketMessageRecord {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_staff_reply: number;
  created_at: string;
}

export interface SafetyReportRecord {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  journey_id?: string | null;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  admin_notes?: string | null;
  created_at: string;
}

export class SupportRepository {
  async createTicket(ticket: Omit<TicketRecord, 'id' | 'status' | 'created_at' | 'updated_at'>, initialMessage: string): Promise<TicketRecord> {
    const id = uuidv4();
    const messageId = uuidv4();
    const now = new Date().toISOString();

    await db.execute(
      'INSERT INTO support_tickets (id, user_id, booking_id, category, subject, priority, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [id, ticket.user_id, ticket.booking_id || null, ticket.category, ticket.subject, ticket.priority, TicketStatus.OPEN, now, now]
    );

    await db.execute(
      'INSERT INTO support_messages (id, ticket_id, sender_id, message, is_staff_reply, created_at) VALUES ($1, $2, $3, $4, 0, $5)',
      [messageId, id, ticket.user_id, initialMessage, now]
    );

    const created = await db.queryOne<TicketRecord>('SELECT * FROM support_tickets WHERE id = $1', [id]);
    if (!created) throw new Error('Failed to create ticket');
    return created;
  }

  async findTicketById(id: string): Promise<any | null> {
    const ticket = await db.queryOne<TicketRecord>(
      `SELECT t.*, u.full_name as user_name, u.email as user_email
       FROM support_tickets t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [id]
    );
    if (!ticket) return null;

    const messages = await db.query<any>(
      `SELECT m.*, u.full_name as sender_name, u.role as sender_role
       FROM support_messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.ticket_id = $1
       ORDER BY m.created_at ASC`,
      [id]
    );

    return { ...ticket, messages };
  }

  async findTicketsByUser(userId: string): Promise<TicketRecord[]> {
    return db.query<TicketRecord>(
      'SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
  }

  async findAllTickets(status?: TicketStatus): Promise<any[]> {
    let sql = `
      SELECT t.*, u.full_name as user_name, u.email as user_email
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
    `;
    const params: any[] = [];
    if (status) {
      sql += ' WHERE t.status = $1';
      params.push(status);
    }
    sql += ' ORDER BY t.updated_at DESC';
    return db.query(sql, params);
  }

  async addMessage(ticketId: string, senderId: string, message: string, isStaffReply: boolean): Promise<TicketMessageRecord> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.execute(
      'INSERT INTO support_messages (id, ticket_id, sender_id, message, is_staff_reply, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, ticketId, senderId, message, isStaffReply ? 1 : 0, now]
    );

    const newStatus = isStaffReply ? TicketStatus.WAITING_FOR_USER : TicketStatus.IN_PROGRESS;
    await db.execute(
      'UPDATE support_tickets SET status = $1, updated_at = $2 WHERE id = $3',
      [newStatus, now, ticketId]
    );

    const created = await db.queryOne<TicketMessageRecord>('SELECT * FROM support_messages WHERE id = $1', [id]);
    if (!created) throw new Error('Failed to create ticket message');
    return created;
  }

  async updateTicketStatus(id: string, status: TicketStatus): Promise<void> {
    await db.execute(
      'UPDATE support_tickets SET status = $1, updated_at = $2 WHERE id = $3',
      [status, new Date().toISOString(), id]
    );
  }

  // Safety Reports
  async createReport(report: Omit<SafetyReportRecord, 'id' | 'status' | 'admin_notes' | 'created_at'>): Promise<SafetyReportRecord> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO safety_reports (id, reporter_id, reported_user_id, journey_id, category, description, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, report.reporter_id, report.reported_user_id, report.journey_id || null, report.category, report.description, ReportStatus.OPEN, now]
    );

    const created = await db.queryOne<SafetyReportRecord>('SELECT * FROM safety_reports WHERE id = $1', [id]);
    if (!created) throw new Error('Failed to create safety report');
    return created;
  }

  async findAllReports(): Promise<any[]> {
    const sql = `
      SELECT r.*,
             reporter.full_name as reporter_name, reporter.email as reporter_email,
             reported.full_name as reported_user_name, reported.email as reported_user_email
      FROM safety_reports r
      JOIN users reporter ON r.reporter_id = reporter.id
      JOIN users reported ON r.reported_user_id = reported.id
      ORDER BY r.created_at DESC
    `;
    return db.query(sql);
  }

  async updateReportStatus(id: string, status: ReportStatus, adminNotes?: string): Promise<void> {
    await db.execute(
      'UPDATE safety_reports SET status = $1, admin_notes = COALESCE($2, admin_notes) WHERE id = $3',
      [status, adminNotes || null, id]
    );
  }

  // User Blocking
  async blockUser(blockerId: string, blockedUserId: string): Promise<void> {
    const now = new Date().toISOString();
    await db.execute(
      'INSERT OR IGNORE INTO user_blocks (blocker_id, blocked_user_id, created_at) VALUES ($1, $2, $3)',
      [blockerId, blockedUserId, now]
    );
  }

  async unblockUser(blockerId: string, blockedUserId: string): Promise<void> {
    await db.execute('DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_user_id = $2', [blockerId, blockedUserId]);
  }

  async isBlocked(userAId: string, userBId: string): Promise<boolean> {
    const res = await db.queryOne(
      'SELECT blocker_id FROM user_blocks WHERE (blocker_id = $1 AND blocked_user_id = $2) OR (blocker_id = $2 AND blocked_user_id = $1)',
      [userAId, userBId]
    );
    return !!res;
  }
}

export const supportRepository = new SupportRepository();
