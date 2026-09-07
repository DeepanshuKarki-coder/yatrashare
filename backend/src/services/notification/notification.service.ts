import nodemailer from 'nodemailer';
import { notificationRepository } from '../../repositories/notification.repository';
import { userRepository } from '../../repositories/user.repository';
import { NotificationType } from '@yatrashare/shared';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export class NotificationService {
  private mailTransporter: nodemailer.Transporter | null = null;
  private socketBroadcaster: ((userId: string, event: string, payload: any) => void) | null = null;

  constructor() {
    this.initEmailTransporter();
  }

  private initEmailTransporter() {
    if (env.EMAIL_PROVIDER === 'SMTP' && env.SMTP_HOST) {
      this.mailTransporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
      logger.info(`SMTP email transporter configured for host ${env.SMTP_HOST}`);
    } else {
      logger.info('Email service initialized in MOCK mode (emails logged to stdout)');
    }
  }

  setSocketBroadcaster(broadcaster: (userId: string, event: string, payload: any) => void) {
    this.socketBroadcaster = broadcaster;
  }

  async sendInAppNotification(userId: string, type: NotificationType, title: string, body: string, data?: any) {
    const record = await notificationRepository.create({
      user_id: userId,
      type,
      title,
      body,
      data: data ? JSON.stringify(data) : null,
    });

    if (this.socketBroadcaster) {
      this.socketBroadcaster(userId, 'notification', {
        id: record.id,
        type,
        title,
        body,
        data,
        createdAt: record.created_at,
        isRead: false,
      });
    }

    return record;
  }

  async sendEmail(to: string, subject: string, htmlContent: string) {
    if (this.mailTransporter) {
      try {
        await this.mailTransporter.sendMail({
          from: env.EMAIL_FROM,
          to,
          subject,
          html: htmlContent,
        });
        logger.info(`Email successfully dispatched to ${to} with subject "${subject}"`);
      } catch (err) {
        logger.error(`Failed to send email to ${to}`, err);
      }
    } else {
      logger.info(`[MockEmail] TO: ${to} | SUBJECT: "${subject}"\nBODY PREVIEW: ${htmlContent.substring(0, 150)}...`);
    }
  }

  // High-level Domain Notification helpers
  async notifyBookingRequested(driverId: string, passengerName: string, origin: string, destination: string, bookingId: string) {
    await this.sendInAppNotification(
      driverId,
      NotificationType.BOOKING_REQUEST,
      'New Ride Booking Request',
      `${passengerName} requested to join your journey from ${origin} to ${destination}.`,
      { bookingId }
    );
  }

  async notifyBookingConfirmed(passengerId: string, driverName: string, origin: string, destination: string, bookingId: string) {
    const user = await userRepository.findById(passengerId);
    await this.sendInAppNotification(
      passengerId,
      NotificationType.BOOKING_CONFIRMED,
      'Booking Confirmed!',
      `Your seat with ${driverName} from ${origin} to ${destination} is confirmed. Safe travels!`,
      { bookingId }
    );

    if (user?.email) {
      await this.sendEmail(
        user.email,
        'YatraShare - Booking Confirmation',
        `<h1>Booking Confirmed!</h1><p>Hi ${user.full_name},</p><p>Your journey with <strong>${driverName}</strong> from <strong>${origin}</strong> to <strong>${destination}</strong> is confirmed.</p><p>View your booking details and ticket receipt in the app.</p>`
      );
    }
  }

  async notifyBookingCancelled(userId: string, cancelledByName: string, reason: string, refundAmount?: number) {
    const refundText = refundAmount && refundAmount > 0 ? ` A refund of ₹${refundAmount} has been initiated.` : '';
    await this.sendInAppNotification(
      userId,
      NotificationType.BOOKING_CANCELLED,
      'Booking Cancelled',
      `Booking was cancelled by ${cancelledByName}. Reason: ${reason}.${refundText}`,
      { refundAmount }
    );
  }

  async notifyJourneyReminder(userId: string, origin: string, destination: string, departureTime: string) {
    await this.sendInAppNotification(
      userId,
      NotificationType.JOURNEY_REMINDER,
      'Upcoming Journey Reminder',
      `Your journey from ${origin} to ${destination} is scheduled to depart at ${new Date(departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Please arrive 10 minutes early.`,
      { departureTime }
    );
  }
}

export const notificationService = new NotificationService();
