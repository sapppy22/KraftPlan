'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, BarChart3, Library, Settings, UserCircle, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/lib/AuthContext';
import { GuidedTour } from '@/components/GuidedTour';
import { FeedbackButton } from '@/components/FeedbackButton';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/plans', label: 'Plans', icon: CalendarDays },
  { href: '/progress', label: 'Progress', icon: BarChart3 },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isGuest, logout } = useAuth();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bg-base transition-colors duration-300">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 bg-bg-base/80 backdrop-blur-lg border-b border-hairline lg:hidden">
          <div className="flex items-center justify-between px-4 h-14">
            <Link href="/dashboard" aria-label="KraftPlan home">
              <Logo size={30} wordmarkClassName="text-lg" />
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle variant="compact" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-secondary hidden sm:inline">{isGuest ? 'Guest' : user?.name}</span>
                <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-text-secondary" />
                </div>
              </div>
              <button
                onClick={logout}
                title="Log Out"
                className="p-2 rounded-xl text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-bg-surface border-r border-hairline transition-colors duration-300">
            <div className="flex items-center justify-between px-6 h-16 border-b border-hairline">
              <Logo size={38} wordmarkClassName="text-xl" />
              <ThemeToggle variant="compact" />
            </div>
            
            <div className="px-6 py-4 border-b border-hairline flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                  <UserCircle className="w-6 h-6 text-text-secondary" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-text-primary truncate">{isGuest ? 'Guest User' : user?.name}</p>
                  <p className="text-xs text-text-secondary truncate">{isGuest ? 'Explore Mode' : user?.email}</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-tour={`nav-${item.label.toLowerCase()}`}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative',
                      isActive
                        ? 'bg-brand-orange/10 text-brand-orange font-semibold'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-1',
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-orange rounded-r-full" />
                    )}
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Sidebar Theme & Logout Switcher Footer */}
            <div className="px-6 py-4 border-t border-hairline space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">Theme</span>
                <ThemeToggle variant="pill" />
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-danger hover:bg-danger/10 transition-all group"
              >
                <LogOut className="w-4 h-4 transition-colors group-hover:text-danger" />
                <span>Log Out</span>
              </button>
            </div>

            {user?.role === 'admin' && (
              <div className="px-4 py-3 border-t border-hairline">
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-all group"
                >
                  <Settings className="w-5 h-5 transition-colors group-hover:text-success" />
                  <span className="text-success font-semibold">Admin Portal</span>
                </Link>
              </div>
            )}
          </aside>

            {user?.role === 'admin' && (
              <div className="px-4 py-3 border-t border-hairline">
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-all group"
                >
                  <Settings className="w-5 h-5 transition-colors group-hover:text-success" />
                  <span className="text-success font-semibold">Admin Portal</span>
                </Link>
              </div>
            )}
          </aside>

          {/* Main content */}
          <main className="flex-1 lg:pl-64">
            <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10">{children}</div>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-bg-surface/90 backdrop-blur-lg border-t border-hairline lg:hidden pb-safe">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-tour={`nav-${item.label.toLowerCase()}-mobile`}
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors',
                    isActive ? 'text-brand-orange' : 'text-text-secondary',
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
        
        <GuidedTour />
        <FeedbackButton />
      </div>
    </AuthGuard>
  );
}
