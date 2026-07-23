'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, UserCircle2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import Button from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Logo size={60} showWordmark={false} className="mx-auto mb-4" />
          <h1 className="font-display text-3xl font-bold">Welcome back</h1>
          <p className="text-text-secondary mt-2">Log in to continue your journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-bg-surface border border-hairline rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-bg-surface border border-hairline rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange"
                placeholder="• • • • • • • •"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
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
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-bg-base text-text-secondary">or</span>
          </div>
        </div>

        <Button 
          type="button" 
          variant="secondary" 
          className="w-full gap-2" 
          onClick={continueAsGuest}
        >
          <UserCircle2 className="w-5 h-5" />
          Continue as Guest
        </Button>

        <p className="text-center text-sm text-text-secondary pt-4">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-brand-orange hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
