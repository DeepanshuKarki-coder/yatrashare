import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchWidget } from '../components/SearchWidget';
import {
  ShieldCheck,
  Zap,
  Leaf,
  Users,
  Car,
  TrendingDown,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const popularRoutes = [
    {
      from: 'Bengaluru',
      to: 'Mysuru',
      dist: '145 km',
      avgPrice: '₹350',
      time: '3h 15m',
      query: 'origin=Bengaluru&destination=Mysuru',
    },
    {
      from: 'Mumbai',
      to: 'Pune',
      dist: '148 km',
      avgPrice: '₹420',
      time: '3h 30m',
      query: 'origin=Mumbai&destination=Pune',
    },
    {
      from: 'Delhi',
      to: 'Jaipur',
      dist: '280 km',
      avgPrice: '₹650',
      time: '5h 00m',
      query: 'origin=Delhi&destination=Jaipur',
    },
    {
      from: 'Chennai',
      to: 'Pondicherry',
      dist: '155 km',
      avgPrice: '₹380',
      time: '3h 20m',
      query: 'origin=Chennai&destination=Pondicherry',
    },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-900 via-brand-800 to-slate-900 text-white pt-16 pb-28 px-4 sm:px-6 lg:px-8">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-brand-400 blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-emerald-400 blur-3xl"></div>
        </div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-brand-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-brand-300" />
            <span>India's Most Trusted Intercity Ride-Sharing Network</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Share Journeys. Save Costs. <br />
            <span className="bg-gradient-to-r from-brand-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
              Travel Together Safely.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Connect with verified drivers and commuters traveling between cities. Enjoy comfortable AC rides, atomic seat reservations, and savings up to 70% compared to traditional cabs.
          </p>

          {/* Search Box */}
          <div className="pt-6">
            <SearchWidget />
          </div>
        </div>
      </section>

      {/* Trust & Value Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 flex items-start space-x-4">
            <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">100% ID Verified</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Govt ID, driver license, email, and phone verified profiles for mutual peace of mind.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 flex items-start space-x-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Atomic Seat Lock</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Guaranteed concurrency safety. Zero overbooking, instant confirmation vouchers.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 flex items-start space-x-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Transparent Pricing</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Fair, shared cost per seat. No surge pricing, hidden charges, or unfair driver commissions.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 flex items-start space-x-4">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Greener Commutes</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Filling empty car seats directly reduces highway traffic, fuel burn, and CO2 emissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Intercity Corridors */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Popular Intercity Routes</h2>
            <p className="text-xs text-slate-500 mt-1">Frequent daily commuter rides with verified hosts.</p>
          </div>
          <Link
            to="/search"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
          >
            <span>Explore all routes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {popularRoutes.map((route, i) => (
            <div
              key={i}
              onClick={() => navigate(`/search?${route.query}`)}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-brand-500 cursor-pointer transition-all group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {route.from} ➔ {route.to}
                  </h3>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {route.dist} • ~{route.time}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">From</span>
                  <span className="text-base font-extrabold text-brand-700">{route.avgPrice}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-brand-600 font-semibold">
                <span>View scheduled rides</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Driver Host CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <span className="text-xs uppercase font-extrabold tracking-widest text-brand-400 bg-brand-950/80 px-3 py-1 rounded-full border border-brand-800">
              For Car Owners & Commuters
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Driving intercity? Share your ride and offset 80% of fuel costs.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Publish your schedule in under 2 minutes. Choose who travels with you, set custom pickup stops, and receive automated payouts with zero hassle.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/publish"
                className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-brand-600/30 transition-all flex items-center space-x-2"
              >
                <Car className="w-4 h-4" />
                <span>Publish a Journey</span>
              </Link>
              <Link
                to="/support"
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm transition-all"
              >
                How Hosting Works
              </Link>
            </div>
          </div>

          <div className="w-full max-w-xs bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur space-y-3 shrink-0">
            <div className="flex items-center space-x-3 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant direct payments</span>
            </div>
            <div className="flex items-center space-x-3 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Driver chooses co-travelers</span>
            </div>
            <div className="flex items-center space-x-3 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Women-only ride toggle</span>
            </div>
            <div className="flex items-center space-x-3 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>24/7 dedicated support helpline</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
