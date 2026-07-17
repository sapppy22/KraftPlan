'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import { Loader2, ArrowRight, Activity, TrendingUp, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function RootPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      router.push('/dashboard');
    } else {
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-base relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-orange/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-red/10 blur-[120px] pointer-events-none" />

      <header className="px-8 py-6 flex items-center justify-between relative z-10">
        <Logo size={40} wordmarkClassName="text-xl font-bold tracking-tight" />
        <div className="hidden sm:flex items-center gap-4">
          <Link href="/login" className="text-text-secondary hover:text-white transition-colors text-sm font-medium">
            Log In
          </Link>
          <Link href="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center relative z-10 -mt-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
          <span className="text-sm font-medium text-text-secondary">KraftPlan 2.0 is live</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight text-balance max-w-4xl mx-auto leading-[1.1]">
          Engineered for <br className="hidden sm:block" />
          <span className="gradient-text">Peak Performance.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-text-secondary max-w-2xl mb-12 text-balance font-light leading-relaxed">
          The ultimate minimalist platform to discover, customize, and execute structured gym workout plans. Built for athletes who demand more.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto justify-center mb-24">
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto group">
              Start your journey
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto sm:hidden">
            <Button variant="secondary" size="lg" className="w-full">Log In</Button>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full px-4 text-left">
          <Card interactive className="bg-white/5 backdrop-blur-xl border-white/10">
            <Activity className="w-8 h-8 text-brand-orange mb-4" />
            <h3 className="text-xl font-bold mb-2">Smart Tracking</h3>
            <p className="text-text-secondary text-sm leading-relaxed">Log every set, rep, and PR seamlessly with an interface designed to stay out of your way.</p>
          </Card>
          <Card interactive className="bg-white/5 backdrop-blur-xl border-white/10">
            <Zap className="w-8 h-8 text-brand-amber mb-4" />
            <h3 className="text-xl font-bold mb-2">Adaptive Plans</h3>
            <p className="text-text-secondary text-sm leading-relaxed">Choose from pre-built programs or create custom blocks that adapt to your schedule.</p>
          </Card>
          <Card interactive className="bg-white/5 backdrop-blur-xl border-white/10">
            <TrendingUp className="w-8 h-8 text-brand-red mb-4" />
            <h3 className="text-xl font-bold mb-2">Deep Insights</h3>
            <p className="text-text-secondary text-sm leading-relaxed">Visualize your volume, adherence, and estimated 1RM trends across weeks and months.</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
