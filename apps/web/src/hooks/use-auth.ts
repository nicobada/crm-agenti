"use client";

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  agentId?: string | null;
}

export type AuthResult = UseQueryResult<User | null, Error> & {
  user: User | null;
  isAdminOrManager: boolean;
  isAdmin: boolean;
};

export function useAuth(): AuthResult {
  const query = useQuery<User | null>({
    queryKey: ['auth'],
    queryFn: async () => {
      if (typeof window === 'undefined') return null;
      const token = localStorage.getItem('token');
      if (!token) return null;

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
          id: payload.sub,
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
          roles: payload.roles || [],
          agentId: payload.agentId,
        } as User;
      } catch {
        return null;
      }
    },
    staleTime: Infinity,
  });

  const user = query.data ?? null;
  const isAdminOrManager = user?.roles?.includes('ADMIN') || user?.roles?.includes('MANAGER') || false;
  const isAdmin = user?.roles?.includes('ADMIN') || false;

  return Object.assign(query, {
    user,
    isAdminOrManager,
    isAdmin,
  });
}

export function useIsAdmin() {
  const { data: user } = useAuth();
  return user?.roles?.includes('ADMIN') || user?.roles?.includes('MANAGER') || false;
}

export function useAuthContext() {
  const { data: user, isLoading } = useAuth();
  return {
    user,
    isLoading,
    isAdminOrManager: user?.roles?.includes('ADMIN') || user?.roles?.includes('MANAGER') || false,
    isAdmin: user?.roles?.includes('ADMIN') || false,
  };
}

// Legacy export for backwards compatibility
export function useAuthWithFlags() {
  const { data: user, isLoading } = useAuth();
  return {
    data: user,
    isLoading,
    isAdminOrManager: user?.roles?.includes('ADMIN') || user?.roles?.includes('MANAGER') || false,
    isAdmin: user?.roles?.includes('ADMIN') || false,
  };
}
