'use client';

import { useState } from 'react';
import { MessageSquare, X, Loader2, CheckCircle2, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { api } from '@/lib/api/client';
import Button from '@/components/ui/Button';

const TRAITS_LIST = [
  'Adventurous',
  'Clean',
  'Good listener',
  'Honest',
  'Humorous',
  'Inspiring',
  'Kind',
  'Knowledgeable',
  'Non-judgemental',
  'Spontaneous',
  'Talkative',
  'Thoughtful',
  'Trustworthy',
  'Intuitive',
  'Effective',
  'Sleek',
];

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [usabilityRating, setUsabilityRating] = useState<number>(5);
  const [contentRating, setContentRating] = useState<number>(5);
  const [recommend, setRecommend] = useState<boolean | null>(true);
  const [selectedTraits, setSelectedTraits] = useState<string[]>(['Clean', 'Thoughtful']);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const toggleTrait = (trait: string) => {
    setSelectedTraits((prev) =>
      prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formattedMessage = [
      `Usability: ${usabilityRating}/5`,
      `Workout Content: ${contentRating}/5`,
      `Recommend: ${recommend === true ? 'Yes' : recommend === false ? 'No' : 'Not specified'}`,
      `Traits: ${selectedTraits.length > 0 ? selectedTraits.join(', ') : 'None'}`,
      message.trim() ? `Note: ${message.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await api.fetch('/feedback', {
        method: 'POST',
        body: JSON.stringify({ type: 'other', message: formattedMessage }),
      });
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setMessage('');
        setSelectedTraits(['Clean', 'Thoughtful']);
        setUsabilityRating(5);
        setContentRating(5);
        setRecommend(true);
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Subtle, non-intrusive floating trigger button at bottom right */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-40 px-3.5 py-2 rounded-full bg-bg-surface/90 backdrop-blur-md border border-hairline hover:border-brand-orange/40 text-text-secondary hover:text-text-primary text-xs font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 group"
        aria-label="Leave a review"
      >
        <MessageSquare className="w-4 h-4 text-brand-orange group-hover:rotate-12 transition-transform" />
        <span>Feedback</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => !loading && setIsOpen(false)}
          />

          {/* Modal Card */}
          <div className="relative bg-bg-surface border border-hairline p-5 sm:p-6 rounded-3xl shadow-2xl w-full max-w-lg my-auto overflow-hidden text-text-primary max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-hairline mb-4 shrink-0">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight">Leave a review</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-1 hover:bg-surface-2 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-brand-green/15 text-brand-green flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="font-display text-2xl font-bold">Thank you for your review!</h3>
                <p className="text-text-secondary text-sm max-w-xs">
                  Your feedback helps us continuously elevate KraftPlan for everyone.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="overflow-y-auto space-y-6 pr-1 custom-scrollbar flex-1">
                {/* Usability rating */}
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-base">Usability</h3>
                  <p className="text-xs text-text-secondary">How smooth did your workout feel with KraftPlan?</p>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setUsabilityRating(star)}
                        className="p-1 hover:scale-110 transition-transform focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= usabilityRating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-hairline-strong fill-transparent'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content / Plan rating */}
                <div className="space-y-1.5 pt-2 border-t border-hairline/60">
                  <h3 className="font-semibold text-base">Workout Plans & Content</h3>
                  <p className="text-xs text-text-secondary">How clear were the plans and exercise videos?</p>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setContentRating(star)}
                        className="p-1 hover:scale-110 transition-transform focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= contentRating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-hairline-strong fill-transparent'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recommendation */}
                <div className="space-y-2 pt-2 border-t border-hairline/60">
                  <h3 className="font-semibold text-base">Would you recommend KraftPlan?</h3>
                  <p className="text-xs text-text-secondary">Your opinion won't be posted publicly.</p>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setRecommend(false)}
                      className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        recommend === false
                          ? 'border-danger bg-danger/10 text-danger font-semibold'
                          : 'border-hairline bg-surface-1 text-text-secondary hover:bg-surface-2'
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>No</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecommend(true)}
                      className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        recommend === true
                          ? 'border-brand-green bg-brand-green/15 text-brand-green font-semibold shadow-sm'
                          : 'border-hairline bg-surface-1 text-text-secondary hover:bg-surface-2'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Yes</span>
                    </button>
                  </div>
                </div>

                {/* Praise / Traits pills */}
                <div className="space-y-2 pt-2 border-t border-hairline/60">
                  <h3 className="font-semibold text-base">Praise</h3>
                  <p className="text-xs text-text-secondary">What traits best describe KraftPlan?</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {TRAITS_LIST.map((trait) => {
                      const isSelected = selectedTraits.includes(trait);
                      return (
                        <button
                          key={trait}
                          type="button"
                          onClick={() => toggleTrait(trait)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-brand-green/20 border border-brand-green/40 text-brand-green font-semibold shadow-sm'
                              : 'bg-surface-1 border border-hairline text-text-primary hover:bg-surface-2'
                          }`}
                        >
                          {trait}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Text comment */}
                <div className="space-y-2 pt-2 border-t border-hairline/60">
                  <h3 className="font-semibold text-base">Care to share more?</h3>
                  <p className="text-xs text-text-secondary">
                    How was your overall experience? What's that one thing you won't forget?
                  </p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Come on, you know the drill."
                    className="w-full h-24 px-4 py-3 bg-bg-elevated border border-hairline rounded-2xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange text-sm resize-none"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs">
                    {error}
                  </div>
                )}

                {/* Action button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 gradient-bg rounded-2xl text-white font-bold text-sm tracking-wider uppercase shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'PUBLISH REVIEW'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
