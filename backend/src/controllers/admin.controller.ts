import { Request, Response, NextFunction } from 'express';
import { db } from '../models/db';
import { userRepository } from '../repositories/user.repository';
import { journeyRepository } from '../repositories/journey.repository';
import { supportRepository } from '../repositories/support.repository';
import { auditLogRepository } from '../repositories/audit.repository';
import { journeyService } from '../services/journey.service';
import { paymentRepository } from '../repositories/payment.repository';
import { JourneyStatus, UserStatus } from '@yatrashare/shared';
import { NotFoundError } from '../utils/errors';

export class AdminController {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const totalUsers = await db.queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM users WHERE deleted_at IS NULL');
      const totalJourneys = await db.queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM journeys');
      const totalBookings = await db.queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM bookings');
      const totalRevenue = await db.queryOne<{ sum: number }>(`SELECT SUM(amount) as sum FROM payments WHERE status = 'CAPTURED'`);
      const openReports = await db.queryOne<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM safety_reports WHERE status = 'OPEN'`);
      const openTickets = await db.queryOne<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM support_tickets WHERE status = 'OPEN'`);

      return res.status(200).json({
        success: true,
        data: {
          totalUsers: totalUsers?.cnt || 0,
          totalJourneys: totalJourneys?.cnt || 0,
          totalBookings: totalBookings?.cnt || 0,
          totalRevenue: totalRevenue?.sum || 0,
          openReports: openReports?.cnt || 0,
          openTickets: openTickets?.cnt || 0,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit) || 20;
      const offset = Number(req.query.offset) || 0;
      const search = req.query.search as string;

      const result = await userRepository.findAll(limit, offset, search);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const targetUserId = req.params.id;

      const user = await userRepository.findById(targetUserId);
      if (!user) throw new NotFoundError('User not found');

      await userRepository.update(targetUserId, { status });
      await auditLogRepository.log(
        req.user!.userId,
        `UPDATE_USER_STATUS_${status}`,
        'USER',
        targetUserId,
        { previousStatus: user.status, newStatus: status },
        req.ip
      );

      return res.status(200).json({ success: true, message: `User status updated to ${status}` });
    } catch (err) {
      next(err);
    }
  }

  async listJourneys(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit) || 20;
      const offset = Number(req.query.offset) || 0;

      const sql = `
        SELECT j.*, u.full_name as driver_name, u.email as driver_email, v.make, v.model, v.license_plate
        FROM journeys j
        JOIN users u ON j.driver_id = u.id
        JOIN vehicles v ON j.vehicle_id = v.id
        ORDER BY j.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      const countRes = await db.queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM journeys');
      const items = await db.query(sql, [limit, offset]);

      return res.status(200).json({ success: true, data: { items, total: countRes?.cnt || 0 } });
    } catch (err) {
      next(err);
    }
  }

  async cancelJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const journeyId = req.params.id;
      const result = await journeyService.updateStatus(
        req.user!.userId,
        req.user!.role,
        journeyId,
        JourneyStatus.CANCELLED
      );

      await auditLogRepository.log(
        req.user!.userId,
        'ADMIN_CANCEL_JOURNEY',
        'JOURNEY',
        journeyId,
        { reason: req.body.reason || 'Admin intervention' },
        req.ip
      );

      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit) || 20;
      const offset = Number(req.query.offset) || 0;
      const result = await paymentRepository.findAll(limit, offset);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listReports(req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await supportRepository.findAllReports();
      return res.status(200).json({ success: true, data: reports });
    } catch (err) {
      next(err);
    }
  }

  async updateReportStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, adminNotes } = req.body;
      await supportRepository.updateReportStatus(req.params.id, status, adminNotes);
      await auditLogRepository.log(
        req.user!.userId,
        `UPDATE_REPORT_${status}`,
        'SAFETY_REPORT',
        req.params.id,
        { adminNotes },
        req.ip
      );
      return res.status(200).json({ success: true, message: 'Report updated' });
    } catch (err) {
      next(err);
    }
  }

  async listTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as any;
      const tickets = await supportRepository.findAllTickets(status);
      return res.status(200).json({ success: true, data: tickets });
    } catch (err) {
      next(err);
    }
  }

  async updateTicketStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      await supportRepository.updateTicketStatus(req.params.id, status);
      return res.status(200).json({ success: true, message: 'Ticket status updated' });
    } catch (err) {
      next(err);
    }
  }

  async listAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit) || 50;
      const logs = await auditLogRepository.getRecentLogs(limit);
      return res.status(200).json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
