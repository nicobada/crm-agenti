"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  vatNumber?: string;
  specialization?: string;
  type: string;
  agentId?: string;
  agent?: {
    id: string;
    code: string;
    user?: { firstName: string; lastName: string };
  };
  createdAt: string;
}

export function useClients() {
  return useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await apiClient.get('/clients');
      return data;
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Client>) => {
      const { data } = await apiClient.post('/clients', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Client> }) => {
      const { data } = await apiClient.patch(`/clients/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
