'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Basic client-side check. A robust check will be in AuthGuard.
    const token = localStorage.getItem('accessToken');
    if (token) {
      router.push('/dashboard');
    } else {
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-6">
        <Logo size={40} wordmarkClassName="text-xl" />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <Logo size={80} showWordmark={false} className="mb-6" />
        <h1 className="text-4xl md:text-6xl font-display font-bold mb-4">
          Unleash Your <span className="text-brand-orange">Potential</span>
        </h1>
        <p className="text-xl text-text-secondary max-w-2xl mb-10">
          Discover, customize, and execute structured gym workout plans. Track your progress and crush your PRs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm mx-auto">
          <Link href="/register" className="w-full">
            <Button className="w-full">Get Started</Button>
          </Link>
          <Link href="/login" className="w-full">
            <Button variant="secondary" className="w-full">Log In</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
