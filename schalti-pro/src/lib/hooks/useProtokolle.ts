import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { protokollApi } from "@/lib/api";
import type { Arbeitsprotokoll } from "@/types";

// Query Keys
export const protokollKeys = {
  all: ["protokolle"] as const,
  lists: () => [...protokollKeys.all, "list"] as const,
  list: (filters: string) => [...protokollKeys.lists(), { filters }] as const,
  details: () => [...protokollKeys.all, "detail"] as const,
  detail: (id: string) => [...protokollKeys.details(), id] as const,
  byProjekt: (projektId: string) => [...protokollKeys.all, "projekt", projektId] as const,
};

// Get all protokolle
export function useProtokolle() {
  return useQuery({
    queryKey: protokollKeys.lists(),
    queryFn: async () => {
      const data = await protokollApi.getAll();
      return data.map((p: any) => ({
        ...p,
        datum: new Date(p.datum),
      })) as Arbeitsprotokoll[];
    },
  });
}

// Get protokolle by projekt
export function useProtokolleByProjekt(projektId: string | undefined) {
  return useQuery({
    queryKey: protokollKeys.byProjekt(projektId!),
    queryFn: async () => {
      if (!projektId) return [];
      const data = await protokollApi.getByProjekt(projektId);
      return data.map((p: any) => ({
        ...p,
        datum: new Date(p.datum),
      })) as Arbeitsprotokoll[];
    },
    enabled: !!projektId,
  });
}

// Get protokoll by ID
export function useProtokoll(id: string | undefined) {
  return useQuery({
    queryKey: protokollKeys.detail(id!),
    queryFn: async () => {
      if (!id) return null;
      const data = await protokollApi.getById(id);
      return {
        ...data,
        datum: new Date(data.datum),
      } as Arbeitsprotokoll;
    },
    enabled: !!id,
  });
}

// Create protokoll mutation
export function useCreateProtokoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => protokollApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: protokollKeys.lists() });
      if (variables.projektId) {
        queryClient.invalidateQueries({
          queryKey: protokollKeys.byProjekt(variables.projektId),
        });
      }
    },
  });
}

// Update protokoll mutation
export function useUpdateProtokoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      protokollApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: protokollKeys.lists() });
      queryClient.invalidateQueries({ queryKey: protokollKeys.detail(variables.id) });
      if (variables.data.projektId) {
        queryClient.invalidateQueries({
          queryKey: protokollKeys.byProjekt(variables.data.projektId),
        });
      }
    },
  });
}

// Delete protokoll mutation
export function useDeleteProtokoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => protokollApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: protokollKeys.lists() });
    },
  });
}

