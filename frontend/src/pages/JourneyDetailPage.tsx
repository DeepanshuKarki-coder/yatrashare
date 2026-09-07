import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { BookingModal } from '../components/BookingModal';
import { SafetyReportModal } from '../components/SafetyReportModal';
import {
  MapPin,
  Calendar,
  Clock,
  Car,
  ShieldCheck,
  Star,
  Wind,
  Luggage,
  Music,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Users,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';

export const JourneyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [journey, setJourney] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const fetchJourney = async () => {
    setIsLoading(true);
    try {
      const data = await api.get(`/api/journeys/${id}`);
      setJourney(data);
    } catch (err: any) {
      setError(err.message || 'Journey not found');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJourney();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 animate-pulse h-96"></div>
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">{error || 'Journey not found'}</h2>
        <button
          onClick={() => navigate('/search')}
          className="px-5 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold"
        >
          Return to Search
        </button>
      </div>
    );
  }

  const depDate = new Date(journey.departure_time);
  const arrDate = new Date(journey.estimated_arrival_time);
  const availableSeats = journey.available_seats;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to search results
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header & Route Summary */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block">
                  Intercity Scheduled Ride
                </span>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {journey.origin_name} ➔ {journey.destination_name}
                </h1>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Price per seat</span>
                <span className="text-3xl font-extrabold text-brand-700">₹{journey.price_per_seat}</span>
              </div>
            </div>

            {/* Visual Waypoint Route Timeline */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Itinerary & Schedule</h3>

              <div className="relative pl-6 space-y-8 border-l-2 border-brand-500/40 ml-2">
                {/* Origin Stop */}
                <div className="relative">
                  <div className="w-3.5 h-3.5 rounded-full bg-brand-600 border-2 border-white absolute -left-[31px] top-1"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{journey.origin_name}</div>
                      <div className="text-xs text-slate-500">{journey.origin_address}</div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <span className="text-sm font-bold text-slate-900">
                        {depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {depDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Intermediate Waypoints */}
                {journey.waypoints?.map((wp: any) => (
                  <div key={wp.id} className="relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white absolute -left-[29px] top-1.5"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
                          <span>{wp.place_name}</span>
                          <span className="text-[10px] text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                            Stop Order #{wp.stop_order}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">{wp.address}</div>
                      </div>
                      <div className="text-right text-[11px] text-slate-500 shrink-0 ml-4">
                        +{wp.estimated_time_offset_min} mins
                      </div>
                    </div>
                  </div>
                ))}

                {/* Destination Stop */}
                <div className="relative">
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-800 border-2 border-white absolute -left-[31px] top-1"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{journey.destination_name}</div>
                      <div className="text-xs text-slate-500">{journey.destination_address}</div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <span className="text-sm font-bold text-slate-900">
                        {arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {arrDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Notes from Driver */}
            {journey.description && (
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 mb-1">Host Notes</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  {journey.description}
                </p>
              </div>
            )}
          </div>

          {/* Vehicle Specifications */}
          {journey.vehicle && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <Car className="w-4 h-4 mr-1.5 text-slate-500" />
                Vehicle Specifications
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Vehicle</span>
                  <span className="font-bold text-slate-800">{journey.vehicle.make} {journey.vehicle.model}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                  <span className="font-bold text-slate-800">{journey.vehicle.vehicleType}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Registration</span>
                  <span className="font-bold text-slate-800">{journey.vehicle.licensePlate}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Color</span>
                  <span className="font-bold text-slate-800">{journey.vehicle.color}</span>
                </div>
              </div>

              {journey.vehicle.amenities?.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-bold text-slate-700 block mb-2">On-board Amenities</span>
                  <div className="flex flex-wrap gap-2">
                    {journey.vehicle.amenities.map((a: string) => (
                      <span
                        key={a}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-medium"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Travel Rules & Policies */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ride Guidelines & Policies</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center space-x-2 text-slate-700">
                <Luggage className="w-4 h-4 text-slate-400" />
                <span>Luggage: <strong>{journey.luggage_policy}</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <Wind className="w-4 h-4 text-slate-400" />
                <span>AC: <strong>{journey.ac_available ? 'Available' : 'No AC'}</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <Music className="w-4 h-4 text-slate-400" />
                <span>Music: <strong>{journey.music_allowed ? 'Allowed' : 'Quiet Ride'}</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <span>Pets: <strong>{journey.pets_allowed ? 'Allowed' : 'No Pets'}</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <span>Smoking: <strong>{journey.smoking_allowed ? 'Allowed' : 'No Smoking'}</strong></span>
              </div>
              {journey.women_only === 1 && (
                <div className="flex items-center space-x-2 text-fuchsia-700 font-bold">
                  <span>Women-Only Commute</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Sticky Booking & Host Card (1 col) */}
        <div className="space-y-6">
          {/* Booking Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg sticky top-24 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Seat Inventory</span>
                <div className="text-base font-extrabold text-slate-900">
                  {availableSeats > 0 ? (
                    <span className="text-emerald-700">{availableSeats} seats remaining</span>
                  ) : (
                    <span className="text-rose-600">Fully Booked</span>
                  )}
                </div>
              </div>
              <span className="text-2xl font-extrabold text-brand-700">₹{journey.price_per_seat}</span>
            </div>

            <button
              onClick={() => setIsBookingOpen(true)}
              disabled={availableSeats === 0}
              className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>{availableSeats > 0 ? 'Reserve Seat Now' : 'Ride is Full'}</span>
            </button>

            <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Free cancellation up to 24h before departure</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                <span>Idempotent payment with instant receipt voucher</span>
              </div>
            </div>

            {/* Driver Profile Summary Card */}
            {journey.driver && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ride Host</span>
                <div className="flex items-center space-x-3">
                  <img
                    src={
                      journey.driver.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(journey.driver.fullName)}&background=0d9488&color=fff`
                    }
                    alt={journey.driver.fullName}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center">
                      {journey.driver.fullName}
                      {journey.driver.isIdentityVerified && (
                        <ShieldCheck className="w-4 h-4 text-emerald-500 ml-1.5" />
                      )}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-0.5" />
                        {Number(journey.driver.ratingAverage).toFixed(1)}
                      </span>
                      <span>•</span>
                      <span>{journey.driver.completedRidesCount || 0} completed rides</span>
                    </div>
                  </div>
                </div>

                {journey.driver.bio && (
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{journey.driver.bio}"
                  </p>
                )}
              </div>
            )}

            {/* Safety & Report Trigger */}
            <div className="pt-2 text-center">
              <button
                onClick={() => setIsReportOpen(true)}
                className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center justify-center space-x-1 mx-auto transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Report this ride or host</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingOpen && (
        <BookingModal
          journey={journey}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          onSuccess={() => {
            fetchJourney();
          }}
        />
      )}

      {/* Safety Report Modal */}
      {isReportOpen && journey.driver && (
        <SafetyReportModal
          isOpen={isReportOpen}
          reportedUserId={journey.driver.id}
          reportedUserName={journey.driver.fullName}
          journeyId={journey.id}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </div>
  );
};
