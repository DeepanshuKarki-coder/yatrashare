import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  Users,
  Compass,
  CalendarCheck,
  IndianRupee,
  AlertTriangle,
  LifeBuoy,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalJourneys: number;
  totalBookings: number;
  totalRevenue: number;
  openReports: number;
  openTickets: number;
}

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'journeys' | 'reports' | 'tickets' | 'payments' | 'audit'>('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  // Sub-resources
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [journeys, setJourneys] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Action states
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reportNote, setReportNote] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchStats = async () => {
    try {
      const data = await api.get<Stats>('/api/admin/stats');
      if (data) {
        setStats(data);
      }
    } catch (err: any) {
      console.error('Failed to load admin stats:', err);
    }
  };

  const loadTabData = async (tab: string) => {
    setLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      if (tab === 'overview') {
        await fetchStats();
      } else if (tab === 'users') {
        const res = await api.get<{ items: any[]; total: number }>(`/api/admin/users`, userSearch ? { search: userSearch } : undefined);
        setUsers(res?.items || []);
      } else if (tab === 'journeys') {
        const res = await api.get<{ items: any[]; total: number }>('/api/admin/journeys');
        setJourneys(res?.items || []);
      } else if (tab === 'reports') {
        const res = await api.get<any[]>('/api/admin/reports');
        setReports(Array.isArray(res) ? res : []);
      } else if (tab === 'tickets') {
        const res = await api.get<any[]>('/api/admin/tickets');
        setTickets(Array.isArray(res) ? res : []);
      } else if (tab === 'payments') {
        const res = await api.get<{ items: any[]; total: number }>('/api/admin/payments');
        setPayments(res?.items || []);
      } else if (tab === 'audit') {
        const res = await api.get<any[]>('/api/admin/audit-logs');
        setAuditLogs(Array.isArray(res) ? res : []);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to load tab data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      await api.patch(`/api/admin/users/${userId}/status`, { status });
      setActionSuccess(`User status changed to ${status}`);
      loadTabData('users');
    } catch (err: any) {
      setActionError(err.message || 'Failed to update user status');
    }
  };

  const handleCancelJourney = async (journeyId: string) => {
    const reason = prompt('Please enter administrative cancellation reason:');
    if (!reason) return;
    try {
      await api.post(`/api/admin/journeys/${journeyId}/cancel`, { reason });
      setActionSuccess('Journey cancelled and passengers refunded successfully');
      loadTabData('journeys');
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel journey');
    }
  };

  const handleUpdateReport = async (reportId: string, status: string) => {
    try {
      await api.patch(`/api/admin/reports/${reportId}`, {
        status,
        adminNotes: reportNote || 'Updated by admin',
      });
      setActionSuccess(`Report marked as ${status}`);
      setSelectedReport(null);
      setReportNote('');
      loadTabData('reports');
    } catch (err: any) {
      setActionError(err.message || 'Failed to update report');
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      await api.patch(`/api/admin/tickets/${ticketId}/status`, { status });
      setActionSuccess(`Ticket marked as ${status}`);
      loadTabData('tickets');
    } catch (err: any) {
      setActionError(err.message || 'Failed to update ticket');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Staff Console
              </span>
              <span className="text-slate-400 text-sm">Authenticated as {user?.fullName} ({user?.role})</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">Admin & Moderation Hub</h1>
            <p className="text-slate-600 text-sm mt-1">Platform metrics, user governance, route safety & dispute resolution.</p>
          </div>
          <button
            onClick={() => {
              fetchStats();
              loadTabData(activeTab);
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary-600' : 'text-slate-500'}`} />
            Refresh Data
          </button>
        </div>

        {/* Notifications / Alerts */}
        {actionSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium">{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess('')} className="text-emerald-700 font-bold">&times;</button>
          </div>
        )}
        {actionError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span className="text-sm font-medium">{actionError}</span>
            </div>
            <button onClick={() => setActionError('')} className="text-rose-700 font-bold">&times;</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-8 pb-2 border-b border-slate-200 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview', icon: Shield },
            { id: 'users', label: 'User Governance', icon: Users },
            { id: 'journeys', label: 'Journeys Oversight', icon: Compass },
            { id: 'reports', label: `Safety Reports ${stats?.openReports ? `(${stats.openReports})` : ''}`, icon: AlertTriangle },
            { id: 'tickets', label: `Support Tickets ${stats?.openTickets ? `(${stats.openTickets})` : ''}`, icon: LifeBuoy },
            { id: 'payments', label: 'Payments', icon: IndianRupee },
            { id: 'audit', label: 'Audit Trail', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Registered Users</p>
                  <p className="text-3xl font-black text-slate-900 mt-2">{stats?.totalUsers ?? '...'}</p>
                  <p className="text-xs text-slate-400 mt-1">Drivers & verified commuters</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Journeys</p>
                  <p className="text-3xl font-black text-slate-900 mt-2">{stats?.totalJourneys ?? '...'}</p>
                  <p className="text-xs text-slate-400 mt-1">Intercity scheduled trips</p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Compass className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bookings</p>
                  <p className="text-3xl font-black text-slate-900 mt-2">{stats?.totalBookings ?? '...'}</p>
                  <p className="text-xs text-slate-400 mt-1">Confirmed passenger seats</p>
                </div>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <CalendarCheck className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Platform Volume</p>
                  <p className="text-3xl font-black text-slate-900 mt-2">₹{(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-slate-400 mt-1">Processed transactions</p>
                </div>
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <IndianRupee className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Safety Reports</p>
                  <p className="text-3xl font-black text-rose-600 mt-2">{stats?.openReports ?? '...'}</p>
                  <p className="text-xs text-slate-400 mt-1">Requiring immediate staff attention</p>
                </div>
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Support Tickets</p>
                  <p className="text-3xl font-black text-amber-600 mt-2">{stats?.openTickets ?? '...'}</p>
                  <p className="text-xs text-slate-400 mt-1">Customer queries in queue</p>
                </div>
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                  <LifeBuoy className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Quick Admin Actions */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Governance Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('reports')}
                  className="p-4 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-left transition flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Review Safety Incident Queue</h3>
                    <p className="text-xs text-slate-500 mt-1">Review flagged trips, harassment reports, and dangerous driving.</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-left transition flex items-start gap-3"
                >
                  <Users className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Moderate Users & Identity</h3>
                    <p className="text-xs text-slate-500 mt-1">Inspect suspicious accounts, modify status, or ban abusive members.</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('tickets')}
                  className="p-4 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-50 text-left transition flex items-start gap-3"
                >
                  <LifeBuoy className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Resolve Customer Tickets</h3>
                    <p className="text-xs text-slate-500 mt-1">Answer questions regarding booking modifications and refunds.</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: USERS GOVERNANCE */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">User Directory</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage member credentials, role permissions, and access status.</p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadTabData('users');
                }}
                className="flex items-center gap-2 max-w-sm w-full"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
                >
                  Filter
                </button>
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                    <th className="py-3.5 px-6">User</th>
                    <th className="py-3.5 px-6">Contact & Phone</th>
                    <th className="py-3.5 px-6">Role</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Reputation</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{u.fullName || u.full_name}</div>
                        <div className="text-xs text-slate-400">ID: {u.id.substring(0, 8)}...</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-slate-700">{u.email}</div>
                        <div className="text-xs text-slate-400">{u.phone || 'No phone'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                          u.role === 'DRIVER' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                          u.status === 'SUSPENDED' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          ★ {(Number(u.ratingAverage ?? u.rating_average ?? 5.0)).toFixed(1)}
                          <span className="text-xs font-normal text-slate-400">({u.ratingCount ?? u.rating_count ?? 0})</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.status !== 'ACTIVE' && (
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, 'ACTIVE')}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold transition"
                            >
                              Activate
                            </button>
                          )}
                          {u.status !== 'SUSPENDED' && (
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, 'SUSPENDED')}
                              className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-xs font-semibold transition"
                            >
                              Suspend
                            </button>
                          )}
                          {u.status !== 'BANNED' && (
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, 'BANNED')}
                              className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-xs font-semibold transition"
                            >
                              Ban
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: JOURNEYS OVERSIGHT */}
        {activeTab === 'journeys' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Intercity Journey Registry</h2>
              <p className="text-xs text-slate-500 mt-0.5">Live journeys posted by drivers across India.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                    <th className="py-3.5 px-6">Route</th>
                    <th className="py-3.5 px-6">Driver & Vehicle</th>
                    <th className="py-3.5 px-6">Schedule</th>
                    <th className="py-3.5 px-6">Seats & Price</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Intervention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {journeys.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{j.origin_name || j.originName} &rarr; {j.destination_name || j.destinationName}</div>
                        <div className="text-xs text-slate-400">Journey ID: {j.id.substring(0, 8)}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-slate-800 font-medium">{j.driver_name || 'Driver'}</div>
                        <div className="text-xs text-slate-400">{j.make} {j.model} ({j.license_plate})</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-slate-800 text-xs font-medium">
                          {new Date(j.departure_time || j.departureTime).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800">₹{j.price_per_seat || j.pricePerSeat} / seat</div>
                        <div className="text-xs text-slate-400">{j.available_seats || j.availableSeats} of {j.total_seats || j.totalSeats} seats open</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          j.status === 'ACTIVE' || j.status === 'SCHEDULED' ? 'bg-emerald-100 text-emerald-700' :
                          j.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {j.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {j.status !== 'CANCELLED' && j.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleCancelJourney(j.id)}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-xs font-semibold transition"
                          >
                            Force Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {journeys.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">No journeys registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: SAFETY REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Safety Incident & Conduct Reports</h2>
                <p className="text-xs text-slate-500 mt-0.5">Complaints submitted by commuters and drivers requiring safety review.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                      <th className="py-3.5 px-6">Incident Category</th>
                      <th className="py-3.5 px-6">Reporter</th>
                      <th className="py-3.5 px-6">Reported User / Journey</th>
                      <th className="py-3.5 px-6">Description</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-6">
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">
                            {r.category || r.reason}
                          </span>
                          <div className="text-xs text-slate-400 mt-1">
                            {new Date(r.created_at || r.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-slate-800">{r.reporter_name || r.reporter_id?.substring(0, 8)}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-slate-800">{r.reported_user_name || r.reported_user_id?.substring(0, 8) || 'N/A'}</div>
                          {r.journey_id && <div className="text-xs text-slate-400">Journey: {r.journey_id.substring(0, 8)}</div>}
                        </td>
                        <td className="py-4 px-6 max-w-xs">
                          <p className="text-xs text-slate-600 line-clamp-2">{r.description}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                            r.status === 'OPEN' ? 'bg-rose-100 text-rose-700' :
                            r.status === 'INVESTIGATING' ? 'bg-amber-100 text-amber-700' :
                            r.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setSelectedReport(r)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                    {reports.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">No open safety incidents.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal for Report Detail & Action */}
            {selectedReport && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-lg">Safety Incident Review</h3>
                    <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
                  </div>
                  <div className="py-4 space-y-3 text-sm">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase">Category</span>
                      <p className="font-semibold text-slate-800">{selectedReport.category || selectedReport.reason}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase">Incident Narrative</span>
                      <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 mt-1">{selectedReport.description}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-semibold uppercase block mb-1">Administrative Action Notes</label>
                      <textarea
                        value={reportNote}
                        onChange={(e) => setReportNote(e.target.value)}
                        placeholder="Add investigation findings, driver warning, or disciplinary notes..."
                        rows={3}
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleUpdateReport(selectedReport.id, 'DISMISSED')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleUpdateReport(selectedReport.id, 'INVESTIGATING')}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Mark Under Investigation
                    </button>
                    <button
                      onClick={() => handleUpdateReport(selectedReport.id, 'RESOLVED')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Resolve & Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: SUPPORT TICKETS */}
        {activeTab === 'tickets' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Support Ticket Queue</h2>
              <p className="text-xs text-slate-500 mt-0.5">Customer service inquiries, booking disputes, and driver assistance.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                    <th className="py-3.5 px-6">Ticket ID</th>
                    <th className="py-3.5 px-6">Subject</th>
                    <th className="py-3.5 px-6">User / Email</th>
                    <th className="py-3.5 px-6">Priority</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Status Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6 font-mono text-xs text-slate-500">
                        #{t.id.substring(0, 8)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{t.subject}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{t.message}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-slate-800">{t.user_name || t.email || 'User'}</div>
                        <div className="text-xs text-slate-400">{t.email}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${
                          t.priority === 'HIGH' || t.priority === 'URGENT' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          t.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                          t.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.status !== 'IN_PROGRESS' && t.status !== 'RESOLVED' && (
                            <button
                              onClick={() => handleUpdateTicketStatus(t.id, 'IN_PROGRESS')}
                              className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-xs font-semibold transition"
                            >
                              In Progress
                            </button>
                          )}
                          {t.status !== 'RESOLVED' && (
                            <button
                              onClick={() => handleUpdateTicketStatus(t.id, 'RESOLVED')}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold transition"
                            >
                              Resolve
                            </button>
                          )}
                          {t.status !== 'CLOSED' && (
                            <button
                              onClick={() => handleUpdateTicketStatus(t.id, 'CLOSED')}
                              className="px-2.5 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded text-xs font-semibold transition"
                            >
                              Close
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {tickets.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">No support tickets found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: PAYMENTS */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Financial Ledger & Transactions</h2>
              <p className="text-xs text-slate-500 mt-0.5">Platform payments, captured escrows, and refunded seat bookings.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                    <th className="py-3.5 px-6">Payment ID</th>
                    <th className="py-3.5 px-6">Payer</th>
                    <th className="py-3.5 px-6">Amount</th>
                    <th className="py-3.5 px-6">Gateway</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6 font-mono text-xs text-slate-600">
                        {p.id.substring(0, 10)}...
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{p.payer_name || 'Passenger'}</div>
                        <div className="text-xs text-slate-400">Booking: {p.booking_id?.substring(0, 8)}</div>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex px-2 py-0.5 text-xs font-mono font-semibold rounded bg-slate-100 text-slate-700">
                          {p.gateway}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          p.status === 'CAPTURED' ? 'bg-emerald-100 text-emerald-700' :
                          p.status === 'REFUNDED' ? 'bg-amber-100 text-amber-700' :
                          p.status === 'FAILED' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {new Date(p.created_at || p.createdAt).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">No payment transactions recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 7: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">System Audit Log</h2>
              <p className="text-xs text-slate-500 mt-0.5">Immutable record of administrative interventions, status changes, and critical security events.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50 transition flex items-start justify-between gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Entity: {log.entity_type} ({log.entity_id})</span>
                    </div>
                    {log.details && (
                      <pre className="text-xs bg-slate-50 border border-slate-100 p-2 rounded mt-2 text-slate-600 font-mono overflow-x-auto max-w-2xl">
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                  <div className="text-right text-xs text-slate-400 whitespace-nowrap">
                    <div className="flex items-center gap-1 justify-end">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(log.created_at || log.createdAt).toLocaleTimeString()}
                    </div>
                    <div>{new Date(log.created_at || log.createdAt).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-400">IP: {log.ip_address || '127.0.0.1'}</div>
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-sm">No audit logs recorded yet.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
