import { Router } from 'express';
import authRoutes from './auth.routes';
import vehicleRoutes from './vehicle.routes';
import journeyRoutes from './journey.routes';
import bookingRoutes from './booking.routes';
import paymentRoutes from './payment.routes';
import messagingRoutes from './messaging.routes';
import notificationRoutes from './notification.routes';
import reviewRoutes from './review.routes';
import supportRoutes from './support.routes';
import adminRoutes from './admin.routes';
import mapsRoutes from './maps.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/journeys', journeyRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/messages', messagingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reviews', reviewRoutes);
router.use('/support', supportRoutes);
router.use('/admin', adminRoutes);
router.use('/maps', mapsRoutes);

export default router;
