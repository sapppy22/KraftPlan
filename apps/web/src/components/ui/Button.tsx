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
          'inline-flex items-center justify-center font-semibold rounded-pill transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-orange/50',
          {
            'gradient-bg text-white hover:opacity-100 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] shadow-lg shadow-brand-orange/20 border border-white/20': variant === 'primary',
            'bg-white/5 backdrop-blur-md text-text-primary border border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-lg': variant === 'secondary',
            'text-text-secondary hover:text-text-primary hover:bg-white/5': variant === 'ghost',
            'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 hover:shadow-[0_0_15px_rgba(248,113,113,0.3)]': variant === 'danger',
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
