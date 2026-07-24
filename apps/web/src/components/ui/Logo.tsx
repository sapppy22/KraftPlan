import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  /** Pixel size of the square mark. */
  size?: number;
  /** Show the "KraftPlan" wordmark next to the mark. */
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
}

/**
 * KraftPlan brand lockup — the logo mark (crossed dumbbells forming a "K"
 * over a peak) plus an optional gradient wordmark.
 */
export function Logo({ size = 36, showWordmark = true, className, wordmarkClassName }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Image
        src="/logo-mark.png"
        alt="KraftPlan"
        width={size}
        height={size}
        priority
        className="rounded-[22%] shadow-sm shadow-black/10 ring-1 ring-hairline"
        // Recolor the orange/amber mark into the healthcare-green palette while
        // preserving the crossed-dumbbell "K" over a peak. hue-rotate shifts the
        // warm gradient (~25°) toward green (~150°).
        style={{ width: size, height: size }}
      />
      {showWordmark && (
        <span
          className={cn(
            'font-display font-bold tracking-tight bg-gradient-to-r from-brand-red via-brand-orange to-brand-amber bg-clip-text text-transparent',
            wordmarkClassName,
          )}
        >
          KraftPlan
        </span>
      )}
    </span>
  );
}
