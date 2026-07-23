'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { formatDistanceToNow } from 'date-fns';
import { Bug, Lightbulb, MessageCircle } from 'lucide-react';

const typeIcons = {
  bug: <Bug className="w-4 h-4 text-danger" />,
  feature: <Lightbulb className="w-4 h-4 text-warning" />,
  other: <MessageCircle className="w-4 h-4 text-info" />,
};

const typeColors = {
  bug: 'bg-danger/10 text-danger border-danger/20',
  feature: 'bg-warning/10 text-warning border-warning/20',
  other: 'bg-info/10 text-info border-info/20',
};

const statusColors = {
  open: 'bg-success/10 text-success',
  in_progress: 'bg-brand-orange/10 text-brand-orange',
  closed: 'bg-surface-2 text-text-secondary',
};

export default function AdminFeedbackPage() {
  const queryClient = useQueryClient();

  const { data: feedback, isLoading } = useQuery({
    queryKey: ['admin-feedback'],
    queryFn: () => api.fetch('/admin/feedback').then((r) => r.json()),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.fetch(`/admin/feedback/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
  });

  if (isLoading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-brand-orange border-t-transparent animate-spin" /></div>;
  }

  if (!feedback?.length) {
    return (
      <div className="text-center p-12 bg-bg-surface border border-hairline rounded-2xl">
        <MessageCircle className="w-12 h-12 text-text-secondary/40 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text-primary mb-2">No feedback yet</h3>
        <p className="text-text-secondary">When users submit feedback, it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {feedback.map((item: any) => (
        <div key={item.id} className="p-5 bg-bg-surface border border-hairline rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-start">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${typeColors[item.type as keyof typeof typeColors]}`}>
                {typeIcons[item.type as keyof typeof typeIcons]}
                <span className="capitalize">{item.type}</span>
              </span>
              <span className="text-xs text-text-secondary">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </span>
              <span className="text-xs text-text-secondary">•</span>
              <span className="text-xs text-text-secondary font-medium">
                {item.userId ? 'Registered User' : 'Guest'}
              </span>
            </div>
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap bg-surface-1 p-4 rounded-xl border border-hairline">
              {item.message}
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${statusColors[item.status as keyof typeof statusColors]}`}>
              {item.status.replace('_', ' ')}
            </span>
            <select
              value={item.status}
              onChange={(e) => updateStatus.mutate({ id: item.id, status: e.target.value })}
              className="bg-bg-base border border-hairline rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-orange"
            >
              <option value="open">Mark Open</option>
              <option value="in_progress">Mark In Progress</option>
              <option value="closed">Mark Closed</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
