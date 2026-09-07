import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { reviewRepository } from '../repositories/review.repository';
import { journeyRepository } from '../repositories/journey.repository';
import { bookingRepository } from '../repositories/booking.repository';
import { userRepository } from '../repositories/user.repository';
import { JourneyStatus, BookingStatus } from '@yatrashare/shared';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../utils/errors';

export class ReviewController {
  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewerId = req.user!.userId;
      const { journeyId, reviewedUserId, rating, comment, categories } = req.body;

      if (reviewerId === reviewedUserId) {
        throw new BadRequestError('You cannot review yourself');
      }

      // 1. Verify journey exists and is COMPLETED
      const journey = await journeyRepository.findById(journeyId);
      if (!journey) throw new NotFoundError('Journey not found');
      if (journey.status !== JourneyStatus.COMPLETED) {
        throw new BadRequestError('Reviews can only be submitted for completed journeys');
      }

      // 2. Determine eligible relationship
      let roleAs: 'DRIVER_REVIEWING_PASSENGER' | 'PASSENGER_REVIEWING_DRIVER';

      if (journey.driver_id === reviewerId) {
        // Driver is reviewing a passenger
        const booking = await bookingRepository.findByJourneyId(journeyId);
        const validPassenger = booking.some(
          (b) => b.passenger_id === reviewedUserId && (b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CONFIRMED)
        );
        if (!validPassenger) {
          throw new ForbiddenError('This user was not a confirmed passenger on your journey');
        }
        roleAs = 'DRIVER_REVIEWING_PASSENGER';
      } else {
        // Passenger is reviewing driver
        if (journey.driver_id !== reviewedUserId) {
          throw new BadRequestError('You can only review the driver of this journey');
        }
        const bookings = await bookingRepository.findByPassengerId(reviewerId);
        const myBooking = bookings.find((b) => b.journey_id === journeyId && (b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CONFIRMED));
        if (!myBooking) {
          throw new ForbiddenError('You were not a confirmed passenger on this completed journey');
        }
        roleAs = 'PASSENGER_REVIEWING_DRIVER';
      }

      // 3. Check for existing review
      const existing = await reviewRepository.findByJourneyAndReviewer(journeyId, reviewerId, reviewedUserId);
      if (existing) {
        throw new ConflictError('You have already submitted a review for this participant');
      }

      // 4. Create review and update recipient's aggregate rating
      const reviewId = uuidv4();
      const review = await reviewRepository.create({
        id: reviewId,
        journey_id: journeyId,
        reviewer_id: reviewerId,
        reviewed_user_id: reviewedUserId,
        role_as: roleAs,
        rating,
        comment,
        categories: JSON.stringify(categories || {}),
        created_at: new Date().toISOString(),
      });

      await userRepository.updateRating(reviewedUserId, rating);

      return res.status(201).json({
        success: true,
        data: {
          ...review,
          categories: JSON.parse(review.categories),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getUserReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit) || 20;
      const offset = Number(req.query.offset) || 0;
      const result = await reviewRepository.findByReviewedUserId(req.params.userId, limit, offset);

      const formatted = result.reviews.map((r) => ({
        ...r,
        categories: JSON.parse(r.categories || '{}'),
      }));

      return res.status(200).json({ success: true, data: { reviews: formatted, total: result.total } });
    } catch (err) {
      next(err);
    }
  }
}

export const reviewController = new ReviewController();
