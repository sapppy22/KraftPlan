'use client';

import { useEffect } from 'react';
import { Logo } from '@/components/ui/Logo';
import Button from '@/components/ui/Button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error caught by boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col items-center justify-center p-4 text-center">
      <Logo size={60} showWordmark={false} className="mb-6 opacity-50 grayscale" />
      <h1 className="text-3xl font-display font-bold mb-2">Something went wrong</h1>
      <p className="text-text-secondary mb-8 max-w-md">
        We encountered an unexpected error. Our team has been notified.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="secondary" onClick={() => (window.location.href = '/')}>
          Go Home
        </Button>
      </div>
    </div>
  );
}
