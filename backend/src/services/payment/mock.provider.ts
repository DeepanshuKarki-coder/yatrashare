import { v4 as uuidv4 } from 'uuid';
import {
  IPaymentGateway,
  CreateOrderParams,
  PaymentOrderResult,
  VerifyPaymentParams,
  ProcessRefundParams,
  RefundResult,
} from './payment.interface';
import { PaymentGateway, RefundStatus } from '@yatrashare/shared';
import { logger } from '../../config/logger';

export class MockPaymentProvider implements IPaymentGateway {
  readonly name = PaymentGateway.MOCK;

  async createOrder(params: CreateOrderParams): Promise<PaymentOrderResult> {
    const orderId = `order_mock_${Date.now()}_${uuidv4().substring(0, 8)}`;
    logger.info(`[MockPayment] Created order ${orderId} for booking ${params.bookingId} of amount ${params.currency} ${params.amount}`);
    return {
      gateway: this.name,
      orderId,
      amount: params.amount,
      currency: params.currency,
      keyId: 'mock_key_yatrashare_dev',
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<boolean> {
    // In mock mode, any valid non-empty payment ID is accepted unless prefixed with 'fail_'
    logger.info(`[MockPayment] Verifying payment for order ${params.orderId} with paymentId ${params.paymentId}`);
    if (params.paymentId.startsWith('fail_')) {
      return false;
    }
    return true;
  }

  async processRefund(params: ProcessRefundParams): Promise<RefundResult> {
    const refundId = `rfnd_mock_${Date.now()}_${uuidv4().substring(0, 8)}`;
    logger.info(`[MockPayment] Processed refund ${refundId} for amount ${params.amount}. Reason: ${params.reason}`);
    return {
      refundId,
      amount: params.amount,
      status: RefundStatus.PROCESSED,
    };
  }
}
