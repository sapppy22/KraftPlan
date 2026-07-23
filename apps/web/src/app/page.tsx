'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Activity,
  TrendingUp,
  Zap,
  Play,
  Flame,
  Calendar,
  Dumbbell,
  CheckCircle2,
  Shield,
  Clock,
  Sparkles,
  ChevronRight,
  Star,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { FeedbackButton } from '@/components/FeedbackButton';
import { useAuth } from '@/lib/AuthContext';

const PROGRAM_PREVIEWS = [
  {
    id: 'ppl',
    title: 'Push Pull Legs (PPL)',
    category: 'Hypertrophy',
    duration: '8 Weeks',
    days: '6 Days/wk',
    difficulty: 'Intermediate',
    desc: 'Classic 6-day split designed for maximum muscular hypertrophy and progressive overload.',
    exercises: ['Barbell Bench Press', 'Incline Dumbbell Press', 'Barbell Back Squat', 'Lat Pulldown'],
  },
  {
    id: 'strength',
    title: 'Starting Strength 5x5',
    category: 'Strength',
    duration: '12 Weeks',
    days: '3 Days/wk',
    difficulty: 'Beginner',
    desc: 'Linear progression compound lifting focus for building raw foundational strength.',
    exercises: ['Barbell Back Squat', 'Overhead Press (OHP)', 'Barbell Deadlift', 'Barbell Row'],
  },
  {
    id: 'hyrox',
    title: 'Hyrox Prep & Functional Fitness',
    category: 'Hybrid',
    duration: '8 Weeks',
    days: '5 Days/wk',
    difficulty: 'Intermediate',
    desc: 'Run intervals alternating with sled pushes, wall balls, and functional station conditioning.',
    exercises: ['Treadmill Run', 'Sled Push', 'Wall Ball', 'Farmer\'s Carry'],
  },
  {
    id: 'mobility',
    title: 'Foundation Mobility & Recovery',
    category: 'Mobility',
    duration: '4 Weeks',
    days: '5 Days/wk',
    difficulty: 'Beginner',
    desc: 'Daily 15-minute routines to unlock thoracic spine, hip flexor, and ankle mobility.',
    exercises: ['World\'s Greatest Stretch', '90/90 Hip Stretch', 'Cat-Cow', 'Thoracic Rotation'],
  },
];

