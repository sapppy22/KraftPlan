'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  avatarUrl?: string;
  units?: string;
  experience?: string;
  bodyweightKg?: number;
  heightCm?: number;
  goal?: string;
}

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const GUEST_TOKEN = 'GUEST_MODE';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  
  // Only start checking after mount to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem('accessToken'));
    setMounted(true);
  }, []);

  const isGuest = token === GUEST_TOKEN;

  // Use React Query for optimal session caching.
  // It won't refetch on every mount if the data is fresh.
  const { data: user, isLoading: isQueryLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      if (!token || isGuest) return null;
      return api.getProfile();
    },
    enabled: !!token && !isGuest,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    retry: false,
  });

  const isLoading = !mounted || (!!token && !isGuest && isQueryLoading);
  const isAuthenticated = isGuest || !!user;

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('accessToken', newToken);
    setToken(newToken);
    queryClient.setQueryData(['auth', 'me'], newUser);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setToken(null);
    queryClient.clear();
    router.push('/');
  };

  const continueAsGuest = () => {
    localStorage.setItem('accessToken', GUEST_TOKEN);
    setToken(GUEST_TOKEN);
    router.push('/dashboard');
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isGuest,
        isAuthenticated,
        isLoading,
        login,
        logout,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
