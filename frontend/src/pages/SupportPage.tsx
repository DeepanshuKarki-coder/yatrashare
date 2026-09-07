import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Shield,
  PhoneCall,
  X
} from 'lucide-react';
import { TicketPriority, TicketStatus } from '@yatrashare/shared';

export const SupportPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New ticket state
  const [category, setCategory] = useState('Booking Issue');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState<TicketPriority>(TicketPriority.MEDIUM);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply state
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const fetchTickets = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await api.get('/api/support/tickets');
      setTickets(data);
      if (data.length > 0 && !selectedTicket) {
        loadTicketDetails(data[0].id);
      }
    } catch (err) {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  const loadTicketDetails = async (id: string) => {
    try {
      const details = await api.get(`/api/support/tickets/${id}`);
      setSelectedTicket(details);
    } catch (err) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [isAuthenticated]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/api/support/tickets', {
        category,
        subject,
        priority,
        message,
      });
      setIsNewTicketOpen(false);
      setSubject('');
      setMessage('');
      await fetchTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;
    setIsReplying(true);
    try {
      await api.post(`/api/support/tickets/${selectedTicket.id}/reply`, {
        message: replyMessage.trim(),
      });
      setReplyMessage('');
      await loadTicketDetails(selectedTicket.id);
    } catch (err: any) {
      alert(err.message || 'Failed to send reply');
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-brand-950 rounded-3xl p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center space-x-2 text-brand-300 text-xs font-bold uppercase tracking-wider">
            <LifeBuoy className="w-4 h-4" />
            <span>24/7 Community Support</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">How can we help you today?</h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Have questions about ride payments, refunds, identity verification, or safety? Our agents are here to assist.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsNewTicketOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/30 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Ticket</span>
          </button>
        </div>
      </div>

      {/* Safety & Emergency Quick Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Emergency Helpline (India)</span>
            <span className="text-[11px] text-slate-500 font-mono">Dial 112 (National Police & EMS)</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Safety & Escrow Guarantee</span>
            <span className="text-[11px] text-slate-500">Payments held safely until trip completes</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Response Time Target</span>
            <span className="text-[11px] text-slate-500">&lt; 15 minutes for active journeys</span>
          </div>
        </div>
      </div>

      {/* Ticket Workdesk */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3 min-h-[500px]">
        {/* Left: Ticket List */}
        <div className="border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">My Tickets ({tickets.length})</h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                You have no open support tickets.
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => loadTicketDetails(t.id)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedTicket?.id === t.id ? 'bg-brand-50/70 border-l-4 border-brand-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">{t.category}</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        t.status === TicketStatus.OPEN
                          ? 'bg-amber-100 text-amber-800'
                          : t.status === TicketStatus.RESOLVED
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 truncate">{t.subject}</h4>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(t.created_at || t.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Ticket Thread */}
        <div className="md:col-span-2 flex flex-col bg-slate-50/40">
          {selectedTicket ? (
            <>
              {/* Ticket Header */}
              <div className="p-4 bg-white border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                    {selectedTicket.category} • Priority: {selectedTicket.priority}
                  </span>
                  <span className="text-xs font-mono text-slate-400">ID: {selectedTicket.id.substring(0, 8)}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-2">{selectedTicket.subject}</h3>
              </div>

              {/* Message Thread */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {selectedTicket.messages?.map((m: any) => {
                  const isStaff = m.is_staff_reply === 1 || m.isStaffReply;

                  return (
                    <div
                      key={m.id}
                      className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 ${
                        isStaff
                          ? 'bg-brand-50/70 border-brand-200 mr-8'
                          : 'bg-white border-slate-200 ml-8'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-bold text-slate-800">
                          {isStaff ? '🛡️ YatraShare Support Agent' : m.sender_name || 'You'}
                        </span>
                        <span>{new Date(m.created_at || m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-800 whitespace-pre-wrap">{m.message}</p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleReplyTicket} className="p-3 bg-white border-t border-slate-200 flex space-x-2">
                <input
                  type="text"
                  placeholder="Type your response to support team..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  disabled={!replyMessage.trim() || isReplying}
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 shadow-sm disabled:opacity-50"
                >
                  {isReplying ? 'Sending...' : 'Reply'}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 space-y-2">
              <LifeBuoy className="w-10 h-10 stroke-1" />
              <p className="text-xs">Select a support ticket to view conversation or create a new inquiry</p>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Create Support Ticket</h3>
              <button onClick={() => setIsNewTicketOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Issue Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Booking Issue">Booking Issue / Cancellation</option>
                  <option value="Payment & Refund">Payment & Refund Status</option>
                  <option value="Account & ID Verification">Account & ID Verification</option>
                  <option value="Driver Conduct / Safety">Driver Conduct / Safety Inquiry</option>
                  <option value="General Question">General Platform Question</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of the issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Please provide details, booking reference if applicable, and questions..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
