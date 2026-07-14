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
        'card-surface p-5',
        interactive && 'card-hover cursor-pointer',
        hero && 'gradient-bg border-none text-white',
        className,
      )}
    >
      {children}
    </div>
  );
}
