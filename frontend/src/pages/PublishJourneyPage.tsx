import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Calendar,
  Clock,
  Car,
  DollarSign,
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { LuggagePolicy, UserRole } from '@yatrashare/shared';

export const PublishJourneyPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [originName, setOriginName] = useState('');
  const [originAddress, setOriginAddress] = useState('');
  const [originLat, setOriginLat] = useState(12.9716);
  const [originLng, setOriginLng] = useState(77.5946);

  const [destinationName, setDestinationName] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationLat, setDestinationLat] = useState(12.2958);
  const [destinationLng, setDestinationLng] = useState(76.6394);

  const [waypoints, setWaypoints] = useState<any[]>([]);

  const [departureDate, setDepartureDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [departureTime, setDepartureTime] = useState('08:00');
  const [estimatedDurationMin, setEstimatedDurationMin] = useState(180);
  const [distanceKm, setDistanceKm] = useState(145);

  const [vehicleId, setVehicleId] = useState('');
  const [totalSeats, setTotalSeats] = useState(3);
  const [pricePerSeat, setPricePerSeat] = useState(350);
  const [autoAccept, setAutoAccept] = useState(true);

  const [luggagePolicy, setLuggagePolicy] = useState<LuggagePolicy>(LuggagePolicy.MEDIUM);
  const [acAvailable, setAcAvailable] = useState(true);
  const [musicAllowed, setMusicAllowed] = useState(true);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [smokingAllowed, setSmokingAllowed] = useState(false);
  const [womenOnly, setWomenOnly] = useState(false);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    async function loadVehicles() {
      try {
        const list = await api.get('/api/vehicles/my-vehicles');
        setVehicles(list);
        if (list.length > 0) {
          const defaultV = list.find((v: any) => v.isDefault) || list[0];
          setVehicleId(defaultV.id);
        }
      } catch (err) {
        // Ignore
      }
    }
    loadVehicles();
  }, [isAuthenticated]);

  const addWaypoint = () => {
    setWaypoints([
      ...waypoints,
      {
        placeName: '',
        address: '',
        lat: originLat,
        lng: originLng,
        estimatedTimeOffsetMin: 45,
        priceOffset: 0,
      },
    ]);
  };

  const removeWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
  };

  const updateWaypoint = (index: number, field: string, value: any) => {
    const updated = [...waypoints];
    updated[index][field] = value;
    setWaypoints(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const departureDateTime = new Date(`${departureDate}T${departureTime}:00`).toISOString();

      const payload = {
        vehicleId,
        originName,
        originAddress: originAddress || originName,
        originLat,
        originLng,
        destinationName,
        destinationAddress: destinationAddress || destinationName,
        destinationLat,
        destinationLng,
        distanceKm,
        estimatedDurationMin,
        departureTime: departureDateTime,
        totalSeats,
        pricePerSeat,
        currency: 'INR',
        autoAccept,
        luggagePolicy,
        smokingAllowed,
        petsAllowed,
        musicAllowed,
        acAvailable,
        womenOnly,
        description,
        waypoints,
      };

      const created = await api.post('/api/journeys', payload);
      navigate(`/journeys/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to publish journey');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Publish an Intercity Journey</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Share your empty car seats and reduce travel expenses with verified co-travelers.
        </p>
      </div>

      {/* Wizard Progress Steps */}
      <div className="flex items-center justify-between max-w-md mx-auto px-4">
        {[
          { num: 1, label: 'Route' },
          { num: 2, label: 'Schedule' },
          { num: 3, label: 'Vehicle & Price' },
          { num: 4, label: 'Policies' },
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s.num
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : step > s.num
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {step > s.num ? '✓' : s.num}
            </div>
            <span className="text-[11px] font-semibold text-slate-600 mt-1">{s.label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-3 text-xs text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Multi-step Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        {/* STEP 1: ROUTE */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-base font-bold text-slate-900">Where are you driving?</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Departure Origin City / Area</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Bengaluru (Koramangala Sony World)"
                  value={originName}
                  onChange={(e) => setOriginName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Exact Origin Pickup Address</label>
                <input
                  type="text"
                  placeholder="e.g., Sony World Signal, 80 Feet Rd, Koramangala 4th Block"
                  value={originAddress}
                  onChange={(e) => setOriginAddress(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Destination City / Landmark</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Mysuru (Suburban Bus Stand)"
                  value={destinationName}
                  onChange={(e) => setDestinationName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Exact Drop-off Location</label>
                <input
                  type="text"
                  placeholder="e.g., Near Bus Stand or Highway Toll Gate"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Waypoints */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Intermediate En-route Stops (Optional)</label>
                  <button
                    type="button"
                    onClick={addWaypoint}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Stop</span>
                  </button>
                </div>

                {waypoints.map((wp, idx) => (
                  <div key={idx} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      placeholder="Stop name (e.g., Mandya Highway Exit)"
                      value={wp.placeName}
                      onChange={(e) => updateWaypoint(idx, 'placeName', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeWaypoint(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={!originName || !destinationName}
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              <span>Continue to Schedule</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: SCHEDULE */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-base font-bold text-slate-900">Date & Departure Timing</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Departure Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Departure Time</label>
                <input
                  type="time"
                  required
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Travel Time (Minutes)</label>
                <input
                  type="number"
                  min={30}
                  step={15}
                  value={estimatedDurationMin}
                  onChange={(e) => setEstimatedDurationMin(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Approx. {Math.floor(estimatedDurationMin / 60)}h {estimatedDurationMin % 60}m
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Route Distance (Kilometers)</label>
                <input
                  type="number"
                  min={5}
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-md shadow-brand-600/20 flex items-center justify-center space-x-2"
              >
                <span>Continue to Vehicle & Price</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: VEHICLE & PRICING */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-base font-bold text-slate-900">Vehicle Selection & Pricing</h3>

            {vehicles.length === 0 ? (
              <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3">
                <Car className="w-8 h-8 text-amber-600 mx-auto" />
                <p className="text-xs text-amber-800 font-semibold">
                  You don't have any registered vehicles yet. Please register your car before publishing a journey.
                </p>
                <Link
                  to="/vehicles"
                  className="inline-block px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700"
                >
                  Add Vehicle Now
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Your Vehicle</label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.make} {v.model} ({v.licensePlate || v.license_plate}) - {v.seatCapacity || v.seat_capacity} seats
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Available Seats Offered</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={totalSeats}
                      onChange={(e) => setTotalSeats(Number(e.target.value))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Price per Seat (₹)</label>
                    <input
                      type="number"
                      min={50}
                      step={10}
                      value={pricePerSeat}
                      onChange={(e) => setPricePerSeat(Number(e.target.value))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoAccept}
                      onChange={(e) => setAutoAccept(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 accent-brand-600"
                    />
                    <span className="font-semibold">Instant Booking Approval (No manual driver review needed)</span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!vehicleId}
                onClick={() => setStep(4)}
                className="flex-1 py-3 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-md shadow-brand-600/20 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>Continue to Policies</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: POLICIES & PUBLISH */}
        {step === 4 && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            <h3 className="text-base font-bold text-slate-900">Trip Rules & Preferences</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Max Luggage Size</label>
                <select
                  value={luggagePolicy}
                  onChange={(e) => setLuggagePolicy(e.target.value as LuggagePolicy)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value={LuggagePolicy.SMALL}>Small (Backpack / Laptop bag)</option>
                  <option value={LuggagePolicy.MEDIUM}>Medium (Cabin suitcase)</option>
                  <option value={LuggagePolicy.LARGE}>Large (Trolley bag)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acAvailable}
                    onChange={(e) => setAcAvailable(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 accent-brand-600"
                  />
                  <span>AC on throughout</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={musicAllowed}
                    onChange={(e) => setMusicAllowed(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 accent-brand-600"
                  />
                  <span>Music Allowed</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={petsAllowed}
                    onChange={(e) => setPetsAllowed(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 accent-brand-600"
                  />
                  <span>Pet-Friendly</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smokingAllowed}
                    onChange={(e) => setSmokingAllowed(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 accent-brand-600"
                  />
                  <span>Smoking Allowed</span>
                </label>
              </div>

              <div className="p-3 bg-fuchsia-50 border border-fuchsia-200 rounded-2xl">
                <label className="flex items-center space-x-2.5 text-xs text-fuchsia-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={womenOnly}
                    onChange={(e) => setWomenOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-fuchsia-600 accent-fuchsia-600"
                  />
                  <span className="font-bold">Women-Only Ride (Only verified female travelers can book)</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Trip Notes for Passengers</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share details like highway stops, luggage room, punctuality expectations..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Publishing Schedule...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Publish Journey Now</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
