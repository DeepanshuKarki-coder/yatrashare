import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, HeartHandshake, Leaf, PhoneCall } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">YatraShare</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India's premier intercity ride-sharing platform. We make intercity road travel safer, more affordable, and environmentally conscious by connecting verified commuters.
            </p>
            <div className="flex items-center space-x-4 pt-2 text-slate-300">
              <span className="flex items-center text-xs">
                <ShieldCheck className="w-4 h-4 mr-1 text-emerald-400" /> 100% ID Verified
              </span>
              <span className="flex items-center text-xs">
                <Leaf className="w-4 h-4 mr-1 text-teal-400" /> Eco-Travel
              </span>
            </div>
          </div>

          {/* Popular Routes */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">Top Intercity Routes</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/search?origin=Bengaluru&destination=Mysuru" className="hover:text-white transition-colors">
                  Bengaluru ⇄ Mysuru
                </Link>
              </li>
              <li>
                <Link to="/search?origin=Mumbai&destination=Pune" className="hover:text-white transition-colors">
                  Mumbai ⇄ Pune Expressway
                </Link>
              </li>
              <li>
                <Link to="/search?origin=Delhi&destination=Jaipur" className="hover:text-white transition-colors">
                  Delhi ⇄ Jaipur NH48
                </Link>
              </li>
              <li>
                <Link to="/search?origin=Chennai&destination=Puducherry" className="hover:text-white transition-colors">
                  Chennai ⇄ ECR Pondicherry
                </Link>
              </li>
              <li>
                <Link to="/search?origin=Hyderabad&destination=Vijayawada" className="hover:text-white transition-colors">
                  Hyderabad ⇄ Vijayawada
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Trust */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">Trust & Safety</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/support" className="hover:text-white transition-colors">
                  How YatraShare Works
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-white transition-colors">
                  Women-Only Travel Mode
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-white transition-colors">
                  Driver Background Verification
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-white transition-colors">
                  Cancellation & Refund Policies
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-white transition-colors">
                  Emergency Support Guidelines
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">24/7 Community Support</h4>
            <p className="text-xs leading-relaxed text-slate-400">
              Need assistance during your journey? Our support agents are active round the clock.
            </p>
            <div className="mt-3">
              <Link
                to="/support"
                className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 text-xs font-medium border border-slate-700 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 mr-1.5 text-brand-400" />
                Contact Helpdesk
              </Link>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
              <span>© {new Date().getFullYear()} YatraShare Technologies Inc. All rights reserved.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