export default function RootPage() {
  const { continueAsGuest } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen flex flex-col bg-bg-base text-text-primary relative overflow-x-hidden transition-colors duration-300">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[50%] rounded-full bg-brand-green/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[50%] h-[45%] rounded-full bg-brand-soft/10 blur-[140px] pointer-events-none" />

      {/* ── Navigation Header ── */}
      <header className="sticky top-0 z-50 bg-bg-base/80 backdrop-blur-xl border-b border-hairline transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          <Link href="/" aria-label="KraftPlan Home">
            <Logo size={42} wordmarkClassName="text-xl font-bold tracking-tight" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#programs" className="hover:text-text-primary transition-colors">Programs</a>
            <Link href="/library" className="hover:text-text-primary transition-colors">Exercise Library</Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle variant="pill" />
            
            <Link href="/login" className="hidden sm:inline-block">
              <button className="px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors">
                Log In
              </button>
            </Link>

            <Link href="/register">
              <Button size="sm" className="shadow-md">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero Section ── */}
        <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 px-4 sm:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-green/10 border border-brand-green/20 mb-8 backdrop-blur-md animate-fade-in">
            <Sparkles className="w-4 h-4 text-brand-green animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold text-brand-green">KraftPlan 2.0 is now live</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight max-w-5xl mx-auto leading-[1.1] text-balance">
            Engineered for <br className="hidden sm:block" />
            <span className="gradient-text">Peak Performance.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto font-light leading-relaxed text-balance">
            The ultimate minimalist platform to discover, customize, and execute structured workout plans with zero clutter. Built for athletes who demand real results.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto group shadow-xl">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <button
              onClick={continueAsGuest}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-surface-1 border border-hairline hover:bg-surface-2 text-text-primary text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Explore Demo as Guest</span>
              <ChevronRight className="w-4 h-4 text-text-secondary" />
            </button>
          </div>

          {/* ── Interactive Hero UI Showcase Card ── */}
          <div className="mt-16 sm:mt-20 max-w-4xl mx-auto relative">
            <div className="absolute -inset-1 rounded-3xl gradient-bg opacity-25 blur-xl pointer-events-none" />
            
            <div className="relative rounded-3xl bg-bg-surface border border-hairline shadow-2xl p-4 sm:p-8 text-left space-y-6 overflow-hidden">
              {/* Fake App Bar */}
              <div className="flex items-center justify-between border-b border-hairline pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <span className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs text-text-secondary font-mono ml-2">kraftplan.app/dashboard</span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-brand-green/15 text-brand-green font-semibold">
                  LIVE DEMO PREVIEW
                </span>
              </div>

              {/* Demo Hero Card */}
              <div className="p-6 rounded-2xl gradient-bg text-white space-y-4 shadow-lg">
                <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-white/80">
                  <span>Today's Session</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> 45 min
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold">Push Pull Legs — Upper Body Hypertrophy</h3>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm font-semibold backdrop-blur-md transition-all">
                    <Play className="w-4 h-4 fill-current" />
                    Start Workout Session
                  </span>
                </div>
              </div>

              {/* Demo Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-surface-1 border border-hairline">
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Flame className="w-4 h-4 text-warning" />
                    <span>Streak</span>
                  </div>
                  <p className="text-xl font-bold mt-1">14 Days</p>
                </div>

                <div className="p-4 rounded-xl bg-surface-1 border border-hairline">
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Calendar className="w-4 h-4 text-brand-soft" />
                    <span>This Week</span>
                  </div>
                  <p className="text-xl font-bold mt-1">4 / 5 <span className="text-xs text-text-secondary font-normal">sessions</span></p>
                </div>

                <div className="p-4 rounded-xl bg-surface-1 border border-hairline">
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Dumbbell className="w-4 h-4 text-brand-green" />
                    <span>30d Volume</span>
                  </div>
                  <p className="text-xl font-bold mt-1">24,500 kg</p>
                </div>

                <div className="p-4 rounded-xl bg-surface-1 border border-hairline">
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span>Top PR</span>
                  </div>
                  <p className="text-xl font-bold mt-1">120 kg <span className="text-xs text-success font-semibold">+5%</span></p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature Highlights Grid ── */}
        <section id="features" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto border-t border-hairline">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight">
              Built for Athletes Who Want <span className="gradient-text">No Nonsense.</span>
            </h2>
            <p className="text-text-secondary text-base sm:text-lg mt-4 leading-relaxed">
              Every feature is tuned to remove friction during your workout while providing deep progress tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card interactive className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Smart Set Logging</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Log weight, reps, and RPE with pre-filled targets from your previous workout. Rest timer auto-triggers on completion.
              </p>
            </Card>

            <Card interactive className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-soft/10 text-brand-soft flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Adaptive Training Blocks</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Choose from PPL, Hyrox, Powerlifting, or build custom training splits that adapt seamlessly to your weekly schedule.
              </p>
            </Card>

            <Card interactive className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-deep/10 text-brand-green flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">1RM & PR Analytics</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Visualize total volume, 30-day work capacity, and estimated 1RM trends across exercises with instant PR celebrations.
              </p>
            </Card>

            <Card interactive className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-soft/10 text-brand-soft flex items-center justify-center">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">300+ Exercise Video Library</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Access HD video tutorials, coaching cues, primary muscle group tags, and common mistake warnings for every lift.
              </p>
            </Card>

            <Card interactive className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Rest Timer & Tempo Control</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Keep your session tempo on track with customizable audio-visual rest timers and prescribed rep tempo guidelines.
              </p>
            </Card>

            <Card interactive className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-soft/10 text-brand-soft flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Edge Speed & Offline Ready</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Powered by Cloudflare Workers and local storage caching for sub-millisecond response times even in basement gyms.
              </p>
            </Card>
          </div>
        </section>

        {/* ── Interactive Program Explorer ── */}
        <section id="programs" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto border-t border-hairline">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight">
              Pre-Built &amp; <span className="gradient-text">Custom Programs</span>
            </h2>
            <p className="text-text-secondary text-base sm:text-lg mt-4">
              Explore science-backed training plans built for hypertrophy, strength, and functional conditioning.
            </p>
          </div>

          {/* Program Tabs */}
          <div className="flex justify-center gap-2 overflow-x-auto pb-4 scrollbar-none">
            {PROGRAM_PREVIEWS.map((prog, idx) => (
              <button
                key={prog.id}
                onClick={() => setActiveTab(idx)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === idx
                    ? 'gradient-bg text-white shadow-md'
                    : 'bg-surface-1 border border-hairline text-text-secondary hover:text-text-primary'
                }`}
              >
                {prog.category}
              </button>
            ))}
          </div>

          {/* Active Program Card */}
          <div className="mt-8 max-w-3xl mx-auto">
            <Card className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-green/15 text-brand-green capitalize">
                  {PROGRAM_PREVIEWS[activeTab].category}
                </span>
                <div className="flex gap-3 text-xs text-text-secondary font-medium">
                  <span>{PROGRAM_PREVIEWS[activeTab].duration}</span>
                  <span>·</span>
                  <span>{PROGRAM_PREVIEWS[activeTab].days}</span>
                  <span>·</span>
                  <span className="capitalize text-brand-orange font-semibold">{PROGRAM_PREVIEWS[activeTab].difficulty}</span>
                </div>
              </div>

              <div>
                <h3 className="font-display text-2xl font-bold">{PROGRAM_PREVIEWS[activeTab].title}</h3>
                <p className="text-text-secondary text-sm mt-2 leading-relaxed">
                  {PROGRAM_PREVIEWS[activeTab].desc}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Key Exercises Included</p>
                <div className="flex flex-wrap gap-2">
                  {PROGRAM_PREVIEWS[activeTab].exercises.map((ex) => (
                    <span key={ex} className="px-3 py-1 rounded-lg bg-surface-1 border border-hairline text-xs font-medium">
                      {ex}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Link href="/register">
                  <Button className="w-full sm:w-auto">
                    Start This Program Free
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </section>

        {/* ── Live Stats Ticker ── */}
        <section className="py-16 bg-surface-1 border-y border-hairline">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-display text-4xl sm:text-5xl font-extrabold gradient-text">50,000+</p>
              <p className="text-text-secondary text-sm font-medium mt-1">Workouts Executed</p>
            </div>
            <div>
              <p className="font-display text-4xl sm:text-5xl font-extrabold gradient-text">300+</p>
              <p className="text-text-secondary text-sm font-medium mt-1">Video Tutorials</p>
            </div>
            <div>
              <p className="font-display text-4xl sm:text-5xl font-extrabold gradient-text">99.9%</p>
              <p className="text-text-secondary text-sm font-medium mt-1">Edge Uptime</p>
            </div>
            <div>
              <p className="font-display text-4xl sm:text-5xl font-extrabold gradient-text">4.9 / 5</p>
              <p className="text-text-secondary text-sm font-medium mt-1 flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400 inline" /> Athlete Rating
              </p>
            </div>
          </div>
        </section>

        {/* ── Final Call to Action ── */}
        <section className="py-24 px-4 sm:px-8 max-w-4xl mx-auto text-center space-y-8">
          <h2 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight">
            Ready to Take Control of Your Training?
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Join thousands of lifters using KraftPlan to track progress and hit new personal records.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto shadow-2xl">
                Create Free Account
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Log In
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-hairline py-12 px-4 sm:px-8 bg-bg-surface transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-text-secondary">
          <div className="flex items-center gap-3">
            <Logo size={32} wordmarkClassName="text-base" />
            <span>&copy; {new Date().getFullYear()} KraftPlan. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/library" className="hover:text-text-primary transition-colors">Library</Link>
            <Link href="/plans" className="hover:text-text-primary transition-colors">Plans</Link>
            <Link href="/login" className="hover:text-text-primary transition-colors">Log In</Link>
            <Link href="/register" className="hover:text-text-primary transition-colors">Register</Link>
            <ThemeToggle variant="compact" />
          </div>
        </div>
      </footer>

      <FeedbackButton />
    </div>
  );
}
