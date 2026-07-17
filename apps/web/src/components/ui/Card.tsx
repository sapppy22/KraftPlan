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
        'card-surface p-5 relative overflow-hidden',
        interactive && 'card-hover cursor-pointer',
        hero && 'gradient-bg border border-white/20 text-white shadow-2xl shadow-brand-orange/20',
        className,
      )}
    >
      <div className="absolute inset-0 rounded-[20px] ring-1 ring-inset ring-white/10 pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
