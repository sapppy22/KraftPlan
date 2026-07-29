'use client';

import { cn } from '@/lib/utils';

/**
 * Ambient, muted, looping HYROX video that plays behind content while the user
 * is training for HYROX. Purely decorative (aria-hidden, pointer-events-none).
 *
 * The source defaults to the official HYROX trailer and can be overridden with
 * NEXT_PUBLIC_HYROX_YT_ID (any YouTube video id).
 */
const HYROX_YT_ID = process.env.NEXT_PUBLIC_HYROX_YT_ID || 'Ji6gF2OKjJ8';

interface HyroxAmbientVideoProps {
  /** 'container' fills the nearest positioned ancestor; 'viewport' pins to the screen. */
  fill?: 'container' | 'viewport';
  /** Overlay classes tuned for legibility of the content on top. */
  overlayClassName?: string;
  className?: string;
}

export function HyroxAmbientVideo({
  fill = 'container',
  overlayClassName = 'bg-black/45',
  className,
}: HyroxAmbientVideoProps) {
  const src =
    `https://www.youtube.com/embed/${HYROX_YT_ID}` +
    `?autoplay=1&mute=1&controls=0&loop=1&playlist=${HYROX_YT_ID}` +
    `&playsinline=1&modestbranding=1&rel=0&showinfo=0&disablekb=1&fs=0&iv_load_policy=3`;

  return (
    <div
      aria-hidden
      className={cn(
        'overflow-hidden pointer-events-none select-none',
        fill === 'viewport' ? 'fixed inset-0 z-0' : 'absolute inset-0',
        className,
      )}
      // container-query units let the iframe "cover" any aspect ratio without JS.
      style={{ containerType: 'size' }}
    >
      <iframe
        src={src}
        title="HYROX ambient background"
        tabIndex={-1}
        allow="autoplay; encrypted-media; picture-in-picture"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-0"
        style={{
          // 16:9 box, sized to always cover the container (max of width/height fit).
          width: '100cqw',
          height: '56.25cqw',
          minWidth: '177.78cqh',
          minHeight: '100cqh',
        }}
      />
      <div className={cn('absolute inset-0', overlayClassName)} />
    </div>
  );
}
