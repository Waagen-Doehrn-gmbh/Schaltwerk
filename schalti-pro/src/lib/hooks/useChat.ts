import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/lib/api";
import type { ChatMessage } from "@/types";

// Query Keys
export const chatKeys = {
  all: ["chat"] as const,
  byProjekt: (projektId: string) => [...chatKeys.all, "projekt", projektId] as const,
};

// Get chat messages by projekt
export function useChatByProjekt(projektId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.byProjekt(projektId!),
    queryFn: async () => {
      if (!projektId) return [];
      const data = await chatApi.getByProjekt(projektId);
      return data.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp || msg.created_at),
      })) as ChatMessage[];
    },
    enabled: !!projektId,
    refetchInterval: 5000, // Polling alle 5 Sekunden für Real-time Updates
  });
}

// Create chat message mutation
export function useCreateChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { text: string; projektId: string; imageUrl?: string }) =>
      chatApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.byProjekt(variables.projektId),
      });
    },
  });
}

