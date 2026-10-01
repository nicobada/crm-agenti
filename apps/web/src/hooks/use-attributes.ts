"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export function useAttributes() {
  return useQuery({
    queryKey: ['attributes'],
    queryFn: async () => {
      const { data } = await apiClient.get('/attributes');
      return data;
    },
  });
}

export function useCreateAttribute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/attributes', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
    },
  });
}
