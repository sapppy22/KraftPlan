import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col items-center justify-center p-4 text-center">
      <Logo size={80} showWordmark={false} className="mb-6 opacity-50" />
      <h1 className="text-6xl font-display font-bold mb-4 text-brand-orange">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Page not found</h2>
      <p className="text-text-secondary mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link href="/">
        <Button>Return Home</Button>
      </Link>
    </div>
  );
}
