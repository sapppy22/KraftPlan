'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, UserCircle2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import Button from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login: setAuth, continueAsGuest } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.login({ email, password });
      setAuth(res.accessToken, res.user);
      
      const redirect = localStorage.getItem('redirectAfterLogin');
      if (redirect) {
        localStorage.removeItem('redirectAfterLogin');
        router.push(redirect);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between px-4 py-8 bg-bg-base relative transition-colors duration-300">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-4xl mx-auto w-full">
        <Link href="/" aria-label="KraftPlan Home">
          <Logo size={36} wordmarkClassName="text-lg" />
        </Link>
        <ThemeToggle variant="compact" />
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-md space-y-8 bg-bg-surface p-6 sm:p-8 rounded-3xl border border-hairline shadow-2xl">
          <div className="text-center">
            <Logo size={56} showWordmark={false} className="mx-auto mb-3" />
            <h1 className="font-display text-3xl font-bold">Welcome back</h1>
            <p className="text-text-secondary text-sm mt-1.5">Log in to continue your journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-bg-elevated border border-hairline rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange text-sm"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-brand-orange hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-bg-elevated border border-hairline rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange text-sm"
                  placeholder="• • • • • • • •"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log in'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-hairline"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-bg-surface text-text-secondary font-medium">OR</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full gap-2 text-sm"
            onClick={continueAsGuest}
          >
            <UserCircle2 className="w-5 h-5 text-brand-orange" />
            Continue as Guest
          </Button>

          <p className="text-center text-xs text-text-secondary pt-2">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-brand-orange hover:underline font-bold">
              Sign up free
            </Link>
          </p>
        </div>
      </main>

      <footer className="text-center text-xs text-text-secondary max-w-4xl mx-auto w-full">
        &copy; {new Date().getFullYear()} KraftPlan. All rights reserved.
      </footer>
    </div>
  );
}
