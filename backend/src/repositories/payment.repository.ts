import { db, DatabaseClient } from '../models/db';
import { PaymentGateway, PaymentStatus, RefundStatus } from '@yatrashare/shared';

export interface PaymentRecord {
  id: string;
  booking_id: string;
  payer_id: string;
  gateway: PaymentGateway;
  gateway_order_id: string;
  gateway_payment_id?: string | null;
  gateway_signature?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  raw_response?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RefundRecord {
  id: string;
  payment_id: string;
  amount: number;
  gateway_refund_id?: string | null;
  reason: string;
  status: RefundStatus;
  processed_at?: string | null;
  created_at: string;
}

export class PaymentRepository {
  async findById(id: string, client?: DatabaseClient): Promise<PaymentRecord | null> {
    const runner = client || db;
    return runner.queryOne<PaymentRecord>('SELECT * FROM payments WHERE id = $1', [id]);
  }

  async findByBookingId(bookingId: string, client?: DatabaseClient): Promise<PaymentRecord | null> {
    const runner = client || db;
    return runner.queryOne<PaymentRecord>('SELECT * FROM payments WHERE booking_id = $1', [bookingId]);
  }

  async findByGatewayOrderId(orderId: string, client?: DatabaseClient): Promise<PaymentRecord | null> {
    const runner = client || db;
    return runner.queryOne<PaymentRecord>('SELECT * FROM payments WHERE gateway_order_id = $1', [orderId]);
  }

  async createPayment(payment: Omit<PaymentRecord, 'created_at' | 'updated_at'>, client?: DatabaseClient): Promise<PaymentRecord> {
    const runner = client || db;
    const now = new Date().toISOString();

    await runner.execute(
      `INSERT INTO payments (id, booking_id, payer_id, gateway, gateway_order_id, gateway_payment_id, gateway_signature, amount, currency, status, raw_response, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        payment.id, payment.booking_id, payment.payer_id, payment.gateway, payment.gateway_order_id,
        payment.gateway_payment_id || null, payment.gateway_signature || null, payment.amount,
        payment.currency, payment.status, payment.raw_response || null, now, now
      ]
    );

    const created = await this.findById(payment.id, runner);
    if (!created) throw new Error('Payment record creation failed');
    return created;
  }

  async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    gatewayPaymentId?: string,
    signature?: string,
    rawResponse?: string,
    client?: DatabaseClient
  ): Promise<void> {
    const runner = client || db;
    const now = new Date().toISOString();
    await runner.execute(
      `UPDATE payments
       SET status = $1, gateway_payment_id = COALESCE($2, gateway_payment_id),
           gateway_signature = COALESCE($3, gateway_signature),
           raw_response = COALESCE($4, raw_response),
           updated_at = $5
       WHERE id = $6`,
      [status, gatewayPaymentId || null, signature || null, rawResponse || null, now, id]
    );
  }

  async createRefund(refund: Omit<RefundRecord, 'created_at'>, client?: DatabaseClient): Promise<RefundRecord> {
    const runner = client || db;
    const now = new Date().toISOString();

    await runner.execute(
      `INSERT INTO refunds (id, payment_id, amount, gateway_refund_id, reason, status, processed_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        refund.id, refund.payment_id, refund.amount, refund.gateway_refund_id || null,
        refund.reason, refund.status, refund.processed_at || null, now
      ]
    );

    const created = await runner.queryOne<RefundRecord>('SELECT * FROM refunds WHERE id = $1', [refund.id]);
    if (!created) throw new Error('Refund creation failed');
    return created;
  }

  async findRefundsByPaymentId(paymentId: string): Promise<RefundRecord[]> {
    return db.query<RefundRecord>('SELECT * FROM refunds WHERE payment_id = $1 ORDER BY created_at DESC', [paymentId]);
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<{ items: any[]; total: number }> {
    const sql = `
      SELECT p.*, b.journey_id, u.full_name as payer_name, u.email as payer_email
      FROM payments p
      JOIN users u ON p.payer_id = u.id
      JOIN bookings b ON p.booking_id = b.id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const countRes = await db.queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM payments');
    const items = await db.query(sql, [limit, offset]);
    return { items, total: countRes?.cnt || 0 };
  }
}

export const paymentRepository = new PaymentRepository();
