'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Users, MessageSquare, CalendarDays, Dumbbell } from 'lucide-react';

function StatCard({ title, value, icon: Icon, colorClass }: any) {
  return (
    <div className="p-6 bg-bg-surface border border-hairline rounded-2xl">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-text-secondary text-sm font-medium">{title}</p>
          <p className="font-display text-3xl font-bold mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.fetch('/admin/stats').then(r => r.json()),
  });

  if (isLoading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-brand-orange border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Users" 
          value={stats?.users || 0} 
          icon={Users} 
          colorClass="bg-blue-500/10 text-blue-500" 
        />
        <StatCard 
          title="Open Feedback" 
          value={stats?.feedback || 0} 
          icon={MessageSquare} 
          colorClass="bg-brand-orange/10 text-brand-orange" 
        />
        <StatCard 
          title="Training Plans" 
          value={stats?.plans || 0} 
          icon={CalendarDays} 
          colorClass="bg-purple-500/10 text-purple-500" 
        />
        <StatCard 
          title="Exercises" 
          value={stats?.exercises || 0} 
          icon={Dumbbell} 
          colorClass="bg-emerald-500/10 text-emerald-500" 
        />
      </div>
      
      {/* Could add a chart or recent activity here in the future */}
      <div className="p-6 bg-bg-surface border border-hairline rounded-2xl">
        <h3 className="font-bold text-lg mb-2">System Status</h3>
        <p className="text-text-secondary text-sm">All services are operating normally. Use the tabs above to manage specific sections of the platform.</p>
      </div>
    </div>
  );
}
