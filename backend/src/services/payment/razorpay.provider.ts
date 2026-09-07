import crypto from 'crypto';
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

export class RazorpayPaymentProvider implements IPaymentGateway {
  readonly name = PaymentGateway.RAZORPAY;

  async createOrder(params: CreateOrderParams): Promise<PaymentOrderResult> {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      logger.warn('Razorpay credentials missing. Falling back to simulated Razorpay order ID');
      return {
        gateway: this.name,
        orderId: `order_rzp_${Date.now()}`,
        amount: params.amount,
        currency: params.currency,
        keyId: env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      };
    }

    // Real Razorpay API call using standard basic auth
    const authHeader = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: Math.round(params.amount * 100), // Razorpay accepts paise
        currency: params.currency,
        receipt: params.receipt,
        notes: params.notes,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Razorpay order creation failed: ${errorText}`);
    }

    const data: any = await response.json();
    return {
      gateway: this.name,
      orderId: data.id,
      amount: params.amount,
      currency: params.currency,
      keyId: env.RAZORPAY_KEY_ID,
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<boolean> {
    if (!params.signature) return false;
    if (!env.RAZORPAY_KEY_SECRET) {
      // In dev without secret, allow valid mock signature
      return params.signature === 'mock_signature_verified';
    }

    const body = `${params.orderId}|${params.paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    return expectedSignature === params.signature;
  }

  async processRefund(params: ProcessRefundParams): Promise<RefundResult> {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET || !params.gatewayPaymentId) {
      return {
        refundId: `rfnd_rzp_mock_${Date.now()}`,
        amount: params.amount,
        status: RefundStatus.PROCESSED,
      };
    }

    const authHeader = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const response = await fetch(`https://api.razorpay.com/v1/payments/${params.gatewayPaymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: Math.round(params.amount * 100),
        notes: { reason: params.reason },
      }),
    });

    if (!response.ok) {
      throw new Error(`Razorpay refund failed: ${await response.text()}`);
    }

    const data: any = await response.json();
    return {
      refundId: data.id,
      amount: params.amount,
      status: RefundStatus.PROCESSED,
    };
  }
}
