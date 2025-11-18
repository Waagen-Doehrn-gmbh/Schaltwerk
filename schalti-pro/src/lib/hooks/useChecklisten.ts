import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { checklisteApi, type Checkliste } from "@/lib/api";

// Query Keys
export const checklisteKeys = {
  all: ["checklisten"] as const,
  lists: () => [...checklisteKeys.all, "list"] as const,
  list: (typ?: string) => [...checklisteKeys.lists(), { typ }] as const,
  details: () => [...checklisteKeys.all, "detail"] as const,
  detail: (id: string) => [...checklisteKeys.details(), id] as const,
};

// Get all checklisten
export function useChecklisten(typ?: "technisch" | "endabnahme" | "allgemein") {
  return useQuery({
    queryKey: checklisteKeys.list(typ),
    queryFn: () => checklisteApi.getAll(typ),
  });
}

// Get checkliste by ID
export function useCheckliste(id: string | undefined) {
  return useQuery({
    queryKey: checklisteKeys.detail(id!),
    queryFn: () => checklisteApi.getById(id!),
    enabled: !!id,
  });
}

// Create checkliste mutation
export function useCreateCheckliste() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Checkliste, "id">) => checklisteApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklisteKeys.lists() });
    },
  });
}

// Update checkliste mutation
export function useUpdateCheckliste() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Checkliste> }) =>
      checklisteApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: checklisteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: checklisteKeys.detail(variables.id) });
    },
  });
}

// Delete checkliste mutation
export function useDeleteCheckliste() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checklisteApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklisteKeys.lists() });
    },
  });
}

