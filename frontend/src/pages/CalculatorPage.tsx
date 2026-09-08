import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator as CalcIcon,
  Car,
  Fuel,
  IndianRupee,
  Users,
  Leaf,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Share2,
  Copy,
  Check,
  RotateCcw,
  Zap,
  MapPin,
  Percent,
  Plus,
  Minus,
  X as Multiply,
  Divide,
  Equal
} from 'lucide-react';

interface RoutePreset {
  name: string;
  origin: string;
  destination: string;
  distanceKm: number;
  tollEstimate: number;
}

const ROUTE_PRESETS: RoutePreset[] = [
  { name: 'Pune ⇄ Mumbai', origin: 'Pune', destination: 'Mumbai', distanceKm: 148, tollEstimate: 320 },
  { name: 'Bengaluru ⇄ Mysuru', origin: 'Bengaluru', destination: 'Mysuru', distanceKm: 145, tollEstimate: 280 },
  { name: 'Delhi ⇄ Jaipur', origin: 'Delhi', destination: 'Jaipur', distanceKm: 280, tollEstimate: 450 },
  { name: 'Chennai ⇄ Puducherry', origin: 'Chennai', destination: 'Puducherry', distanceKm: 155, tollEstimate: 160 },
  { name: 'Hyderabad ⇄ Vijayawada', origin: 'Hyderabad', destination: 'Vijayawada', distanceKm: 275, tollEstimate: 390 },
];

