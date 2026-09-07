import React, { useState } from 'react';
import { api } from '../lib/api';
import { ShieldAlert, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ReportCategory } from '@yatrashare/shared';

interface SafetyReportModalProps {
  isOpen: boolean;
  reportedUserId: string;
  reportedUserName: string;
  journeyId?: string;
  onClose: () => void;
}

export const SafetyReportModal: React.FC<SafetyReportModalProps> = ({
  isOpen,
  reportedUserId,
  reportedUserName,
  journeyId,
  onClose,
}) => {
  const [category, setCategory] = useState<ReportCategory>(ReportCategory.HARASSMENT);
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/api/support/reports', {
        reportedUserId,
        journeyId: journeyId || null,
        category,
        description,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit safety report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100">
        <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-rose-800">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h3 className="text-sm font-bold">Report User or Content</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="text-base font-bold text-slate-900">Report Submitted</h4>
              <p className="text-xs text-slate-500">
                Our Trust & Safety moderation team has received your report regarding <strong>{reportedUserName}</strong>. We will investigate immediately.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Report</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ReportCategory)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value={ReportCategory.HARASSMENT}>Inappropriate Behavior / Harassment</option>
                  <option value={ReportCategory.UNSAFE_DRIVING}>Reckless or Unsafe Driving</option>
                  <option value={ReportCategory.FRAUD}>Fraud / Financial Misconduct</option>
                  <option value={ReportCategory.NO_SHOW}>No Show without notice</option>
                  <option value={ReportCategory.INAPPROPRIATE_CONTENT}>Inappropriate Profile or Messages</option>
                  <option value={ReportCategory.OTHER}>Other Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Incident Details</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe specifically what occurred..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || description.length < 10}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting Report...' : 'Submit to Safety Team'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
