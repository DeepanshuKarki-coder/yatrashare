import React from 'react';
import { Star, ShieldCheck, Zap, Users, Car, Wind, Luggage, Music, Clock } from 'lucide-react';
import { JourneyDTO } from '@yatrashare/shared';

interface JourneyCardProps {
  journey: any;
  onBookClick?: (journey: any) => void;
  onCardClick?: (journeyId: string) => void;
}

export const JourneyCard: React.FC<JourneyCardProps> = ({ journey, onBookClick, onCardClick }) => {
  const depDate = new Date(journey.departure_time || journey.departureTime);
  const arrDate = new Date(journey.estimated_arrival_time || journey.estimatedArrivalTime);

  const depTimeStr = depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const arrTimeStr = arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const durationHours = Math.floor((journey.estimated_duration_min || journey.estimatedDurationMin || 0) / 60);
  const durationMins = (journey.estimated_duration_min || journey.estimatedDurationMin || 0) % 60;
  const durationStr = `${durationHours}h ${durationMins > 0 ? `${durationMins}m` : ''}`;

  const availableSeats = journey.available_seats !== undefined ? journey.available_seats : journey.availableSeats;
  const price = journey.price_per_seat || journey.pricePerSeat;
  const driverName = journey.driver_name || journey.driver?.fullName || 'Verified Host';
  const driverAvatar =
    journey.driver_avatar ||
    journey.driver?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(driverName)}&background=0d9488&color=fff`;
  const driverRating = journey.driver_rating || journey.driver?.ratingAverage || 5.0;
  const vehicleName = `${journey.vehicle_make || journey.vehicle?.make || 'Car'} ${journey.vehicle_model || journey.vehicle?.model || ''}`;

  const isWomenOnly = journey.women_only === 1 || journey.womenOnly;
  const isAc = journey.ac_available === 1 || journey.acAvailable;
  const autoAccept = journey.auto_accept === 1 || journey.autoAccept;

  return (
    <div
      onClick={() => onCardClick && onCardClick(journey.id)}
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-brand-500/50 transition-all duration-200 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Top Header: Times, Duration, Price */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-slate-900">{depTimeStr}</span>
              <span className="text-[11px] text-slate-500">{depDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
            </div>

            {/* Visual Route Timeline Line */}
            <div className="flex flex-col items-center px-2">
              <div className="text-[11px] text-slate-500 font-medium flex items-center">
                <Clock className="w-3 h-3 mr-1 text-slate-400" />
                {durationStr}
              </div>
              <div className="w-24 sm:w-36 h-0.5 bg-slate-300 relative my-1.5">
                <div className="w-2 h-2 rounded-full bg-brand-600 absolute -top-[3px] left-0"></div>
                <div className="w-2 h-2 rounded-full bg-slate-400 absolute -top-[3px] right-0"></div>
              </div>
              <span className="text-[10px] text-slate-400">{journey.distance_km || journey.distanceKm} km</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-slate-900">{arrTimeStr}</span>
              <span className="text-[11px] text-slate-500">{arrDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>

          {/* Price per seat */}
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Per Seat</span>
            <span className="text-2xl font-extrabold text-brand-700">₹{price}</span>
          </div>
        </div>

        {/* Addresses */}
        <div className="mt-3.5 space-y-1">
          <div className="flex items-center space-x-2 text-sm text-slate-800 font-semibold truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 shrink-0"></span>
            <span className="truncate">{journey.origin_name || journey.originName}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-800 font-semibold truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"></span>
            <span className="truncate">{journey.destination_name || journey.destinationName}</span>
          </div>
        </div>

        {/* Tags: Women Only, Instant Book, AC */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3.5">
          {isWomenOnly && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200">
              Women-Only Ride
            </span>
          )}
          {autoAccept && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Zap className="w-3 h-3 mr-1" /> Instant Confirmation
            </span>
          )}
          {isAc && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
              <Wind className="w-3 h-3 mr-1 text-slate-500" /> AC Available
            </span>
          )}
        </div>
      </div>

      {/* Footer: Driver Details & Booking Action */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <img
            src={driverAvatar}
            alt={driverName}
            className="w-10 h-10 rounded-full object-cover border border-slate-200"
          />
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-slate-900">{driverName}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
              <span className="flex items-center font-bold text-amber-600">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500 mr-0.5" />
                {Number(driverRating).toFixed(1)}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Car className="w-3 h-3 mr-1 text-slate-400" />
                {vehicleName}
              </span>
            </div>
          </div>
        </div>

        {/* Seat Counter & Action */}
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <span
              className={`text-xs font-bold block ${
                availableSeats === 1 ? 'text-amber-600 animate-pulse' : 'text-slate-600'
              }`}
            >
              {availableSeats === 1 ? 'Only 1 seat left!' : `${availableSeats} seats left`}
            </span>
            <span className="text-[10px] text-slate-400">Total: {journey.total_seats || journey.totalSeats} seats</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookClick && onBookClick(journey);
            }}
            disabled={availableSeats === 0}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              availableSeats > 0
                ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {availableSeats > 0 ? 'Book Seat' : 'Fully Booked'}
          </button>
        </div>
      </div>
    </div>
  );
};
