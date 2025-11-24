import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projektApi } from "@/lib/api";
import type { Projekt } from "@/types";

// Query Keys
export const projektKeys = {
  all: ["projekte"] as const,
  lists: () => [...projektKeys.all, "list"] as const,
  list: (filters: string) => [...projektKeys.lists(), { filters }] as const,
  details: () => [...projektKeys.all, "detail"] as const,
  detail: (id: string) => [...projektKeys.details(), id] as const,
};

// Get all projects
export function useProjekte() {
  return useQuery({
    queryKey: projektKeys.lists(),
    queryFn: async () => {
      const data = await projektApi.getAll();
      // Transform backend data to frontend format
      return data.map((p: any) => ({
        ...p,
        createdAt: new Date(p.created_at || p.createdAt),
        stats: p.stats || {
          stunden: 0,
          eintraege: 0,
          komponenten: 0,
          gesamtKomponenten: 0,
        },
        schaltschrankNummer: p.schaltschrank_nummer || p.schaltschrankNummer,
        komponentenIds: p.komponenten_ids || p.komponentenIds || [],
      })) as Projekt[];
    },
  });
}

// Get project by ID
export function useProjekt(id: string | undefined) {
  return useQuery({
    queryKey: projektKeys.detail(id!),
    queryFn: async () => {
      if (!id) return null;
      const data = await projektApi.getById(id);
      return {
        ...data,
        createdAt: new Date(data.created_at || data.createdAt),
        stats: data.stats || {
          stunden: 0,
          eintraege: 0,
          komponenten: 0,
          gesamtKomponenten: 0,
        },
        schaltschrankNummer: data.schaltschrank_nummer || data.schaltschrankNummer,
        komponentenIds: data.komponenten_ids || data.komponentenIds || [],
      } as Projekt;
    },
    enabled: !!id,
  });
}

// Create project mutation
export function useCreateProjekt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => projektApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projektKeys.lists() });
    },
  });
}

// Update project mutation
export function useUpdateProjekt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      projektApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projektKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projektKeys.detail(variables.id) });
    },
  });
}

// Delete project mutation
export function useDeleteProjekt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projektApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projektKeys.lists() });
    },
  });
}

