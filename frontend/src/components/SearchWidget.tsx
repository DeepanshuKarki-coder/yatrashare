import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, Search, ArrowRightLeft } from 'lucide-react';
import { api } from '../lib/api';

interface SearchWidgetProps {
  initialOrigin?: string;
  initialDestination?: string;
  initialDate?: string;
  initialSeats?: number;
  compact?: boolean;
}

export const SearchWidget: React.FC<SearchWidgetProps> = ({
  initialOrigin = '',
  initialDestination = '',
  initialDate = '',
  initialSeats = 1,
  compact = false,
}) => {
  const navigate = useNavigate();

  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [seats, setSeats] = useState(initialSeats);

  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  // Autocomplete fetch debounce
  useEffect(() => {
    if (origin.length < 2) {
      setOriginSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const places = await api.get('/api/maps/places', { q: origin });
        setOriginSuggestions(places);
      } catch (err) {
        // Ignore
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [origin]);

  useEffect(() => {
    if (destination.length < 2) {
      setDestSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const places = await api.get('/api/maps/places', { q: destination });
        setDestSuggestions(places);
      } catch (err) {
        // Ignore
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [destination]);

  // Click outside dismiss
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(e.target as Node)) {
        setShowOriginDropdown(false);
      }
      if (destRef.current && !destRef.current.contains(e.target as Node)) {
        setShowDestDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (origin) query.append('origin', origin);
    if (destination) query.append('destination', destination);
    if (date) query.append('date', date);
    if (seats) query.append('seats', String(seats));
    navigate(`/search?${query.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className={`bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 sm:p-3 transition-all ${
        compact ? 'w-full' : 'max-w-4xl mx-auto'
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        {/* Origin */}
        <div ref={originRef} className="relative md:col-span-4">
          <div className="flex items-center px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-transparent focus-within:border-brand-500 focus-within:bg-white transition-all">
            <MapPin className="w-5 h-5 text-brand-600 shrink-0 mr-2.5" />
            <div className="w-full">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leaving From</label>
              <input
                type="text"
                placeholder="City, area, or landmark"
                value={origin}
                onChange={(e) => {
                  setOrigin(e.target.value);
                  setShowOriginDropdown(true);
                }}
                onFocus={() => setShowOriginDropdown(true)}
                className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {showOriginDropdown && originSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-56 overflow-y-auto">
              {originSuggestions.map((place) => (
                <div
                  key={place.placeId}
                  onClick={() => {
                    setOrigin(place.name);
                    setShowOriginDropdown(false);
                  }}
                  className="px-3.5 py-2 hover:bg-brand-50 cursor-pointer border-b border-slate-100 last:border-0"
                >
                  <div className="text-xs font-semibold text-slate-800">{place.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{place.address}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Swap button (desktop) */}
        <div className="hidden md:flex md:col-span-1 justify-center">
          <button
            type="button"
            onClick={handleSwap}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-colors"
            title="Swap locations"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Destination */}
        <div ref={destRef} className="relative md:col-span-4">
          <div className="flex items-center px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-transparent focus-within:border-brand-500 focus-within:bg-white transition-all">
            <MapPin className="w-5 h-5 text-amber-500 shrink-0 mr-2.5" />
            <div className="w-full">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Going To</label>
              <input
                type="text"
                placeholder="Destination city or station"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setShowDestDropdown(true);
                }}
                onFocus={() => setShowDestDropdown(true)}
                className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {showDestDropdown && destSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-56 overflow-y-auto">
              {destSuggestions.map((place) => (
                <div
                  key={place.placeId}
                  onClick={() => {
                    setDestination(place.name);
                    setShowDestDropdown(false);
                  }}
                  className="px-3.5 py-2 hover:bg-brand-50 cursor-pointer border-b border-slate-100 last:border-0"
                >
                  <div className="text-xs font-semibold text-slate-800">{place.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{place.address}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Date & Seats combined column */}
        <div className="md:col-span-3 flex items-center space-x-2">
          {/* Date */}
          <div className="flex-1 flex items-center px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-transparent focus-within:border-brand-500 focus-within:bg-white transition-all">
            <Calendar className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
            />
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="h-11 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm flex items-center justify-center space-x-1.5 shadow-md shadow-brand-600/20 transition-all shrink-0"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>
    </form>
  );
};
