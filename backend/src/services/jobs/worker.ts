import { db } from '../../models/db';
import { journeyRepository } from '../../repositories/journey.repository';
import { bookingRepository } from '../../repositories/booking.repository';
import { sessionRepository } from '../../repositories/session.repository';
import { notificationService } from '../notification/notification.service';
import { JourneyStatus, BookingStatus } from '@yatrashare/shared';
import { logger } from '../../config/logger';

export class BackgroundWorker {
  private timer: NodeJS.Timeout | null = null;
  private intervalMs: number = 60 * 1000; // Run every 60s

  start() {
    if (this.timer) return;
    logger.info('Background Worker initialized and running...');
    this.timer = setInterval(() => this.runJobs(), this.intervalMs);
    // Run once on startup
    this.runJobs().catch((err) => logger.error('Initial background jobs failed', err));
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('Background Worker stopped');
    }
  }

  async runJobs() {
    try {
      await this.processJourneyRemindersAndTransitions();
      await this.expireStaleBookingRequests();
      await this.cleanExpiredSessions();
    } catch (err) {
      logger.error('Error executing background jobs', err);
    }
  }

  private async processJourneyRemindersAndTransitions() {
    const now = new Date();
    const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
    const nowIso = now.toISOString();

    // 1. Mark journeys starting soon (within 2h)
    const startingSoon = await db.query<any>(
      `SELECT * FROM journeys WHERE status = 'PUBLISHED' AND departure_time <= $1 AND departure_time > $2`,
      [inTwoHours, nowIso]
    );

    for (const j of startingSoon) {
      await journeyRepository.updateStatus(j.id, JourneyStatus.STARTING_SOON);
      // Send reminder to driver
      await notificationService.notifyJourneyReminder(j.driver_id, j.origin_name, j.destination_name, j.departure_time);
      // Send reminder to confirmed passengers
      const bookings = await bookingRepository.findByJourneyId(j.id);
      for (const b of bookings) {
        if (b.status === BookingStatus.CONFIRMED) {
          await notificationService.notifyJourneyReminder(b.passenger_id, j.origin_name, j.destination_name, j.departure_time);
        }
      }
    }

    // 2. Mark journeys in progress if departure time has passed
    const inProgress = await db.query<any>(
      `SELECT * FROM journeys WHERE status IN ('PUBLISHED', 'FULL', 'STARTING_SOON') AND departure_time <= $1`,
      [nowIso]
    );

    for (const j of inProgress) {
      await journeyRepository.updateStatus(j.id, JourneyStatus.IN_PROGRESS);
    }
  }

  private async expireStaleBookingRequests() {
    // Expire requests older than 24 hours or past journey departure
    const nowIso = new Date().toISOString();
    const stale = await db.query<any>(
      `SELECT b.id, b.journey_id, b.seats_booked, b.passenger_id
       FROM bookings b
       JOIN journeys j ON b.journey_id = j.id
       WHERE b.status = 'REQUESTED' AND j.departure_time <= $1`,
      [nowIso]
    );

    for (const b of stale) {
      await db.transaction(async (tx) => {
        await bookingRepository.updateStatus(b.id, BookingStatus.REJECTED, tx);
        const j = await journeyRepository.lockForUpdate(b.journey_id, tx);
        if (j) {
          await journeyRepository.updateSeats(j.id, j.available_seats + b.seats_booked, tx);
        }
      });
      await notificationService.sendInAppNotification(
        b.passenger_id,
        BookingStatus.REJECTED as any,
        'Booking Request Expired',
        'Your booking request expired as departure time has passed.'
      );
    }
  }

  private async cleanExpiredSessions() {
    const cleaned = await sessionRepository.cleanExpired();
    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired sessions`);
    }
  }
}

export const backgroundWorker = new BackgroundWorker();
