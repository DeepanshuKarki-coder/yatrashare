import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, ArrowRight, Shield, Car, UserCheck, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Determine redirect target
  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    setEmail(userEmail);
    setPassword('Password123!');
    setError('');
    setIsLoading(true);
    try {
      await login(userEmail, 'Password123!');
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <span className="w-10 h-10 rounded-xl bg-primary-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-primary-500/20">
              YS
            </span>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Yatra<span className="text-primary-600">Share</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to book rides, publish trips, and manage bookings</p>
        </div>

        {/* Demo Fast Login Cards */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Test Personas</span>
            <span className="text-[11px] text-primary-600 font-medium">1-Click Sign In</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('vikram.singh@example.com')}
              disabled={isLoading}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-primary-50 hover:border-primary-200 transition text-left"
            >
              <Car className="w-4 h-4 text-primary-600 shrink-0" />
              <div className="truncate">
                <div className="text-xs font-bold text-slate-800 truncate">Driver Vikram</div>
                <div className="text-[10px] text-slate-400">Verified Driver</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('arjun.patel@example.com')}
              disabled={isLoading}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-primary-50 hover:border-primary-200 transition text-left"
            >
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <div className="text-xs font-bold text-slate-800 truncate">Passenger Arjun</div>
                <div className="text-[10px] text-slate-400">Commuter</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('priya.sharma@example.com')}
              disabled={isLoading}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-pink-50 hover:border-pink-200 transition text-left"
            >
              <Car className="w-4 h-4 text-pink-600 shrink-0" />
              <div className="truncate">
                <div className="text-xs font-bold text-slate-800 truncate">Driver Priya</div>
                <div className="text-[10px] text-slate-400">Women-Only Rides</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('admin@yatrashare.com')}
              disabled={isLoading}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 transition text-left"
            >
              <Shield className="w-4 h-4 text-purple-600 shrink-0" />
              <div className="truncate">
                <div className="text-xs font-bold text-slate-800 truncate">Super Admin</div>
                <div className="text-[10px] text-slate-400">Moderator</div>
              </div>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
                <span className="text-xs text-primary-600 hover:underline cursor-pointer">Forgot?</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-md shadow-primary-500/20 hover:shadow-primary-500/30 transition flex items-center justify-center gap-2 text-sm disabled:opacity-70 mt-2"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-primary-600 hover:underline inline-flex items-center gap-0.5">
              Create an account <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
