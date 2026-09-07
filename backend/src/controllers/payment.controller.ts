import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment/payment.service';
import { paymentRepository } from '../repositories/payment.repository';
import { NotFoundError } from '../utils/errors';
import { logger } from '../config/logger';

export class PaymentController {
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookingId, gateway } = req.body;
      const order = await paymentService.createOrder(bookingId, req.user!.userId, gateway);
      return res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookingId, gatewayOrderId, gatewayPaymentId, gatewaySignature } = req.body;
      const result = await paymentService.verifyAndCapturePayment(
        bookingId,
        gatewayOrderId,
        gatewayPaymentId,
        gatewaySignature
      );
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getPaymentForBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentRepository.findByBookingId(req.params.bookingId);
      if (!payment) throw new NotFoundError('Payment not found for this booking');
      const refunds = await paymentRepository.findRefundsByPaymentId(payment.id);
      return res.status(200).json({ success: true, data: { ...payment, refunds } });
    } catch (err) {
      next(err);
    }
  }

  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const event = req.body;
      logger.info('Received payment webhook', undefined, { eventType: event.event || event.type });

      // Handle Razorpay webhook
      if (event.event === 'payment.captured') {
        const paymentEntity = event.payload?.payment?.entity;
        if (paymentEntity?.order_id) {
          const payment = await paymentRepository.findByGatewayOrderId(paymentEntity.order_id);
          if (payment) {
            await paymentService.verifyAndCapturePayment(
              payment.booking_id,
              paymentEntity.order_id,
              paymentEntity.id,
              undefined
            );
          }
        }
      }

      // Handle Stripe webhook
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data?.object;
        if (paymentIntent?.id) {
          const payment = await paymentRepository.findByGatewayOrderId(paymentIntent.id);
          if (payment) {
            await paymentService.verifyAndCapturePayment(
              payment.booking_id,
              paymentIntent.id,
              paymentIntent.id,
              undefined
            );
          }
        }
      }

      return res.status(200).json({ status: 'ok' });
    } catch (err) {
      logger.error('Error handling webhook', err);
      // Return 200 to prevent webhook spam retries for unrecoverable errors
      return res.status(200).json({ status: 'error_logged' });
    }
  }
}

export const paymentController = new PaymentController();
