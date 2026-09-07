import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { createPaymentOrderSchema, verifyPaymentSchema } from '@yatrashare/shared';

const router = Router();

// Public webhook endpoint
router.post('/webhook', paymentController.webhook);

// Protected routes
router.use(requireAuth);
router.post('/create-order', validateBody(createPaymentOrderSchema), paymentController.createOrder);
router.post('/verify', validateBody(verifyPaymentSchema), paymentController.verifyPayment);
router.get('/booking/:bookingId', paymentController.getPaymentForBooking);

export default router;
