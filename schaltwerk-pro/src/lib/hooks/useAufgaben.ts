import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aufgabeApi, type Aufgabe } from "@/lib/api";

// Query Keys
export const aufgabeKeys = {
  all: ["aufgaben"] as const,
  lists: () => [...aufgabeKeys.all, "list"] as const,
  details: () => [...aufgabeKeys.all, "detail"] as const,
  detail: (id: string) => [...aufgabeKeys.details(), id] as const,
};

// Get all aufgaben
export function useAufgaben() {
  return useQuery({
    queryKey: aufgabeKeys.lists(),
    queryFn: () => aufgabeApi.getAll(),
  });
}

// Get aufgabe by ID
export function useAufgabe(id: string | undefined) {
  return useQuery({
    queryKey: aufgabeKeys.detail(id!),
    queryFn: () => aufgabeApi.getById(id!),
    enabled: !!id,
  });
}

// Create aufgabe mutation
export function useCreateAufgabe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Aufgabe, "id">) => aufgabeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aufgabeKeys.lists() });
    },
  });
}

// Update aufgabe mutation
export function useUpdateAufgabe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Aufgabe> }) =>
      aufgabeApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: aufgabeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: aufgabeKeys.detail(variables.id) });
    },
  });
}

// Delete aufgabe mutation
export function useDeleteAufgabe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => aufgabeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aufgabeKeys.lists() });
    },
  });
}

