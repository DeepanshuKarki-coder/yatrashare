import React, { useState } from 'react';
import { api } from '../lib/api';
import { Star, X, AlertCircle } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  journeyId: string;
  reviewedUserId: string;
  reviewedUserName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  journeyId,
  reviewedUserId,
  reviewedUserName,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [punctuality, setPunctuality] = useState<number>(5);
  const [cleanliness, setCleanliness] = useState<number>(5);
  const [driving, setDriving] = useState<number>(5);
  const [communication, setCommunication] = useState<number>(5);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/api/reviews', {
        journeyId,
        reviewedUserId,
        rating,
        comment,
        categories: { punctuality, cleanliness, driving, communication },
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (current: number, setVal: (v: number) => void) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          onClick={() => setVal(star)}
          className="p-1 focus:outline-none"
        >
          <Star
            className={`w-5 h-5 ${
              star <= current
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-300'
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Review {reviewedUserName}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Overall Rating */}
          <div className="text-center py-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Overall Experience</label>
            <div className="flex justify-center space-x-2 my-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setRating(s)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Categories */}
          <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Punctuality</span>
              {renderStars(punctuality, setPunctuality)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Cleanliness</span>
              {renderStars(cleanliness, setCleanliness)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Driving Quality</span>
              {renderStars(driving, setDriving)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Communication</span>
              {renderStars(communication, setCommunication)}
            </div>
          </div>

          {/* Feedback Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Your Written Review</label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about the trip, vehicle comfort, and courtesy..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || comment.length < 5}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Posting Review...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
};
