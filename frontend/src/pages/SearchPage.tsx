import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { JourneyCard } from '../components/JourneyCard';
import { SearchWidget } from '../components/SearchWidget';
import { BookingModal } from '../components/BookingModal';
import {
  SlidersHorizontal,
  X,
  Search,
  Wind,
  Shield,
  Star,
  Car,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { VehicleType } from '@yatrashare/shared';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const date = searchParams.get('date') || '';
  const seats = Number(searchParams.get('seats')) || 1;

  // Filters
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [vehicleType, setVehicleType] = useState<string>('');
  const [acAvailable, setAcAvailable] = useState<boolean>(false);
  const [womenOnly, setWomenOnly] = useState<boolean>(false);
  const [petsAllowed, setPetsAllowed] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('departureTime');
  const [sortOrder, setSortOrder] = useState<string>('asc');

  const [journeys, setJourneys] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedJourneyForBooking, setSelectedJourneyForBooking] = useState<any | null>(null);

  const fetchJourneys = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        origin,
        destination,
        date: date || undefined,
        seats,
        maxPrice: maxPrice < 2000 ? maxPrice : undefined,
        vehicleType: vehicleType || undefined,
        acAvailable: acAvailable || undefined,
        womenOnly: womenOnly || undefined,
        petsAllowed: petsAllowed || undefined,
        sortBy,
        sortOrder,
      };

      const res = await api.get<{ items: any[]; total: number }>('/api/journeys/search', params);
      setJourneys(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      setJourneys([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJourneys();
  }, [searchParams, maxPrice, vehicleType, acAvailable, womenOnly, petsAllowed, sortBy, sortOrder]);

  const resetFilters = () => {
    setMaxPrice(2000);
    setVehicleType('');
    setAcAvailable(false);
    setWomenOnly(false);
    setPetsAllowed(false);
    setSortBy('departureTime');
    setSortOrder('asc');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Search Widget Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <SearchWidget
          initialOrigin={origin}
          initialDestination={destination}
          initialDate={date}
          initialSeats={seats}
          compact={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-900 flex items-center">
                <SlidersHorizontal className="w-4 h-4 mr-1.5 text-brand-600" />
                Filters
              </span>
              <button
                onClick={resetFilters}
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Sort Results By</label>
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split('_');
                  setSortBy(by);
                  setSortOrder(order);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="departureTime_asc">Earliest Departure</option>
                <option value="departureTime_desc">Latest Departure</option>
                <option value="price_asc">Lowest Price</option>
                <option value="duration_asc">Shortest Duration</option>
                <option value="rating_desc">Highest Driver Rating</option>
              </select>
            </div>

            {/* Max Price Slider */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                <span>Max Price per Seat</span>
                <span className="text-brand-700">₹{maxPrice}{maxPrice >= 2000 ? '+' : ''}</span>
              </div>
              <input
                type="range"
                min={200}
                max={2000}
                step={50}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Vehicle Category</label>
              <div className="space-y-1.5 text-xs text-slate-600">
                {['', VehicleType.SEDAN, VehicleType.SUV, VehicleType.HATCHBACK, VehicleType.EV].map((type) => (
                  <label key={type || 'all'} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="vehicleType"
                      checked={vehicleType === type}
                      onChange={() => setVehicleType(type)}
                      className="accent-brand-600"
                    />
                    <span>{type ? type.charAt(0) + type.slice(1).toLowerCase() : 'All Vehicle Types'}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Amenities & Safety Toggles */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <label className="block text-xs font-bold text-slate-700">Preferences</label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acAvailable}
                  onChange={(e) => setAcAvailable(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 accent-brand-600"
                />
                <span>Air Conditioning (AC)</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={womenOnly}
                  onChange={(e) => setWomenOnly(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 accent-brand-600"
                />
                <span className="text-fuchsia-700 font-semibold">Women-Only Rides</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={petsAllowed}
                  onChange={(e) => setPetsAllowed(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 accent-brand-600"
                />
                <span>Pet-Friendly</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Right Search Results Stream */}
        <main className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {isLoading ? 'Searching verified journeys...' : `${total} ride${total === 1 ? '' : 's'} available`}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-44"></div>
              ))}
            </div>
          ) : journeys.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No matching rides found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We couldn't find any scheduled journeys matching these exact filters. Try broadening your date or adjusting price and preferences.
              </p>
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {journeys.map((j) => (
                <JourneyCard
                  key={j.id}
                  journey={j}
                  onBookClick={(journey) => setSelectedJourneyForBooking(journey)}
                  onCardClick={(journeyId) => navigate(`/journeys/${journeyId}`)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Booking Modal */}
      {selectedJourneyForBooking && (
        <BookingModal
          journey={selectedJourneyForBooking}
          isOpen={!!selectedJourneyForBooking}
          onClose={() => setSelectedJourneyForBooking(null)}
          onSuccess={() => {
            fetchJourneys();
          }}
        />
      )}
    </div>
  );
};
