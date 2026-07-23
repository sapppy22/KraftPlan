'use client';

import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  hero?: boolean;
}

export function Card({ children, className, interactive, hero }: CardProps) {
  return (
    <div
      className={cn(
        hero
          ? 'gradient-bg border border-white/20 text-white shadow-lift rounded-2xl p-5 relative overflow-hidden'
          : 'card-surface p-5 relative overflow-hidden',
        interactive && 'card-hover cursor-pointer',
        className,
      )}
    >
      {hero && (
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/15 pointer-events-none" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

