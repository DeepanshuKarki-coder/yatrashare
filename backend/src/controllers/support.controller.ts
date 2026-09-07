import { Request, Response, NextFunction } from 'express';
import { supportRepository } from '../repositories/support.repository';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { UserRole } from '@yatrashare/shared';

export class SupportController {
  async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await supportRepository.createTicket(
        {
          user_id: req.user!.userId,
          booking_id: req.body.bookingId,
          category: req.body.category,
          subject: req.body.subject,
          priority: req.body.priority,
        },
        req.body.message
      );
      return res.status(201).json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  }

  async getMyTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const tickets = await supportRepository.findTicketsByUser(req.user!.userId);
      return res.status(200).json({ success: true, data: tickets });
    } catch (err) {
      next(err);
    }
  }

  async getTicketDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await supportRepository.findTicketById(req.params.id);
      if (!ticket) throw new NotFoundError('Ticket not found');

      const isOwner = ticket.user_id === req.user!.userId;
      const isStaff = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPPORT;

      if (!isOwner && !isStaff) {
        throw new ForbiddenError('Unauthorized to view this ticket');
      }

      return res.status(200).json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  }

  async replyTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const ticketId = req.params.id;
      const ticket = await supportRepository.findTicketById(ticketId);
      if (!ticket) throw new NotFoundError('Ticket not found');

      const isStaff = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPPORT;
      const isOwner = ticket.user_id === req.user!.userId;

      if (!isOwner && !isStaff) {
        throw new ForbiddenError('Unauthorized to reply to this ticket');
      }

      const msg = await supportRepository.addMessage(
        ticketId,
        req.user!.userId,
        req.body.message,
        isStaff
      );

      return res.status(201).json({ success: true, data: msg });
    } catch (err) {
      next(err);
    }
  }

  async createReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await supportRepository.createReport({
        reporter_id: req.user!.userId,
        reported_user_id: req.body.reportedUserId,
        journey_id: req.body.journeyId,
        category: req.body.category,
        description: req.body.description,
      });
      return res.status(201).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async blockUser(req: Request, res: Response, next: NextFunction) {
    try {
      await supportRepository.blockUser(req.user!.userId, req.params.userId);
      return res.status(200).json({ success: true, message: 'User blocked' });
    } catch (err) {
      next(err);
    }
  }

  async unblockUser(req: Request, res: Response, next: NextFunction) {
    try {
      await supportRepository.unblockUser(req.user!.userId, req.params.userId);
      return res.status(200).json({ success: true, message: 'User unblocked' });
    } catch (err) {
      next(err);
    }
  }
}

export const supportController = new SupportController();
