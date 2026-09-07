import { v4 as uuidv4 } from 'uuid';
import { IPaymentGateway } from './payment.interface';
import { MockPaymentProvider } from './mock.provider';
import { RazorpayPaymentProvider } from './razorpay.provider';
import { StripePaymentProvider } from './stripe.provider';
import { paymentRepository } from '../../repositories/payment.repository';
import { bookingRepository } from '../../repositories/booking.repository';
import { PaymentGateway, PaymentStatus, BookingStatus, RefundStatus } from '@yatrashare/shared';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export class PaymentService {
  private providers: Map<PaymentGateway, IPaymentGateway> = new Map();

  constructor() {
    this.registerProvider(new MockPaymentProvider());
    this.registerProvider(new RazorpayPaymentProvider());
    this.registerProvider(new StripePaymentProvider());
  }

  private registerProvider(provider: IPaymentGateway) {
    this.providers.set(provider.name, provider);
  }

  private getProvider(gateway?: PaymentGateway): IPaymentGateway {
    const selected = gateway || (env.PAYMENT_GATEWAY_DEFAULT as PaymentGateway) || PaymentGateway.MOCK;
    const provider = this.providers.get(selected);
    if (!provider) {
      throw new BadRequestError(`Unsupported payment gateway: ${selected}`);
    }
    return provider;
  }

  async createOrder(bookingId: string, payerId: string, gatewayChoice?: PaymentGateway) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.passenger_id !== payerId) throw new BadRequestError('Unauthorized to pay for this booking');
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REJECTED) {
      throw new BadRequestError(`Cannot pay for a ${booking.status} booking`);
    }

    const existingPayment = await paymentRepository.findByBookingId(bookingId);
    if (existingPayment && existingPayment.status === PaymentStatus.CAPTURED) {
      throw new BadRequestError('Booking is already paid');
    }

    const provider = this.getProvider(gatewayChoice);
    const orderResult = await provider.createOrder({
      bookingId: booking.id,
      amount: booking.total_amount,
      currency: booking.currency,
      receipt: `rcpt_${booking.id.substring(0, 8)}`,
      notes: { bookingId: booking.id, passengerId: booking.passenger_id },
    });

    if (existingPayment) {
      await paymentRepository.updatePaymentStatus(existingPayment.id, PaymentStatus.PENDING, undefined, undefined, JSON.stringify(orderResult));
      return {
        paymentId: existingPayment.id,
        gatewayOrderId: orderResult.orderId,
        amount: orderResult.amount,
        currency: orderResult.currency,
        gateway: orderResult.gateway,
        keyId: orderResult.keyId,
      };
    }

    const newPaymentId = uuidv4();
    await paymentRepository.createPayment({
      id: newPaymentId,
      booking_id: booking.id,
      payer_id: payerId,
      gateway: orderResult.gateway,
      gateway_order_id: orderResult.orderId,
      amount: orderResult.amount,
      currency: orderResult.currency,
      status: PaymentStatus.PENDING,
      raw_response: JSON.stringify(orderResult),
    });

    return {
      paymentId: newPaymentId,
      gatewayOrderId: orderResult.orderId,
      amount: orderResult.amount,
      currency: orderResult.currency,
      gateway: orderResult.gateway,
      keyId: orderResult.keyId,
    };
  }

  async verifyAndCapturePayment(
    bookingId: string,
    gatewayOrderId: string,
    gatewayPaymentId: string,
    signature?: string
  ) {
    const payment = await paymentRepository.findByBookingId(bookingId);
    if (!payment) throw new NotFoundError('Payment record not found');
    if (payment.status === PaymentStatus.CAPTURED) {
      return { success: true, message: 'Payment already verified' };
    }

    const provider = this.getProvider(payment.gateway);
    const isValid = await provider.verifyPayment({
      orderId: gatewayOrderId,
      paymentId: gatewayPaymentId,
      signature,
    });

    if (!isValid) {
      await paymentRepository.updatePaymentStatus(payment.id, PaymentStatus.FAILED, gatewayPaymentId, signature);
      throw new BadRequestError('Payment signature or verification failed');
    }

    await paymentRepository.updatePaymentStatus(
      payment.id,
      PaymentStatus.CAPTURED,
      gatewayPaymentId,
      signature,
      JSON.stringify({ verifiedAt: new Date().toISOString() })
    );

    // Update booking status to CONFIRMED
    await bookingRepository.updateStatus(bookingId, BookingStatus.CONFIRMED);

    logger.info(`Successfully captured payment ${payment.id} for booking ${bookingId}`);
    return { success: true, bookingId, paymentId: payment.id, status: PaymentStatus.CAPTURED };
  }

  async processRefund(bookingId: string, amountToRefund: number, reason: string) {
    const payment = await paymentRepository.findByBookingId(bookingId);
    if (!payment || payment.status !== PaymentStatus.CAPTURED) {
      logger.warn(`No captured payment found to refund for booking ${bookingId}`);
      return null;
    }

    const provider = this.getProvider(payment.gateway);
    const refundResult = await provider.processRefund({
      paymentId: payment.id,
      gatewayPaymentId: payment.gateway_payment_id || undefined,
      amount: amountToRefund,
      reason,
    });

    const refundId = uuidv4();
    const createdRefund = await paymentRepository.createRefund({
      id: refundId,
      payment_id: payment.id,
      amount: amountToRefund,
      gateway_refund_id: refundResult.refundId,
      reason,
      status: refundResult.status,
      processed_at: new Date().toISOString(),
    });

    await paymentRepository.updatePaymentStatus(
      payment.id,
      amountToRefund >= payment.amount ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED
    );

    return createdRefund;
  }
}

export const paymentService = new PaymentService();
