'use client';

import Link from 'next/link';
import { Lock, Zap, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';

/**
 * Shown in place of plan pages when the visitor is in guest / "Explore Mode".
 * Training plans require an account; a custom workout does not — so we always
 * offer that as the escape hatch.
 */
export function MembersOnlyGate({
  feature = 'Training plans',
  description = 'Create a free account to browse structured programs, follow a plan, and track your long-term progress.',
}: {
  feature?: string;
  description?: string;
}) {
  return (
    <div className="max-w-lg mx-auto py-6">
      <Card className="p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl icon-chip flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">{feature} are a member feature</h2>
          <p className="text-text-secondary mt-2 text-sm leading-relaxed">{description}</p>
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          <Link href="/register" className="w-full">
            <button className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 gradient-bg rounded-xl text-white font-semibold shadow-sm hover:brightness-95 transition-all group">
              Create free account
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </Link>
          <Link href="/workout/custom" className="w-full">
            <button className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-bg-elevated border border-hairline text-text-primary font-semibold hover:border-hairline-strong transition-all">
              <Zap className="w-4 h-4 text-brand-green" />
              Start a custom workout
            </button>
          </Link>
        </div>

        <p className="text-xs text-text-secondary">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-green font-medium hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
