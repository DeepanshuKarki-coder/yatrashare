import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Car,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Star
} from 'lucide-react';
import { VehicleType } from '@yatrashare/shared';

export const MyVehiclesPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // New Vehicle Form State
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [color, setColor] = useState('White');
  const [licensePlate, setLicensePlate] = useState('');
  const [seatCapacity, setSeatCapacity] = useState(4);
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.SEDAN);
  const [amenities, setAmenities] = useState<string[]>(['AC']);
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/api/vehicles/my-vehicles');
      setVehicles(data);
    } catch (err) {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [isAuthenticated]);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/api/vehicles', {
        make,
        model,
        year: Number(year),
        color,
        licensePlate,
        seatCapacity: Number(seatCapacity),
        vehicleType,
        amenities,
        isDefault,
      });

      setIsModalOpen(false);
      // Reset form
      setMake('');
      setModel('');
      setLicensePlate('');
      await fetchVehicles();
    } catch (err: any) {
      setError(err.message || 'Failed to add vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return;
    try {
      await api.delete(`/api/vehicles/${vehicleId}`);
      await fetchVehicles();
    } catch (err: any) {
      alert(err.message || 'Failed to delete vehicle');
    }
  };

  const handleSetDefault = async (vehicleId: string) => {
    try {
      await api.put(`/api/vehicles/${vehicleId}`, { isDefault: true });
      await fetchVehicles();
    } catch (err: any) {
      alert(err.message || 'Failed to update vehicle');
    }
  };

  const availableAmenityOptions = ['AC', 'WIFI', 'USB_CHARGER', 'EXTRA_LUGGAGE', 'CLEAN_AIR'];

  const toggleAmenity = (opt: string) => {
    if (amenities.includes(opt)) {
      setAmenities(amenities.filter((a) => a !== opt));
    } else {
      setAmenities([...amenities, opt]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Vehicle Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Register and manage vehicles you use to host rides.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-sm shadow-brand-600/20 flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-32"></div>
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
          <Car className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No registered vehicles</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add your car details to start hosting rides and offering seats to intercity travelers.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700"
          >
            Add Vehicle Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className={`bg-white rounded-2xl p-5 border shadow-sm space-y-3 relative ${
                v.isDefault ? 'border-brand-500 ring-1 ring-brand-500/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {v.make} {v.model}
                    </h4>
                    <span className="text-[11px] text-slate-500 block">
                      {v.vehicle_type || v.vehicleType} • {v.year} • {v.color}
                    </span>
                  </div>
                </div>

                {v.isDefault ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Default</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetDefault(v.id)}
                    className="text-[10px] font-semibold text-slate-500 hover:text-brand-600"
                  >
                    Set Default
                  </button>
                )}
              </div>

              <div className="bg-slate-50 rounded-xl p-3 flex justify-between text-xs text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">License Plate</span>
                  <span className="font-mono font-bold text-slate-800">{v.license_plate || v.licensePlate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Seat Capacity</span>
                  <span className="font-bold text-slate-800">{v.seat_capacity || v.seatCapacity} seats</span>
                </div>
              </div>

              {v.amenities?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {v.amenities.map((a: string) => (
                    <span
                      key={a}
                      className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-medium"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleDeleteVehicle(v.id)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add Vehicle Information</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Make / Brand</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Honda, Tata, Hyundai"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., City, Nexon, Creta"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Year</label>
                  <input
                    type="number"
                    min={2000}
                    max={new Date().getFullYear() + 1}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Color</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., White, Silver"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value={VehicleType.SEDAN}>Sedan</option>
                    <option value={VehicleType.SUV}>SUV</option>
                    <option value={VehicleType.HATCHBACK}>Hatchback</option>
                    <option value={VehicleType.EV}>EV (Electric)</option>
                    <option value={VehicleType.VAN}>Van</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">License Plate Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., KA01AB1234"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Seats (incl. driver)</label>
                  <input
                    type="number"
                    min={2}
                    max={8}
                    value={seatCapacity}
                    onChange={(e) => setSeatCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {availableAmenityOptions.map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => toggleAmenity(opt)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        amenities.includes(opt)
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 accent-brand-600"
                  />
                  <span className="font-semibold">Set as default vehicle for future journeys</span>
                </label>
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
