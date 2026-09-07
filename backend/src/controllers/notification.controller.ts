import { Request, Response, NextFunction } from 'express';
import { notificationRepository } from '../repositories/notification.repository';

export class NotificationController {
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit) || 30;
      const notifications = await notificationRepository.findByUserId(req.user!.userId, limit);
      const formatted = notifications.map((n) => ({
        ...n,
        data: n.data ? JSON.parse(n.data) : null,
        isRead: !!n.is_read,
      }));
      return res.status(200).json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await notificationRepository.getUnreadCount(req.user!.userId);
      return res.status(200).json({ success: true, data: { unreadCount: count } });
    } catch (err) {
      next(err);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationRepository.markAsRead(req.params.id, req.user!.userId);
      return res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
      next(err);
    }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationRepository.markAllAsRead(req.user!.userId);
      return res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
