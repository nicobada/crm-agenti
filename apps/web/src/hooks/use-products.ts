"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface Product {
  id: string;
  name: string;
  sku: string;
  basePrice: number;
  createdAt: string;
}

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await apiClient.get('/products');
      return data;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/products', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const { data } = await apiClient.patch(`/products/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/products/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await apiClient.get(`/products/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useGenerateVariants() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { productId: string; attributes: any[] }) => {
      const { data } = await apiClient.post(`/products/${payload.productId}/variants/generate`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products', variables.productId] });
    },
  });
}

export function useUpdateVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, variantId, payload }: { productId?: string; variantId: string; payload: any }) => {
      const url = productId ? `/products/${productId}/variants/${variantId}` : `/products/variants/${variantId}`;
      const { data } = await apiClient.patch(url, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.productId) {
        queryClient.invalidateQueries({ queryKey: ['products', variables.productId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['products'] });
      }
    },
  });
}

export function useDeleteVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, variantId }: { productId?: string; variantId: string }) => {
      const url = productId ? `/products/${productId}/variants/${variantId}` : `/products/variants/${variantId}`;
      const { data } = await apiClient.delete(url);
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.productId) {
        queryClient.invalidateQueries({ queryKey: ['products', variables.productId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['products'] });
      }
    },
  });
}
