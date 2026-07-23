'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'pill' | 'compact' | 'segmented';
  className?: string;
}

export function ThemeToggle({ variant = 'pill', className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Skeleton placeholder while hydrating
    return (
      <div
        className={cn(
          'w-14 h-7 rounded-full bg-surface-2 animate-pulse border border-hairline',
          variant === 'compact' && 'w-9 h-9 rounded-xl',
          variant === 'segmented' && 'w-48 h-9 rounded-xl',
          className
        )}
      />
    );
  }

  const isDark = resolvedTheme === 'dark';

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className={cn(
          'relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300',
          'border border-hairline hover:border-brand-green/40 hover:scale-105 active:scale-95',
          isDark
            ? 'bg-[#17231B] text-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.2)]'
            : 'bg-[#F8F9FA] text-[#00A36C] shadow-[0_2px_8px_rgba(0,163,108,0.15)]',
          className
        )}
      >
        <Sun
          className={cn(
            'w-4 h-4 transition-transform duration-300 absolute',
            isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          )}
        />
        <Moon
          className={cn(
            'w-4 h-4 transition-transform duration-300 absolute',
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          )}
        />
      </button>
    );
  }

  if (variant === 'segmented') {
    return (
      <div
        className={cn(
          'flex items-center p-1 rounded-xl bg-surface-1 border border-hairline gap-1',
          className
        )}
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200',
            theme === 'light'
              ? 'bg-[#00A36C] text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Sun className="w-3.5 h-3.5" />
          Light
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200',
            theme === 'dark'
              ? 'bg-[#10B981] text-[#0E1611] font-bold shadow-md shadow-[#10B981]/20'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Moon className="w-3.5 h-3.5" />
          Dark
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200',
            theme === 'system'
              ? 'bg-surface-2 text-text-primary border border-hairline-strong'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Laptop className="w-3.5 h-3.5" />
          Auto
        </button>
      </div>
    );
  }

  // Default: Custom Interactive Pill Toggler
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={`Toggle theme (currently ${resolvedTheme})`}
      className={cn(
        'group relative flex items-center w-[60px] h-[30px] p-[3px] rounded-full transition-all duration-300',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green hover:scale-105 active:scale-95',
        isDark
          ? 'bg-[#17231B] border border-[#10B981]/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]'
          : 'bg-[#F8F9FA] border border-[#00A36C]/30 shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)]',
        className
      )}
    >
      {/* Background icons inside track */}
      <span className="absolute left-[7px] text-[#00A36C] opacity-80 transition-opacity group-hover:opacity-100">
        <Sun className="w-3.5 h-3.5" />
      </span>
      <span className="absolute right-[7px] text-[#10B981] opacity-80 transition-opacity group-hover:opacity-100">
        <Moon className="w-3.5 h-3.5" />
      </span>

      {/* Sliding Thumb */}
      <span
        className={cn(
          'flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ease-in-out shadow-md',
          isDark
            ? 'translate-x-[30px] bg-gradient-to-tr from-[#10B981] to-[#34D399] text-[#0E1611] shadow-[0_0_10px_rgba(16,185,129,0.5)]'
            : 'translate-x-0 bg-gradient-to-tr from-[#00A36C] to-[#10B981] text-white shadow-[0_2px_6px_rgba(0,163,108,0.4)]'
        )}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 stroke-[2.5]" />
        ) : (
          <Sun className="w-3.5 h-3.5 stroke-[2.5]" />
        )}
      </span>
    </button>
  );
}
