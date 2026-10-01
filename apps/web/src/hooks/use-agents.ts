import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await api.get("/agents");
      return res.data;
    },
  });
}

export function useCreateAgent() {
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/agents", payload);
      return res.data;
    },
  });
}

export function useUpdateAgent() {
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await api.patch(`/agents/${id}`, payload);
      return res.data;
    },
  });
}

// Aggiungi questo hook specifico per il toggle dello stato
export function useToggleAgentStatus() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/agents/${id}/toggle-status`);
      return res.data;
    },
  });
}