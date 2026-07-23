'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { formatDistanceToNow } from 'date-fns';
import { Shield, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.fetch('/admin/users').then((r) => r.json()),
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: 'admin' | 'user' }) => {
      await api.fetch(`/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  if (isLoading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-brand-orange border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="bg-bg-surface border border-hairline rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-surface-1 text-text-secondary">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Joined</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {users?.map((user: any) => (
              <tr key={user.id} className="hover:bg-surface-1 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-text-primary">{user.name}</div>
                  {user.id === currentUser?.id && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-brand-orange/10 text-brand-orange rounded-full">
                      You
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-text-secondary">{user.email}</td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                    user.role === 'admin' ? 'bg-success/10 text-success' : 'bg-surface-2 text-text-secondary'
                  }`}>
                    {user.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    <span className="capitalize">{user.role}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-text-secondary">
                  {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                </td>
                <td className="px-6 py-4 text-right">
                  <select
                    value={user.role}
                    disabled={user.id === currentUser?.id}
                    onChange={(e) => updateRole.mutate({ id: user.id, role: e.target.value as 'admin' | 'user' })}
                    className="bg-bg-base border border-hairline rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-orange disabled:opacity-50"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
