import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { createBookingSchema, cancelBookingSchema } from '@yatrashare/shared';

const router = Router();

router.use(requireAuth);
router.post('/', validateBody(createBookingSchema), bookingController.create);
router.get('/my-bookings', bookingController.getMyBookings);
router.get('/journey/:journeyId', bookingController.getJourneyBookings);
router.post('/:id/approve', bookingController.approve);
router.post('/:id/reject', bookingController.reject);
router.post('/:id/cancel', validateBody(cancelBookingSchema), bookingController.cancel);

export default router;
