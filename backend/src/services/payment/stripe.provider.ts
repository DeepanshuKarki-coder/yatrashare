import {
  IPaymentGateway,
  CreateOrderParams,
  PaymentOrderResult,
  VerifyPaymentParams,
  ProcessRefundParams,
  RefundResult,
} from './payment.interface';
import { PaymentGateway, RefundStatus } from '@yatrashare/shared';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export class StripePaymentProvider implements IPaymentGateway {
  readonly name = PaymentGateway.STRIPE;

  async createOrder(params: CreateOrderParams): Promise<PaymentOrderResult> {
    if (!env.STRIPE_SECRET_KEY) {
      logger.warn('Stripe secret key missing. Falling back to simulated Stripe payment intent');
      return {
        gateway: this.name,
        orderId: `pi_mock_${Date.now()}`,
        amount: params.amount,
        currency: params.currency.toLowerCase(),
      };
    }

    const body = new URLSearchParams({
      amount: String(Math.round(params.amount * 100)),
      currency: params.currency.toLowerCase(),
      'metadata[bookingId]': params.bookingId,
    });

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`Stripe PaymentIntent failed: ${await response.text()}`);
    }

    const data: any = await response.json();
    return {
      gateway: this.name,
      orderId: data.id,
      amount: params.amount,
      currency: params.currency,
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<boolean> {
    if (!env.STRIPE_SECRET_KEY) {
      return !params.paymentId.startsWith('fail_');
    }

    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${params.orderId}`, {
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      },
    });

    if (!response.ok) return false;
    const data: any = await response.json();
    return data.status === 'succeeded';
  }

  async processRefund(params: ProcessRefundParams): Promise<RefundResult> {
    if (!env.STRIPE_SECRET_KEY || !params.gatewayPaymentId) {
      return {
        refundId: `re_mock_${Date.now()}`,
        amount: params.amount,
        status: RefundStatus.PROCESSED,
      };
    }

    const body = new URLSearchParams({
      payment_intent: params.gatewayPaymentId,
      amount: String(Math.round(params.amount * 100)),
      reason: 'requested_by_customer',
    });

    const response = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`Stripe refund failed: ${await response.text()}`);
    }

    const data: any = await response.json();
    return {
      refundId: data.id,
      amount: params.amount,
      status: RefundStatus.PROCESSED,
    };
  }
}
