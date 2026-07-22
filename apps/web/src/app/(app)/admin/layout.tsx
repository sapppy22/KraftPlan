'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ShieldAlert, Users, MessageSquare, LayoutDashboard } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user?.role !== 'admin') {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-brand-orange border-t-transparent animate-spin" /></div>;
  }

  const tabs = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-6 border-b border-white/5">
        <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6 text-danger" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Admin Portal</h1>
          <p className="text-sm text-text-secondary">Manage users, feedback, and system health.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/5 pb-4 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.href === '/admin' ? pathname === tab.href : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                isActive 
                  ? 'bg-white/10 text-white' 
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div>{children}</div>
    </div>
  );
}
