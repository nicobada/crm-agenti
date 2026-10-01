"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface Commission {
  id: string;
  amount: number;
  percentage: number;
  baseAmount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  createdAt: string;
  paidAt: string | null;
  clientName: string;
  clientId: string | null;
  orderTotal: number;
  orderId: string;
  orderNumber?: string;
  agentCode: string;
  agentName: string;
}

export function useCommissions() {
  return useQuery<Commission[]>({
    queryKey: ['commissions'],
    queryFn: async () => {
      const { data } = await apiClient.get('/commissions');
      return data;
    },
  });
}

export function usePayCommission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/commissions/${id}/pay`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
  });
}

export function useApproveCommission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/commissions/${id}/approve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
  });
}