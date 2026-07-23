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
          'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 ease-out active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:opacity-50 disabled:pointer-events-none',
          {
            // Accent fill, subtle lift on hover — clean, soft elevation
            'gradient-bg text-white shadow-sm hover:brightness-95 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99]': variant === 'primary',
            // Outline / secondary — crisp border, subtle elevation on hover
            'bg-bg-surface text-text-primary border border-hairline-strong shadow-xs hover:bg-surface-1 hover:border-text-secondary/30 active:translate-y-0 active:scale-[0.99]': variant === 'secondary',
            'text-text-secondary hover:text-text-primary hover:bg-surface-1': variant === 'ghost',
            'bg-danger/10 text-danger border border-danger/25 hover:bg-danger/15': variant === 'danger',
            'px-4 py-2 text-sm': size === 'sm',
            'px-6 py-3 text-sm': size === 'md',
            'px-8 py-4 text-base': size === 'lg',
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
