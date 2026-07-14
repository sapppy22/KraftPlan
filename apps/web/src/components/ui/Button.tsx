'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-pill transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-orange/50',
          {
            'gradient-bg text-white hover:opacity-90 shadow-lg shadow-brand-orange/20': variant === 'primary',
            'bg-bg-surface text-text-primary border border-white/10 hover:bg-bg-elevated': variant === 'secondary',
            'text-text-secondary hover:text-text-primary hover:bg-white/5': variant === 'ghost',
            'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20': variant === 'danger',
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-5 py-2.5 text-sm': size === 'md',
            'px-8 py-3.5 text-base': size === 'lg',
          },
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
export default Button;