export const CalculatorPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'fare' | 'split' | 'standard'>('fare');

  // --- TAB 1: RIDE FARE & SAVINGS CALCULATOR STATE ---
  const [distanceKm, setDistanceKm] = useState<number>(148);
  const [fuelType, setFuelType] = useState<'petrol' | 'diesel' | 'cng' | 'ev'>('petrol');
  const [fuelPrice, setFuelPrice] = useState<number>(103);
  const [mileage, setMileage] = useState<number>(16);
  const [tolls, setTolls] = useState<number>(320);
  const [passengers, setPassengers] = useState<number>(3);
  const [wearAndTearPerKm, setWearAndTearPerKm] = useState<number>(1.2);
  const [activePreset, setActivePreset] = useState<string>('Pune ⇄ Mumbai');

  // Calculations
  const fuelNeeded = fuelType === 'ev' ? (distanceKm * 0.15) : (distanceKm / mileage); // kWh for EV or Liters for fuel
  const fuelCost = Math.round(fuelNeeded * fuelPrice);
  const wearCost = Math.round(distanceKm * wearAndTearPerKm);
  const totalTripCost = fuelCost + tolls + wearCost;

  // Total riders = driver (1) + passengers
  const totalPeople = passengers + 1;
  const recommendedPricePerSeat = Math.round(totalTripCost / totalPeople);
  const driverMoneyRecovered = recommendedPricePerSeat * passengers;
  const driverFinalCost = totalTripCost - driverMoneyRecovered;
  const driverSavingsPercent = Math.min(95, Math.round((driverMoneyRecovered / totalTripCost) * 100));

  // Comparison with Solo Cab (Avg ₹18/km + tolls + return tax)
  const soloCabCost = Math.round(distanceKm * 18 + tolls + 300);
  const passengerSavings = Math.max(0, soloCabCost - recommendedPricePerSeat);
  const passengerSavingsPercent = Math.round((passengerSavings / soloCabCost) * 100);

  // Carbon Emission Savings (avg 120g CO2/km per solo car passenger eliminated)
  const co2SavedKg = Math.round(distanceKm * 0.12 * passengers * 10) / 10;
  const treesEquivalent = Math.round((co2SavedKg / 20) * 10) / 10;

  const handleFuelTypeChange = (type: 'petrol' | 'diesel' | 'cng' | 'ev') => {
    setFuelType(type);
    if (type === 'petrol') {
      setFuelPrice(103);
      setMileage(16);
    } else if (type === 'diesel') {
      setFuelPrice(90);
      setMileage(19);
    } else if (type === 'cng') {
      setFuelPrice(85);
      setMileage(24);
    } else if (type === 'ev') {
      setFuelPrice(8); // ₹8 per kWh
      setMileage(6.5); // 6.5 km per kWh
    }
  };

  const handleApplyPreset = (preset: RoutePreset) => {
    setActivePreset(preset.name);
    setDistanceKm(preset.distanceKm);
    setTolls(preset.tollEstimate);
  };

  // --- TAB 2: SPLIT BILL CALCULATOR STATE ---
  const [splitTotal, setSplitTotal] = useState<number>(2400);
  const [splitPeople, setSplitPeople] = useState<number>(4);
  const [splitTipPercent, setSplitTipPercent] = useState<number>(0);
  const [driverExempt, setDriverExempt] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  const effectiveTip = Math.round((splitTotal * splitTipPercent) / 100);
  const grandTotal = splitTotal + effectiveTip;
  const payingPeople = driverExempt ? Math.max(1, splitPeople - 1) : splitPeople;
  const perPersonShare = Math.round(grandTotal / payingPeople);

  const copySplitSummary = () => {
    const summary = `🚗 YatraShare Ride Expense Split:\n` +
      `Total Bill: ₹${splitTotal}\n` +
      (effectiveTip > 0 ? `Tip/Tolls: ₹${effectiveTip}\n` : '') +
      `Grand Total: ₹${grandTotal}\n` +
      `People Sharing: ${splitPeople} ${driverExempt ? '(Driver Exempted)' : ''}\n` +
      `👉 Per Person Share: ₹${perPersonShare}\n` +
      `Generated via YatraShare Cost Calculator`;

    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // --- TAB 3: STANDARD ON-THE-GO CALCULATOR STATE ---
  const [display, setDisplay] = useState<string>('0');
  const [calcHistory, setCalcHistory] = useState<string>('');
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState<boolean>(false);

  const handleDigit = (digit: string) => {
    if (display === '0' || overwrite) {
      setDisplay(digit);
      setOverwrite(false);
    } else {
      if (digit === '.' && display.includes('.')) return;
      setDisplay(display + digit);
    }
  };

  const handleOperator = (op: string) => {
    const current = parseFloat(display);
    if (prevVal === null) {
      setPrevVal(current);
      setCalcHistory(`${current} ${op}`);
    } else if (operation) {
      const result = compute(prevVal, current, operation);
      setPrevVal(result);
      setDisplay(String(result));
      setCalcHistory(`${result} ${op}`);
    }
    setOperation(op);
    setOverwrite(true);
  };

  const compute = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? Math.round((a / b) * 100000) / 100000 : 0;
      case '%': return (a * b) / 100;
      default: return b;
    }
  };

  const handleEquals = () => {
    if (prevVal !== null && operation !== null) {
      const current = parseFloat(display);
      const result = compute(prevVal, current, operation);
      setCalcHistory(`${prevVal} ${operation} ${current} =`);
      setDisplay(String(result));
      setPrevVal(null);
      setOperation(null);
      setOverwrite(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevVal(null);
    setOperation(null);
    setCalcHistory('');
    setOverwrite(false);
  };

  const handleToggleSign = () => {
    const current = parseFloat(display);
    setDisplay(String(-current));
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Smart Travel Utilities
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Yatra<span className="text-primary-600">Share</span> Travel Cost & Split Calculator
          </h1>
          <p className="mt-2 text-slate-600 text-sm sm:text-base">
            Accurately calculate intercity driving costs, recommended seat fares, commuter savings vs taxis, and split trip expenses effortlessly.
          </p>

          {/* Tab Switcher */}
          <div className="mt-8 flex justify-center">
            <div className="bg-slate-200/80 p-1.5 rounded-2xl flex gap-1.5 shadow-inner">
              <button
                onClick={() => setActiveTab('fare')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
                  activeTab === 'fare'
                    ? 'bg-white text-primary-700 shadow-md shadow-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                <Car className="w-4 h-4" />
                Ride Cost & Savings
              </button>

              <button
                onClick={() => setActiveTab('split')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
                  activeTab === 'split'
                    ? 'bg-white text-primary-700 shadow-md shadow-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                <Users className="w-4 h-4" />
                Expense & Toll Splitter
              </button>

              <button
                onClick={() => setActiveTab('standard')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
                  activeTab === 'standard'
                    ? 'bg-white text-primary-700 shadow-md shadow-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                <CalcIcon className="w-4 h-4" />
                Quick Math Tool
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: RIDE FARE & SAVINGS CALCULATOR */}
        {activeTab === 'fare' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form & Sliders */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Popular Route Corridors
                </label>
                <div className="flex flex-wrap gap-2">
                  {ROUTE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        activePreset === preset.name
                          ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.name} ({preset.distanceKm} km)
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance Slider */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary-600" /> One-Way Trip Distance
                  </span>
                  <span className="text-lg font-black text-primary-700 bg-primary-50 px-3 py-0.5 rounded-lg">
                    {distanceKm} km
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="800"
                  step="5"
                  value={distanceKm}
                  onChange={(e) => {
                    setDistanceKm(Number(e.target.value));
                    setActivePreset('');
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>20 km (Short commute)</span>
                  <span>400 km</span>
                  <span>800 km (Long intercity)</span>
                </div>
              </div>

              {/* Fuel Type Selector */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Vehicle Fuel / Power Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'petrol', label: 'Petrol', icon: Fuel },
                    { id: 'diesel', label: 'Diesel', icon: Fuel },
                    { id: 'cng', label: 'CNG', icon: Fuel },
                    { id: 'ev', label: 'Electric EV', icon: Zap },
                  ].map((f) => {
                    const Icon = f.icon;
                    const isSelected = fuelType === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleFuelTypeChange(f.id as any)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition ${
                          isSelected
                            ? 'border-primary-600 bg-primary-50 text-primary-800 ring-2 ring-primary-500/20 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-primary-600' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold">{f.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fuel Price & Mileage Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {fuelType === 'ev' ? 'Electricity Cost (₹/kWh)' : 'Fuel Price (₹/L or kg)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      min="1"
                      value={fuelPrice}
                      onChange={(e) => setFuelPrice(Math.max(1, Number(e.target.value)))}
                      className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {fuelType === 'ev' ? 'Efficiency (km/kWh)' : 'Vehicle Mileage (km/L)'}
                  </label>
                  <input
                    type="number"
                    min="3"
                    step="0.5"
                    value={mileage}
                    onChange={(e) => setMileage(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Tolls & Passengers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Estimated Highway Tolls (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={tolls}
                      onChange={(e) => setTolls(Math.max(0, Number(e.target.value)))}
                      className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Co-passengers Sharing Seats
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPassengers(num)}
                        className={`py-2 rounded-xl text-xs font-black transition ${
                          passengers === num
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {num} {num === 1 ? 'seat' : 'seats'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Maintenance buffer toggle */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Vehicle maintenance allowance (tires, oil, engine wear)</span>
                <span className="font-bold text-slate-800">₹{wearAndTearPerKm}/km</span>
              </div>
            </div>

            {/* Right Column: Calculations & Results Card */}
            <div className="lg:col-span-5 space-y-6">
              {/* Highlight Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-7 shadow-xl relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary-500/20 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-300">
                    Recommended Seat Price
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    Fair Share
                  </span>
                </div>

                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    ₹{recommendedPricePerSeat}
                  </span>
                  <span className="text-sm font-normal text-slate-300">/ passenger seat</span>
                </div>

                <p className="text-xs text-slate-300 mb-6">
                  Splits fuel, tolls & maintenance evenly across {totalPeople} people ({passengers} passengers + driver).
                </p>

                {/* Savings Matrix */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700/60">
                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                    <div className="text-[11px] font-semibold text-slate-400">Driver Recovers</div>
                    <div className="text-xl font-black text-emerald-400 mt-0.5">
                      ₹{driverMoneyRecovered}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {driverSavingsPercent}% of driving cost
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                    <div className="text-[11px] font-semibold text-slate-400">Passenger Saves</div>
                    <div className="text-xl font-black text-primary-400 mt-0.5">
                      ₹{passengerSavings}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {passengerSavingsPercent}% vs solo cab
                    </div>
                  </div>
                </div>

                {/* Call to Actions */}
                <div className="mt-6 space-y-2.5">
                  <button
                    onClick={() => navigate('/publish')}
                    className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <span>Publish Ride at ₹{recommendedPricePerSeat}/seat</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => navigate('/search')}
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition text-xs border border-slate-700"
                  >
                    Search Rides on this Route
                  </button>
                </div>
              </div>

              {/* Expense Breakdown Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Trip Cost Breakdown
                </h3>

                <div className="flex justify-between text-sm py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Fuel Required ({fuelNeeded.toFixed(1)} {fuelType === 'ev' ? 'kWh' : 'L'})</span>
                  <span className="font-semibold text-slate-900">₹{fuelCost}</span>
                </div>

                <div className="flex justify-between text-sm py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Highway Tolls</span>
                  <span className="font-semibold text-slate-900">₹{tolls}</span>
                </div>

                <div className="flex justify-between text-sm py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Vehicle Wear & Tear Buffer</span>
                  <span className="font-semibold text-slate-900">₹{wearCost}</span>
                </div>

                <div className="flex justify-between text-sm pt-2 font-bold text-slate-900">
                  <span>Total Single-Vehicle Driving Expense</span>
                  <span className="text-primary-700">₹{totalTripCost}</span>
                </div>
              </div>

              {/* Green Eco-Impact Card */}
              <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-200/80 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm">Carbon Savings from Carpooling</h4>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    By sharing {passengers} seats on this {distanceKm} km route instead of taking separate cars, you prevent approximately <strong>{co2SavedKg} kg of CO₂</strong> emissions (equivalent to <strong>{treesEquivalent} trees</strong> working for a year)!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXPENSE & TOLL SPLITTER */}
        {activeTab === 'split' && (
          <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Shared Expense & Bill Splitter</h2>
              <p className="text-xs text-slate-500 mt-0.5">Quickly split highway tolls, refreshments, or irregular fuel bills with your travelers.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Total Shared Expense (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={splitTotal}
                    onChange={(e) => setSplitTotal(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Number of People
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSplitPeople(Math.max(1, splitPeople - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition"
                  >
                    -
                  </button>
                  <span className="text-lg font-black text-slate-800 w-12 text-center">
                    {splitPeople}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSplitPeople(splitPeople + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Extra Tip / Toll Surcharge */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Optional Buffer / Tip
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 5, 10, 15].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setSplitTipPercent(pct)}
                      className={`py-2 rounded-xl text-xs font-bold transition ${
                        splitTipPercent === pct
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Driver Exempt toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-800">Exempt Driver from Bill?</div>
                  <div className="text-[11px] text-slate-500">Only passengers split the cost (car owner drives for free)</div>
                </div>
                <input
                  type="checkbox"
                  checked={driverExempt}
                  onChange={(e) => setDriverExempt(e.target.checked)}
                  className="w-5 h-5 accent-primary-600 cursor-pointer rounded"
                />
              </div>

              {/* Summary Calculation Banner */}
              <div className="bg-primary-50 rounded-2xl p-6 border border-primary-200 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-primary-700">
                  Each Person Pays
                </span>
                <div className="text-4xl font-black text-primary-800 mt-1">
                  ₹{perPersonShare}
                </div>
                <p className="text-xs text-primary-600 mt-1">
                  Total ₹{grandTotal} split across {payingPeople} paying {payingPeople === 1 ? 'person' : 'people'}
                </p>

                <button
                  type="button"
                  onClick={copySplitSummary}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  {copiedSummary ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSummary ? 'Copied to Clipboard!' : 'Copy Summary to Share'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STANDARD ON-THE-GO CALCULATOR */}
        {activeTab === 'standard' && (
          <div className="max-w-sm mx-auto bg-slate-900 text-white p-6 rounded-3xl shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-xs text-slate-400 font-bold uppercase tracking-wider">
              <span>Quick Roadside Math</span>
              <button onClick={handleClear} className="hover:text-white transition">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Calculator Display */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-right mb-5">
              <div className="text-xs text-slate-500 font-mono h-5 overflow-hidden truncate">
                {calcHistory || ' '}
              </div>
              <div className="text-3xl font-mono font-bold tracking-tight text-white mt-1 overflow-x-auto">
                {display}
              </div>
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-4 gap-2.5">
              <button
                onClick={handleClear}
                className="p-3.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl text-base transition"
              >
                C
              </button>
              <button
                onClick={handleToggleSign}
                className="p-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-base transition"
              >
                ±
              </button>
              <button
                onClick={() => handleOperator('%')}
                className="p-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-base transition"
              >
                %
              </button>
              <button
                onClick={() => handleOperator('÷')}
                className="p-3.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-base transition flex items-center justify-center"
              >
                <Divide className="w-4 h-4" />
              </button>

              <button onClick={() => handleDigit('7')} className="p-3.5 bg-slate-800/80 hover:bg-slate-800 text-white font-bold rounded-xl text-lg transition">7</button>
              <button onClick={() => handleDigit('8')} className="p-3.5 bg-slate-800/80 hover:bg-slate-800 text-white font-bold rounded-xl text-lg transition">8</button>
              <button onClick={() => handleDigit('9')} className="p-3.5 bg-slate-800/80 hover:bg-slate-800 text-white font-bold rounded-xl text-lg transition">9</button>
              <button
                onClick={() => handleOperator('×')}
                className="p-3.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-base transition flex items-center justify-center"
              >
                <Multiply className="w-4 h-4" />
              </button>

              <button onClick={() => handleDigit('4')} className="p-3.5 bg-slate-800/80 hover:bg-slate-800 text-white font-bold rounded-xl text-lg transition">4</button>
              <button onClick={() => handleDigit('5')} className="p-3.5 bg-slate-800/80 hover:bg-slate-800 text-white font-bold rounded-xl text-lg transition">5</button>
              <button onClick={() => handleDigit('6')} className="p-3.5 bg-slate-800/80 hover:bg-slate-800 text-white font-bold rounded-xl text-lg transition">6</button>
              <button
                onClick={() => handleOperator('-')}
                className="p-3.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-base transition flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>

              <button onClick={() => handleDigit('1')} className="p-3.5 bg-slate-800/80 hover:bg-slate-800 text-white font-bold rounded-xl text-lg transition">1</button>
              <button onClick={() => handleDigit('2')} className="p-3.5 bg-slate-800/80 hover:bg-slate-800 text-white font-bold rounded-xl text-lg transition">2</button>
              <button onClick={() => handleDigit('3')} className="p-3.5 bg-slate-800/80 hover:bg-slate-800 text-white font-bold rounded-xl text-lg transition">3</button>
              <button
                onClick={() => handleOperator('+')}
                className="p-3.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-base transition flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>

              <button onClick={() => handleDigit('0')} className="col-span-2 p-3.5 bg-slate-800/80 hover:bg-slate-800 text-white font-bold rounded-xl text-lg transition">0</button>
              <button onClick={() => handleDigit('.')} className="p-3.5 bg-slate-800/80 hover:bg-slate-800 text-white font-bold rounded-xl text-lg transition">.</button>
              <button
                onClick={handleEquals}
                className="p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-base transition flex items-center justify-center shadow-lg shadow-emerald-600/30"
              >
                <Equal className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
