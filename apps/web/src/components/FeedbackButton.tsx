'use client';

import { useState } from 'react';
import { MessageSquarePlus, X, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import Button from '@/components/ui/Button';

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'bug' | 'feature' | 'other'>('bug');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError('');

    try {
      await api.fetch('/feedback', {
        method: 'POST',
        body: JSON.stringify({ type, message }),
      });
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setMessage('');
        setType('bug');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 p-3 bg-brand-orange text-white rounded-full shadow-lg hover:bg-brand-orange/90 transition-transform hover:scale-105"
        aria-label="Send Feedback"
      >
        <MessageSquarePlus className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => !loading && setIsOpen(false)} 
          />
          
          {/* Modal */}
          <div className="relative bg-bg-surface border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Help us improve</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-text-secondary hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-success" />
                <p className="font-medium text-lg">Thank you!</p>
                <p className="text-text-secondary text-sm">Your feedback helps us make KraftPlan better for everyone.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">What kind of feedback is this?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['bug', 'feature', 'other'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`py-2 rounded-xl border text-sm font-medium capitalize transition-all ${
                          type === t 
                            ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                            : 'border-white/10 bg-white/5 text-text-secondary hover:bg-white/10'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Details</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you think..."
                    className="w-full h-32 px-4 py-3 bg-bg-base border border-white/10 rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange resize-none"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <Button type="submit" disabled={loading || !message.trim()} className="px-6">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
