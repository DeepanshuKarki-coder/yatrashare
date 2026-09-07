import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { messagingRepository } from '../repositories/messaging.repository';
import { notificationService } from '../services/notification/notification.service';
import { logger } from '../config/logger';

export function initializeSockets(io: SocketIOServer) {
  // Wire notification service to socket broadcaster
  notificationService.setSocketBroadcaster((userId, event, payload) => {
    io.to(`user:${userId}`).emit(event, payload);
  });

  // JWT Authentication middleware for Socket.IO
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    try {
      const payload = verifyAccessToken(token);
      (socket as any).user = payload;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    if (!user) return;

    logger.debug(`User ${user.userId} connected to WebSocket`);

    // Automatically join personal user room for direct push notifications
    socket.join(`user:${user.userId}`);

    // Join conversation room
    socket.on('join_conversation', async (conversationId: string) => {
      const isMember = await messagingRepository.isMember(conversationId, user.userId);
      if (isMember) {
        socket.join(`chat:${conversationId}`);
        logger.debug(`User ${user.userId} joined conversation chat:${conversationId}`);
      }
    });

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`chat:${conversationId}`);
    });

    // Join journey updates room
    socket.on('join_journey', (journeyId: string) => {
      socket.join(`journey:${journeyId}`);
    });

    socket.on('leave_journey', (journeyId: string) => {
      socket.leave(`journey:${journeyId}`);
    });

    // Real-time chat messaging
    socket.on('send_message', async (data: { conversationId: string; content: string }, ack?: (res: any) => void) => {
      try {
        const isMember = await messagingRepository.isMember(data.conversationId, user.userId);
        if (!isMember) {
          if (ack) ack({ success: false, error: 'Unauthorized' });
          return;
        }

        const message = await messagingRepository.createMessage(data.conversationId, user.userId, data.content);

        // Broadcast to conversation room
        io.to(`chat:${data.conversationId}`).emit('new_message', {
          ...message,
          senderName: user.email.split('@')[0],
        });

        if (ack) ack({ success: true, data: message });
      } catch (err: any) {
        if (ack) ack({ success: false, error: err.message });
      }
    });

    // Typing indicator
    socket.on('typing', (data: { conversationId: string; isTyping: boolean }) => {
      socket.to(`chat:${data.conversationId}`).emit('user_typing', {
        userId: user.userId,
        isTyping: data.isTyping,
      });
    });

    // Driver live location ping (privacy-conscious, only broadcast to passengers in the journey room)
    socket.on('driver_location', (data: { journeyId: string; lat: number; lng: number }) => {
      socket.to(`journey:${data.journeyId}`).emit('journey_location_update', {
        journeyId: data.journeyId,
        lat: data.lat,
        lng: data.lng,
        updatedAt: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      logger.debug(`User ${user.userId} disconnected from WebSocket`);
    });
  });
}
