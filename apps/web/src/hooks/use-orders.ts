"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  orderDate: string;
  client?: { id: string; name: string };
  agent?: {
    id: string;
    code: string;
    user?: { firstName: string; lastName: string };
  };
  commissions?: any[];
}

export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await apiClient.get('/orders');
      return data;
    },
  });
}

export function useRecentOrders(limit = 5) {
  return useQuery<Order[]>({
    queryKey: ['orders', 'recent', limit],
    queryFn: async () => {
      const { data } = await apiClient.get(`/orders/recent?limit=${limit}`);
      return data;
    },
  });
}

export function useOrder(id: string | null) {
  return useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!id) return null as any;
      const { data } = await apiClient.get(`/orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await apiClient.patch(`/orders/${id}/status`, { status });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'recent'] });
      queryClient.invalidateQueries({ queryKey: ['order-detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/orders', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
