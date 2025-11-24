import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { komponenteApi } from "@/lib/api";
import type { Komponente } from "@/types";

// Query Keys
export const komponenteKeys = {
  all: ["komponenten"] as const,
  lists: () => [...komponenteKeys.all, "list"] as const,
  list: (filters: string) => [...komponenteKeys.lists(), { filters }] as const,
  details: () => [...komponenteKeys.all, "detail"] as const,
  detail: (id: string) => [...komponenteKeys.details(), id] as const,
  byProjekt: (projektId: string) => [...komponenteKeys.all, "projekt", projektId] as const,
};

// Get all komponenten
export function useKomponenten() {
  return useQuery({
    queryKey: komponenteKeys.lists(),
    queryFn: async () => {
      const data = await komponenteApi.getAll();
      return data as Komponente[];
    },
  });
}

// Get komponenten by projekt
export function useKomponentenByProjekt(projektId: string | undefined) {
  return useQuery({
    queryKey: komponenteKeys.byProjekt(projektId!),
    queryFn: async () => {
      if (!projektId) return [];
      const data = await komponenteApi.getByProjekt(projektId);
      return data as Komponente[];
    },
    enabled: !!projektId,
  });
}

// Get komponente by ID
export function useKomponente(id: string | undefined) {
  return useQuery({
    queryKey: komponenteKeys.detail(id!),
    queryFn: async () => {
      if (!id) return null;
      return (await komponenteApi.getById(id)) as Komponente;
    },
    enabled: !!id,
  });
}

// Create komponente mutation
export function useCreateKomponente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => komponenteApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: komponenteKeys.lists() });
      if (variables.projektId) {
        queryClient.invalidateQueries({
          queryKey: komponenteKeys.byProjekt(variables.projektId),
        });
      }
    },
  });
}

// Update komponente mutation
export function useUpdateKomponente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      komponenteApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: komponenteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: komponenteKeys.detail(variables.id) });
      if (variables.data.projektId) {
        queryClient.invalidateQueries({
          queryKey: komponenteKeys.byProjekt(variables.data.projektId),
        });
      }
    },
  });
}

// Delete komponente mutation
export function useDeleteKomponente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => komponenteApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: komponenteKeys.lists() });
    },
  });
}

