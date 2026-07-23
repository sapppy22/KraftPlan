'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'verify' | 'reset' | 'success'>('email');
  
  // Verification code / new password state
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate API reset request
    setTimeout(() => {
      setLoading(false);
      setStep('verify');
      setMessage(`We've sent a 6-digit reset code to ${email}`);
    }, 1000);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 4) {
      setError('Please enter the verification code sent to your email.');
      return;
    }
    setError('');
    setStep('reset');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      setLoading(false);
      setStep('success');
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-4 py-8 bg-bg-base relative transition-colors duration-300">
      {/* Top Header with Theme Toggler */}
      <header className="flex items-center justify-between max-w-4xl mx-auto w-full">
        <Link href="/" aria-label="KraftPlan Home">
          <Logo size={36} wordmarkClassName="text-lg" />
        </Link>
        <ThemeToggle variant="compact" />
      </header>

      {/* Main Form Container */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md space-y-6 bg-bg-surface p-6 sm:p-8 rounded-3xl border border-hairline shadow-xl">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Log In
          </Link>

          {/* STEP 1: Enter Email */}
          {step === 'email' && (
            <div className="space-y-6">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center mb-4">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h1 className="font-display text-2xl font-bold">Forgot password?</h1>
                <p className="text-text-secondary text-sm mt-1">
                  No worries! Enter your email address below and we&apos;ll send you instructions to reset your password.
                </p>
              </div>

              <form onSubmit={handleSendResetEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-bg-elevated border border-hairline rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange text-sm"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send reset code'}
                </Button>
              </form>
            </div>
          )}

          {/* STEP 2: Enter Verification Code */}
          {step === 'verify' && (
            <div className="space-y-6">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h1 className="font-display text-2xl font-bold">Check your email</h1>
                <p className="text-text-secondary text-sm mt-1">{message}</p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">6-Digit Reset Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. 849201"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-bg-elevated border border-hairline rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange text-center tracking-widest font-mono text-lg"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full">
                  Verify Code
                </Button>

                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full text-xs text-text-secondary hover:text-text-primary text-center underline pt-2"
                >
                  Didn&apos;t receive email? Resend code
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: Set New Password */}
          {step === 'reset' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold">Set new password</h1>
                <p className="text-text-secondary text-sm mt-1">
                  Your new password must be at least 8 characters long.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      minLength={8}
                      className="w-full px-4 py-3 pr-12 bg-bg-elevated border border-hairline rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    minLength={8}
                    className="w-full px-4 py-3 bg-bg-elevated border border-hairline rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-orange text-sm"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset password'}
                </Button>
              </form>
            </div>
          )}

          {/* STEP 4: Reset Success */}
          {step === 'success' && (
            <div className="py-6 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-brand-green/20 text-brand-green flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold">Password Reset!</h1>
                <p className="text-text-secondary text-sm mt-1">
                  Your password has been successfully updated. You can now log in with your new password.
                </p>
              </div>
              <Button onClick={() => router.push('/login')} className="w-full">
                Log In Now
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="text-center text-xs text-text-secondary max-w-4xl mx-auto w-full">
        &copy; {new Date().getFullYear()} KraftPlan. All rights reserved.
      </footer>
    </div>
  );
}
