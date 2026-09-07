import { Request, Response, NextFunction } from 'express';
import { messagingRepository } from '../repositories/messaging.repository';
import { ForbiddenError, NotFoundError } from '../utils/errors';

export class MessagingController {
  async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const convs = await messagingRepository.getConversationsForUser(req.user!.userId);
      return res.status(200).json({ success: true, data: convs });
    } catch (err) {
      next(err);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const convId = req.params.conversationId;
      const isMember = await messagingRepository.isMember(convId, req.user!.userId);
      if (!isMember) throw new ForbiddenError('You are not a participant in this conversation');

      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;
      const messages = await messagingRepository.getMessages(convId, limit, offset);

      // Automatically mark as read
      await messagingRepository.markAsRead(convId, req.user!.userId);

      return res.status(200).json({ success: true, data: messages });
    } catch (err) {
      next(err);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { conversationId, content } = req.body;
      const isMember = await messagingRepository.isMember(conversationId, req.user!.userId);
      if (!isMember) throw new ForbiddenError('You are not a participant in this conversation');

      const message = await messagingRepository.createMessage(conversationId, req.user!.userId, content);
      return res.status(201).json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      await messagingRepository.markAsRead(req.params.conversationId, req.user!.userId);
      return res.status(200).json({ success: true, message: 'Messages marked as read' });
    } catch (err) {
      next(err);
    }
  }
}

export const messagingController = new MessagingController();
