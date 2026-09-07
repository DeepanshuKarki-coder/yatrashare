import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  Compass,
  PlusCircle,
  Bell,
  MessageSquare,
  User,
  LogOut,
  Car,
  Calendar,
  Shield,
  Menu,
  X,
  CheckCircle2,
  LifeBuoy
} from 'lucide-react';
import { UserRole } from '@yatrashare/shared';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdminOrSupport = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPPORT;
  const isDriver = user?.role === UserRole.DRIVER || user?.role === UserRole.ADMIN;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-brand-800 to-brand-600 bg-clip-text text-transparent">
              YatraShare
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest text-brand-700 ml-1.5 px-1.5 py-0.5 bg-brand-50 rounded">
              Intercity
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            to="/search"
            className="text-sm font-medium text-slate-700 hover:text-brand-600 flex items-center space-x-1.5 transition-colors"
          >
            <Compass className="w-4 h-4" />
            <span>Search Rides</span>
          </Link>

          <Link
            to="/publish"
            className="text-sm font-medium text-slate-700 hover:text-brand-600 flex items-center space-x-1.5 transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-brand-600" />
            <span>Publish a Journey</span>
          </Link>

          {isAuthenticated && (
            <Link
              to="/messages"
              className="text-sm font-medium text-slate-700 hover:text-brand-600 flex items-center space-x-1.5 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
            </Link>
          )}

          <Link
            to="/support"
            className="text-sm font-medium text-slate-700 hover:text-brand-600 flex items-center space-x-1.5 transition-colors"
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Support</span>
          </Link>
        </nav>

        {/* Right CTA / Auth / Notifications */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-full transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-in">
                    <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-800">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-500">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markAsRead(n.id)}
                            className={`p-3.5 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                              !n.isRead ? 'bg-teal-50/50' : ''
                            }`}
                          >
                            <div className="font-semibold text-slate-900 flex items-center justify-between">
                              <span>{n.title}</span>
                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-brand-600"></span>
                              )}
                            </div>
                            <p className="text-slate-600 mt-1 leading-relaxed">{n.body}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <img
                    src={
                      user?.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=0d9488&color=fff`
                    }
                    alt={user?.fullName}
                    className="w-9 h-9 rounded-full object-cover border-2 border-brand-500"
                  />
                  <div className="hidden sm:block text-left">
                    <span className="text-xs font-semibold text-slate-800 block truncate max-w-[120px]">
                      {user?.fullName}
                    </span>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                      {user?.role}
                    </span>
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">{user?.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      {user?.isIdentityVerified && (
                        <span className="inline-flex items-center text-[10px] text-emerald-600 font-medium mt-1">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Verified Traveler
                        </span>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        to="/bookings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                      >
                        <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                        My Bookings
                      </Link>

                      <Link
                        to="/my-journeys"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                      >
                        <Compass className="w-4 h-4 mr-2 text-slate-400" />
                        My Offered Rides
                      </Link>

                      {isDriver && (
                        <Link
                          to="/vehicles"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                        >
                          <Car className="w-4 h-4 mr-2 text-slate-400" />
                          My Vehicles
                        </Link>
                      )}

                      {isAdminOrSupport && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-xs font-medium text-amber-700 bg-amber-50/50 hover:bg-amber-100"
                        >
                          <Shield className="w-4 h-4 mr-2 text-amber-600" />
                          Admin Console
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-700 hover:text-brand-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-sm shadow-brand-600/20 transition-all"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 animate-fade-in">
          <Link
            to="/search"
            onClick={() => setIsMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-800"
          >
            Search Rides
          </Link>
          <Link
            to="/publish"
            onClick={() => setIsMenuOpen(false)}
            className="block py-2 text-sm font-medium text-brand-600 font-semibold"
          >
            Publish a Journey
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/bookings"
                onClick={() => setIsMenuOpen(false)}
                className="block py-2 text-sm font-medium text-slate-800"
              >
                My Bookings
              </Link>
              <Link
                to="/my-journeys"
                onClick={() => setIsMenuOpen(false)}
                className="block py-2 text-sm font-medium text-slate-800"
              >
                My Offered Rides
              </Link>
              <Link
                to="/messages"
                onClick={() => setIsMenuOpen(false)}
                className="block py-2 text-sm font-medium text-slate-800"
              >
                Messages
              </Link>
              {isDriver && (
                <Link
                  to="/vehicles"
                  onClick={() => setIsMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-slate-800"
                >
                  My Vehicles
                </Link>
              )}
              {isAdminOrSupport && (
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-amber-700 font-semibold"
                >
                  Admin Console
                </Link>
              )}
            </>
          )}
          <Link
            to="/support"
            onClick={() => setIsMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-800"
          >
            Help & Support
          </Link>
        </div>
      )}
    </header>
  );
};
