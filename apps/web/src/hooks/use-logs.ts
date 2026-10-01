"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId: string;
  details: string | null;
  createdAt: string;
}

export function useLogs() {
  return useQuery<ActivityLog[]>({
    queryKey: ['logs'],
    queryFn: async () => {
      const { data } = await apiClient.get('/logs');
      return data;
    },
  });
}