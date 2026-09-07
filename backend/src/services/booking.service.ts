import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/db';
import { journeyRepository } from '../repositories/journey.repository';
import { bookingRepository, BookingRecord } from '../repositories/booking.repository';
import { userRepository } from '../repositories/user.repository';
import { paymentService } from './payment/payment.service';
import { notificationService } from './notification/notification.service';
import { messagingRepository } from '../repositories/messaging.repository';
import { BookingStatus, JourneyStatus, UserRole } from '@yatrashare/shared';
import { BadRequestError, ConflictError, NotFoundError, ForbiddenError } from '../utils/errors';
import { logger } from '../config/logger';

export class BookingService {
  /**
   * Atomic seat reservation with transaction row lock preventing race conditions
   */
  async createBooking(
    passengerId: string,
    journeyId: string,
    seatsRequested: number,
    pickupStopId?: string | null,
    dropoffStopId?: string | null
  ) {
    if (seatsRequested < 1) {
      throw new BadRequestError('Must book at least 1 seat');
    }

    return await db.transaction(async (tx) => {
      // 1. Pessimistic lock on the journey
      const journey = await journeyRepository.lockForUpdate(journeyId, tx);
      if (!journey) {
        throw new NotFoundError('Journey not found');
      }

      if (journey.driver_id === passengerId) {
        throw new BadRequestError('You cannot book a seat on your own journey');
      }

      if (journey.status !== JourneyStatus.PUBLISHED) {
        throw new BadRequestError(`Journey is not available for booking (Status: ${journey.status})`);
      }

      const departure = new Date(journey.departure_time).getTime();
      const now = Date.now();
      if (departure <= now + 15 * 60 * 1000) {
        throw new BadRequestError('Cannot book a journey departing in less than 15 minutes');
      }

      // Check seat availability
      if (journey.available_seats < seatsRequested) {
        throw new ConflictError(
          `Not enough seats available. Requested: ${seatsRequested}, Available: ${journey.available_seats}`
        );
      }

      // Check existing active booking for this passenger
      const existingBookings = await tx.query<BookingRecord>(
        `SELECT * FROM bookings WHERE journey_id = $1 AND passenger_id = $2 AND status IN ('REQUESTED', 'CONFIRMED')`,
        [journeyId, passengerId]
      );
      if (existingBookings.length > 0) {
        throw new ConflictError('You already have an active booking or request for this journey');
      }

      const totalAmount = Math.round(journey.price_per_seat * seatsRequested * 100) / 100;
      const initialStatus = journey.auto_accept === 1 ? BookingStatus.CONFIRMED : BookingStatus.REQUESTED;

      const bookingId = uuidv4();
      const booking = await bookingRepository.create(
        {
          id: bookingId,
          journey_id: journey.id,
          passenger_id: passengerId,
          seats_booked: seatsRequested,
          total_amount: totalAmount,
          currency: journey.currency,
          pickup_stop_id: pickupStopId || null,
          dropoff_stop_id: dropoffStopId || null,
          status: initialStatus,
        },
        tx
      );

      // Decrement available seats atomically
      const newAvailableSeats = journey.available_seats - seatsRequested;
      await journeyRepository.updateSeats(journey.id, newAvailableSeats, tx);

      return { booking, journey, initialStatus };
    }).then(async ({ booking, journey, initialStatus }) => {
      // Post-transaction notifications and messaging creation
      const passenger = await userRepository.findById(passengerId);
      const driver = await userRepository.findById(journey.driver_id);

      // Ensure conversation exists between passenger and driver
      await messagingRepository.findOrCreateDirectConversation(passengerId, journey.driver_id);

      if (initialStatus === BookingStatus.CONFIRMED) {
        await notificationService.notifyBookingConfirmed(
          passengerId,
          driver?.full_name || 'Driver',
          journey.origin_name,
          journey.destination_name,
          booking.id
        );
      } else {
        await notificationService.notifyBookingRequested(
          journey.driver_id,
          passenger?.full_name || 'Traveler',
          journey.origin_name,
          journey.destination_name,
          booking.id
        );
      }

      return booking;
    });
  }

  /**
   * Driver approves a requested booking
   */
  async approveBooking(driverId: string, bookingId: string) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    const journey = await journeyRepository.findById(booking.journey_id);
    if (!journey || journey.driver_id !== driverId) {
      throw new ForbiddenError('Unauthorized to manage this booking');
    }

    if (booking.status !== BookingStatus.REQUESTED) {
      throw new BadRequestError(`Cannot approve a booking in ${booking.status} status`);
    }

