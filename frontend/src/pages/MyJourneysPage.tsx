import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  Car,
  Users,
  Check,
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  MessageSquare
} from 'lucide-react';
import { JourneyStatus, BookingStatus } from '@yatrashare/shared';

export const MyJourneysPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [journeys, setJourneys] = useState<any[]>([]);
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchJourneys = async () => {
    setIsLoading(true);
    try {
      const list = await api.get('/api/journeys/my-journeys');
      setJourneys(list);
      if (list.length > 0 && !selectedJourneyId) {
        setSelectedJourneyId(list[0].id);
      }
    } catch (err) {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPassengers = async (journeyId: string) => {
    try {
      const data = await api.get(`/api/bookings/journey/${journeyId}`);
      setPassengers(data);
    } catch (err) {
      setPassengers([]);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchJourneys();
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedJourneyId) {
      fetchPassengers(selectedJourneyId);
    }
  }, [selectedJourneyId]);

  const handleApproveBooking = async (bookingId: string) => {
    setActionLoading(true);
    try {
      await api.post(`/api/bookings/${bookingId}/approve`);
      if (selectedJourneyId) fetchPassengers(selectedJourneyId);
    } catch (err) {
      // Ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    setActionLoading(true);
    try {
      await api.post(`/api/bookings/${bookingId}/reject`, { reason: 'Driver declined seat request' });
      if (selectedJourneyId) fetchPassengers(selectedJourneyId);
    } catch (err) {
      // Ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (journeyId: string, status: JourneyStatus) => {
    setActionLoading(true);
    try {
      await api.patch(`/api/journeys/${journeyId}/status`, { status });
      await fetchJourneys();
    } catch (err) {
      // Ignore
    } finally {
      setActionLoading(false);
    }
  };

  const currentJourney = journeys.find((j) => j.id === selectedJourneyId);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Host Management Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage your scheduled rides, passenger approvals, and live trips.</p>
        </div>
        <Link
          to="/publish"
          className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-sm shadow-brand-600/20 flex items-center space-x-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish New Journey</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 animate-pulse h-64"></div>
      ) : journeys.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
          <Car className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No scheduled rides published</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Share your intercity trips, reduce travel expenses, and meet verified passengers.
          </p>
          <Link
            to="/publish"
            className="inline-block px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700"
          >
            Publish a Ride
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: List of Rides */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              My Scheduled Trips ({journeys.length})
            </span>
            <div className="space-y-2">
              {journeys.map((j) => {
                const isSelected = j.id === selectedJourneyId;
                const dep = new Date(j.departure_time);
                return (
                  <div
                    key={j.id}
                    onClick={() => setSelectedJourneyId(j.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/50 shadow-sm ring-1 ring-brand-500'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 font-medium">
                        {dep.toLocaleDateString([], { month: 'short', day: 'numeric' })} • {dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {j.status}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-900 truncate">
                      {j.origin_name} ➔ {j.destination_name}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{j.available_seats} of {j.total_seats} seats free</span>
                      <span className="font-bold text-brand-700">₹{j.price_per_seat}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Ride Passenger Roster & Lifecycle Controls */}
          <div className="lg:col-span-2 space-y-6">
            {currentJourney && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                {/* Trip Controls Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {currentJourney.origin_name} ➔ {currentJourney.destination_name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Departure: {new Date(currentJourney.departure_time).toLocaleString()}
                    </p>
                  </div>

                  {/* Lifecycle State Buttons */}
                  <div className="flex items-center space-x-2">
                    {currentJourney.status === JourneyStatus.PUBLISHED && (
                      <button
                        onClick={() => handleUpdateStatus(currentJourney.id, JourneyStatus.IN_PROGRESS)}
                        disabled={actionLoading}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center space-x-1"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Trip</span>
                      </button>
                    )}

                    {currentJourney.status === JourneyStatus.IN_PROGRESS && (
                      <button
                        onClick={() => handleUpdateStatus(currentJourney.id, JourneyStatus.COMPLETED)}
                        disabled={actionLoading}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Finish Trip</span>
                      </button>
                    )}

                    {currentJourney.status !== JourneyStatus.COMPLETED &&
                      currentJourney.status !== JourneyStatus.CANCELLED && (
                        <button
                          onClick={() => handleUpdateStatus(currentJourney.id, JourneyStatus.CANCELLED)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50"
                        >
                          Cancel Ride
                        </button>
                      )}
                  </div>
                </div>

                {/* Passenger Bookings Roster */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Passenger Bookings & Requests ({passengers.length})
                  </span>

                  {passengers.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-500">
                      No passenger booking requests received yet for this journey.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {passengers.map((p) => {
                        const isRequested = p.status === BookingStatus.REQUESTED;
                        const isConfirmed = p.status === BookingStatus.CONFIRMED;

                        return (
                          <div
                            key={p.id}
                            className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center space-x-3">
                              <img
                                src={
                                  p.passenger_avatar ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(p.passenger_name || 'Passenger')}&background=0d9488&color=fff`
                                }
                                alt={p.passenger_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div>
                                <div className="text-xs font-bold text-slate-900">{p.passenger_name}</div>
                                <div className="text-[11px] text-slate-500">
                                  {p.seats_booked} Seat{p.seats_booked > 1 ? 's' : ''} • Contact: {p.passenger_phone || 'Protected'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 self-end sm:self-center">
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                  isConfirmed
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isRequested
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {p.status}
                              </span>

                              {isRequested && (
                                <div className="flex space-x-1.5">
                                  <button
                                    onClick={() => handleApproveBooking(p.id)}
                                    disabled={actionLoading}
                                    className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                                    title="Approve booking request"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRejectBooking(p.id)}
                                    disabled={actionLoading}
                                    className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                                    title="Reject request"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              )}

                              <Link
                                to="/messages"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                                title="Chat with passenger"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
