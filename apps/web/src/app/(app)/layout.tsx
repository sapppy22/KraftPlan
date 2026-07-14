'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dumbbell, LayoutDashboard, CalendarDays, BarChart3, Library, Settings, ChevronLeft, Github } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/plans', label: 'Plans', icon: CalendarDays },
  { href: '/progress', label: 'Progress', icon: BarChart3 },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Mobile header */}
      <header className="sticky top-0 z-40 bg-bg-base/80 backdrop-blur-lg border-b border-white/5 lg:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg">ForgeFit</span>
          </Link>
          <a
            href="https://github.com/admin_redacted/KraftPlan"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-white/5 transition-colors group"
            aria-label="GitHub"
          >
            <Github className="w-5 h-5 text-text-secondary group-hover:text-[#F97316] transition-colors" />
          </a>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-bg-surface border-r border-white/5">
          <div className="flex items-center gap-3 px-6 h-16 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">ForgeFit</span>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-accent-blue/10 text-accent-blue'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5',
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-4 py-4 border-t border-white/5">
            <a
              href="https://github.com/admin_redacted/KraftPlan"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-all group"
            >
              <Github className="w-5 h-5 transition-colors group-hover:text-[#F97316]" style={{ filter: 'drop-shadow(0 0 4px rgba(249, 115, 22, 0.3))' }} />
              <span className="bg-gradient-to-r from-[#F97316] to-[#FBBF24] bg-clip-text text-transparent font-semibold">GitHub</span>
            </a>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:pl-64">
          <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-bg-surface/90 backdrop-blur-lg border-t border-white/5 lg:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors',
                  isActive ? 'text-accent-blue' : 'text-text-secondary',
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