    await bookingRepository.updateStatus(bookingId, BookingStatus.CONFIRMED);

    const driver = await userRepository.findById(driverId);
    await notificationService.notifyBookingConfirmed(
      booking.passenger_id,
      driver?.full_name || 'Driver',
      journey.origin_name,
      journey.destination_name,
      booking.id
    );

    return { success: true, bookingId, status: BookingStatus.CONFIRMED };
  }

  /**
   * Driver rejects a requested booking and restores held seats
   */
  async rejectBooking(driverId: string, bookingId: string, reason: string = 'Driver declined request') {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    const journey = await journeyRepository.findById(booking.journey_id);
    if (!journey || journey.driver_id !== driverId) {
      throw new ForbiddenError('Unauthorized to manage this booking');
    }

    if (booking.status !== BookingStatus.REQUESTED) {
      throw new BadRequestError(`Cannot reject a booking in ${booking.status} status`);
    }

    await db.transaction(async (tx) => {
      await bookingRepository.updateStatus(bookingId, BookingStatus.REJECTED, tx);
      const j = await journeyRepository.lockForUpdate(journey.id, tx);
      if (j) {
        await journeyRepository.updateSeats(j.id, j.available_seats + booking.seats_booked, tx);
      }
    });

    await notificationService.sendInAppNotification(
      booking.passenger_id,
      BookingStatus.REJECTED as any,
      'Booking Request Declined',
      `Your booking request for ${journey.origin_name} to ${journey.destination_name} was declined: ${reason}`,
      { bookingId }
    );

    return { success: true, bookingId, status: BookingStatus.REJECTED };
  }

  /**
   * Cancel booking with automated tiered refund calculation
   */
  async cancelBooking(userId: string, userRole: UserRole, bookingId: string, reason: string) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    const journey = await journeyRepository.findById(booking.journey_id);
    if (!journey) throw new NotFoundError('Journey not found');

    const isPassenger = booking.passenger_id === userId;
    const isDriver = journey.driver_id === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isPassenger && !isDriver && !isAdmin) {
      throw new ForbiddenError('Unauthorized to cancel this booking');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestError('Booking is already cancelled');
    }

    const departureTime = new Date(journey.departure_time).getTime();
    const hoursUntilDeparture = (departureTime - Date.now()) / (1000 * 60 * 60);

    // Calculate refund percentage
    let refundPercentage = 0;
    if (isDriver || isAdmin) {
      // Full refund if driver or admin cancels
      refundPercentage = 1.0;
    } else if (hoursUntilDeparture > 24) {
      refundPercentage = 1.0; // 100% refund
    } else if (hoursUntilDeparture >= 12) {
      refundPercentage = 0.5; // 50% refund
    } else {
      refundPercentage = 0.0; // Non-refundable within 12h
    }

    const refundAmount = Math.round(booking.total_amount * refundPercentage * 100) / 100;

    await db.transaction(async (tx) => {
      await bookingRepository.cancelBooking(booking.id, userId, reason, tx);

      // Restore seats if journey is still active
      if (journey.status === JourneyStatus.PUBLISHED || journey.status === JourneyStatus.FULL) {
        const j = await journeyRepository.lockForUpdate(journey.id, tx);
        if (j) {
          await journeyRepository.updateSeats(j.id, j.available_seats + booking.seats_booked, tx);
        }
      }
    });

    // Process refund if amount > 0
    if (refundAmount > 0) {
      try {
        await paymentService.processRefund(booking.id, refundAmount, `Cancellation: ${reason}`);
      } catch (err) {
        logger.error(`Automated refund failed for booking ${booking.id}`, err);
      }
    }

    // Notify involved parties
    const canceller = await userRepository.findById(userId);
    const cancellerName = canceller?.full_name || 'User';

    if (isPassenger) {
      // Notify driver
      await notificationService.sendInAppNotification(
        journey.driver_id,
        'BOOKING_CANCELLED' as any,
        'Passenger Cancelled Booking',
        `${cancellerName} cancelled their seat on your ride to ${journey.destination_name}. Seat restored.`,
        { bookingId }
      );
    } else {
      // Notify passenger
      await notificationService.notifyBookingCancelled(
        booking.passenger_id,
        cancellerName,
        reason,
        refundAmount
      );
    }

    return {
      success: true,
      bookingId,
      status: BookingStatus.CANCELLED,
      refundAmount,
      refundPercentage: refundPercentage * 100,
    };
  }
}

export const bookingService = new BookingService();
