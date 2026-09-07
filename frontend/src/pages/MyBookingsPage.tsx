import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ReviewModal } from '../components/ReviewModal';
import {
  Calendar,
  Clock,
  Car,
  MapPin,
  XCircle,
  Star,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Receipt,
  RotateCcw
} from 'lucide-react';
import { BookingStatus } from '@yatrashare/shared';

export const MyBookingsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cancellation Modal State
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Review Modal State
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<any | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/api/bookings/my-bookings');
      setBookings(data);
    } catch (err) {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchBookings();
  }, [isAuthenticated]);

  const handleCancelBooking = async () => {
    if (!selectedBookingForCancel) return;
    setIsCancelling(true);
    setCancelError(null);

    try {
      await api.post(`/api/bookings/${selectedBookingForCancel.id}/cancel`, {
        reason: cancelReason || 'Passenger cancelled',
      });
      setSelectedBookingForCancel(null);
      setCancelReason('');
      await fetchBookings();
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const now = new Date();
  const upcomingBookings = bookings.filter((b) => {
    const isPast = new Date(b.departure_time) < now || b.status === BookingStatus.COMPLETED;
    return !isPast;
  });
  const pastBookings = bookings.filter((b) => {
    const isPast = new Date(b.departure_time) < now || b.status === BookingStatus.COMPLETED;
    return isPast;
  });

  const displayedList = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Travel Bookings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage your reserved seats, electronic vouchers, and trip receipts.</p>
        </div>
        <Link
          to="/search"
          className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-sm shadow-brand-600/20 inline-block text-center"
        >
          Book a New Journey
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 px-3 ${
            activeTab === 'upcoming'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Upcoming Rides ({upcomingBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 px-3 ${
            activeTab === 'past'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Past Travel History ({pastBookings.length})
        </button>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-40"></div>
          ))}
        </div>
      ) : displayedList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No {activeTab} journeys found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'upcoming'
              ? 'You do not have any upcoming shared rides booked. Search available routes to find a seat.'
              : 'You have no past completed travel history.'}
          </p>
          <Link
            to="/search"
            className="inline-block px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700"
          >
            Find a Ride
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedList.map((booking) => {
            const depDate = new Date(booking.departure_time);
            const isConfirmed = booking.status === BookingStatus.CONFIRMED;
            const isCancelled = booking.status === BookingStatus.CANCELLED;
            const isCompleted = booking.status === BookingStatus.COMPLETED;

            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all space-y-4"
              >
                {/* Status & Reference Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-slate-400 uppercase font-bold text-[11px]">
                      REF: {booking.id.substring(0, 8)}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        isConfirmed
                          ? 'bg-emerald-100 text-emerald-800'
                          : isCancelled
                          ? 'bg-rose-100 text-rose-800'
                          : isCompleted
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <span className="font-bold text-slate-800">
                    ₹{booking.total_amount} ({booking.seats_booked} seat{booking.seats_booked > 1 ? 's' : ''})
                  </span>
                </div>

                {/* Route & Schedule */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-800 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-brand-600 mr-2 shrink-0"></span>
                      <span className="truncate">{booking.origin_name}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-slate-400 mr-2 shrink-0"></span>
                      <span className="truncate">{booking.destination_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <div className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      <span>{depDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      <span>{depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {/* Driver Info & Action CTAs */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={
                        booking.driver_avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.driver_name || 'Driver')}&background=0d9488&color=fff`
                      }
                      alt={booking.driver_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">{booking.driver_name}</span>
                      <span className="text-[11px] text-slate-400">
                        {booking.vehicle_make} {booking.vehicle_model} ({booking.vehicle_plate})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      to="/messages"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center space-x-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      <span>Chat</span>
                    </Link>

                    {/* Rate Driver Button on Completed Journeys */}
                    {isCompleted && (
                      <button
                        onClick={() => setSelectedBookingForReview(booking)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 font-semibold flex items-center space-x-1 shadow-sm"
                      >
                        <Star className="w-3.5 h-3.5 fill-white" />
                        <span>Rate Driver</span>
                      </button>
                    )}

                    {/* Cancel Button */}
                    {!isCancelled && !isCompleted && (
                      <button
                        onClick={() => setSelectedBookingForCancel(booking)}
                        className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold"
                      >
                        Cancel Ride
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Dialog Modal */}
      {selectedBookingForCancel && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Cancel Booking</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to cancel your seat from <strong>{selectedBookingForCancel.origin_name}</strong> to <strong>{selectedBookingForCancel.destination_name}</strong>?
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800 space-y-1">
              <span className="font-bold block">Cancellation Refund Policy:</span>
              <p className="text-[11px]">
                • &gt;24 hours before departure: 100% full refund<br />
                • 12 to 24 hours: 50% partial refund<br />
                • &lt;12 hours: non-refundable
              </p>
            </div>

            {cancelError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {cancelError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cancellation Reason</label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Change of plans, schedule clash..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setSelectedBookingForCancel(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={isCancelling}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isCancelling ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedBookingForReview && (
        <ReviewModal
          isOpen={!!selectedBookingForReview}
          journeyId={selectedBookingForReview.journey_id}
          reviewedUserId={selectedBookingForReview.driver_id}
          reviewedUserName={selectedBookingForReview.driver_name}
          onClose={() => setSelectedBookingForReview(null)}
          onSuccess={() => {
            fetchBookings();
          }}
        />
      )}
    </div>
  );
};
