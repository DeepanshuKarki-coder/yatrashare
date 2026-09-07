import React, { useState } from 'react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  X,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Clock,
  Car,
  Zap,
  Users,
  Receipt
} from 'lucide-react';
import { PaymentGateway, BookingStatus } from '@yatrashare/shared';

interface BookingModalProps {
  journey: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (booking: any) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ journey, isOpen, onClose, onSuccess }) => {
  const { isAuthenticated, user } = useAuth();

  const [seats, setSeats] = useState<number>(1);
  const [gateway, setGateway] = useState<PaymentGateway>(PaymentGateway.MOCK);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  if (!isOpen || !journey) return null;

  const availableSeats = journey.available_seats !== undefined ? journey.available_seats : journey.availableSeats;
  const pricePerSeat = journey.price_per_seat || journey.pricePerSeat;
  const subtotal = Math.round(pricePerSeat * seats * 100) / 100;
  const platformFee = 25.0; // ₹25 platform & safety fee
  const totalAmount = subtotal + platformFee;

  const handleBooking = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create atomic seat reservation
      const booking = await api.post('/api/bookings', {
        journeyId: journey.id,
        seatsBooked: seats,
      });

      // 2. Initiate Payment Order
      const order = await api.post('/api/payments/create-order', {
        bookingId: booking.id,
        gateway,
      });

      // 3. Process Checkout Verification (Mock Simulation or Gateway SDK)
      const mockPaymentId = `pay_mock_${Date.now()}`;
      await api.post('/api/payments/verify', {
        bookingId: booking.id,
        gatewayOrderId: order.gatewayOrderId,
        gatewayPaymentId: mockPaymentId,
        gatewaySignature: 'mock_signature_verified',
      });

      setConfirmedBooking({
        ...booking,
        totalAmount,
        paymentId: mockPaymentId,
        status: BookingStatus.CONFIRMED,
      });

      onSuccess(booking);
    } catch (err: any) {
      setError(err.message || 'Failed to complete booking');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-scale-up">
        {/* Modal Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900">
              {confirmedBooking ? 'Booking Confirmed!' : 'Confirm Your Journey'}
            </h3>
            {!confirmedBooking && (
              <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Instant Lock
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {confirmedBooking ? (
            /* Confirmation Voucher View */
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <CheckCircle className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-lg font-extrabold text-slate-900">Seat Reserved Successfully!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Your electronic ticket receipt and driver contact info are active.
                </p>
              </div>

              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking Reference:</span>
                  <span className="font-mono font-bold text-slate-800">{confirmedBooking.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Route:</span>
                  <span className="font-semibold text-slate-800">{journey.origin_name || journey.originName} ➔ {journey.destination_name || journey.destinationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Seats Reserved:</span>
                  <span className="font-semibold text-slate-800">{confirmedBooking.seats_booked || seats} Passengers</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Paid:</span>
                  <span className="font-bold text-brand-700">₹{totalAmount}</span>
                </div>
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = '/bookings';
                  }}
                  className="flex-1 py-3 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 shadow-md shadow-brand-600/20 transition-all"
                >
                  View My Tickets
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Checkout & Reservation Form */
            <div className="space-y-5">
              {/* Journey Route Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center font-medium">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {new Date(journey.departure_time || journey.departureTime).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center font-medium">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {new Date(journey.departure_time || journey.departureTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="pt-1">
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    {journey.origin_name || journey.originName}
                  </div>
                  <div className="text-[11px] text-slate-400">➔ {journey.destination_name || journey.destinationName}</div>
                </div>
              </div>

              {/* Seat Selection */}
              <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-2xl">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">Number of Seats</label>
                  <span className="text-[11px] text-slate-500">Max available: {availableSeats} seats</span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setSeats((prev) => Math.max(1, prev - 1))}
                    disabled={seats <= 1}
                    className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold flex items-center justify-center disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="text-sm font-bold text-slate-900 w-4 text-center">{seats}</span>
                  <button
                    type="button"
                    onClick={() => setSeats((prev) => Math.min(availableSeats, prev + 1))}
                    disabled={seats >= availableSeats}
                    className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold flex items-center justify-center disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Payment Gateway Chooser */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-2">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGateway(PaymentGateway.MOCK)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      gateway === PaymentGateway.MOCK
                        ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-[11px] font-bold text-slate-800">Test Simulator</span>
                    <span className="text-[10px] text-slate-500">Instant UPI/Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGateway(PaymentGateway.RAZORPAY)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      gateway === PaymentGateway.RAZORPAY
                        ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-[11px] font-bold text-slate-800">Razorpay</span>
                    <span className="text-[10px] text-slate-500">UPI / GPay / Net</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGateway(PaymentGateway.STRIPE)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      gateway === PaymentGateway.STRIPE
                        ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-[11px] font-bold text-slate-800">Stripe</span>
                    <span className="text-[10px] text-slate-500">Debit / Credit</span>
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Fare (₹{pricePerSeat} × {seats} seat{seats > 1 ? 's' : ''})</span>
                  <span className="font-semibold text-slate-800">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform & Traveler Safety Protection</span>
                  <span className="font-semibold text-slate-800">₹{platformFee}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-brand-700">₹{totalAmount}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleBooking}
                disabled={isProcessing || availableSeats === 0}
                className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-brand-600/20 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Securing Seat & Authorizing Payment...
                  </span>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay ₹{totalAmount} & Confirm Booking</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center space-x-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>100% Refundable up to 24h before departure</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
