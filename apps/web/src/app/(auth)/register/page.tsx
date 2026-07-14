'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dumbbell, Loader2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.register({ email, password, name });
      localStorage.setItem('accessToken', res.accessToken);
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold">Get started</h1>
          <p className="text-text-secondary mt-2">Create your ForgeFit account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-bg-surface border border-white/10 rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-blue"
              placeholder="Alex"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-bg-surface border border-white/10 rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-blue"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-bg-surface border border-white/10 rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-blue"
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link href="/login" className="text-accent-blue hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
