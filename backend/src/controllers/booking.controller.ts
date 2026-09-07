import { Request, Response, NextFunction } from 'express';
import { bookingService } from '../services/booking.service';
import { bookingRepository } from '../repositories/booking.repository';

export class BookingController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { journeyId, seatsBooked, pickupStopId, dropoffStopId } = req.body;
      const booking = await bookingService.createBooking(
        req.user!.userId,
        journeyId,
        seatsBooked,
        pickupStopId,
        dropoffStopId
      );
      return res.status(201).json({ success: true, data: booking });
    } catch (err) {
      next(err);
    }
  }

  async getMyBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const bookings = await bookingRepository.findByPassengerId(req.user!.userId);
      return res.status(200).json({ success: true, data: bookings });
    } catch (err) {
      next(err);
    }
  }

  async getJourneyBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const bookings = await bookingRepository.findByJourneyId(req.params.journeyId);
      return res.status(200).json({ success: true, data: bookings });
    } catch (err) {
      next(err);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await bookingService.approveBooking(req.user!.userId, req.params.id);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const reason = req.body.reason || 'Declined by driver';
      const result = await bookingService.rejectBooking(req.user!.userId, req.params.id, reason);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await bookingService.cancelBooking(
        req.user!.userId,
        req.user!.role,
        req.params.id,
        req.body.reason
      );
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const bookingController = new BookingController();
