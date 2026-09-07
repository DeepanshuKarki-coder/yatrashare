import { PaymentGateway, PaymentStatus, RefundStatus } from '@yatrashare/shared';

export interface CreateOrderParams {
  bookingId: string;
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface PaymentOrderResult {
  gateway: PaymentGateway;
  orderId: string;
  amount: number;
  currency: string;
  keyId?: string; // For client SDK initialization
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature?: string;
}

export interface ProcessRefundParams {
  paymentId: string;
  gatewayPaymentId?: string;
  amount: number;
  reason: string;
}

export interface RefundResult {
  refundId: string;
  amount: number;
  status: RefundStatus;
}

export interface IPaymentGateway {
  name: PaymentGateway;
  createOrder(params: CreateOrderParams): Promise<PaymentOrderResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<boolean>;
  processRefund(params: ProcessRefundParams): Promise<RefundResult>;
}
