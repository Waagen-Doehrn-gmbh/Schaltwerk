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
      if (!projektId) return { messages: [], lastReadAt: null };
      const data = await chatApi.getByProjekt(projektId);
      
      // Handle both old format (array) and new format (object with messages and lastReadAt)
      let messages: any[] = [];
      let lastReadAt: Date | null = null;
      
      if (Array.isArray(data)) {
        // Old format: just an array of messages
        messages = data;
      } else if (data && typeof data === 'object') {
        // New format: object with messages and lastReadAt
        messages = data.messages || [];
        lastReadAt = data.lastReadAt ? new Date(data.lastReadAt) : null;
      }
      
      return {
        messages: messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp || msg.created_at),
        })) as ChatMessage[],
        lastReadAt,
      };
    },
    enabled: !!projektId,
    refetchInterval: 10000, // Polling alle 10 Sekunden für Real-time Updates (reduziert, um weniger Konflikte zu haben)
    staleTime: 5000, // Daten sind 5 Sekunden "fresh", um unnötige Refetches zu vermeiden
    refetchOnWindowFocus: false, // Verhindere Refetch beim Fokus-Wechsel
  });
}

// Mark messages as read mutation
export function useMarkChatAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projektId: string) => chatApi.markAsRead(projektId),
    onSuccess: (_, projektId) => {
      // Aktualisiere nur lastReadAt, ohne die Nachrichten zu berühren
      queryClient.setQueryData(chatKeys.byProjekt(projektId), (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          lastReadAt: new Date(),
        };
      });
      // KEIN Refetch - das würde die Nachrichten überschreiben
    },
  });
}

// Create chat message mutation
export function useCreateChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { text: string; projektId: string; imageUrl?: string }) =>
      chatApi.create(data),
    onSuccess: (newMessage: any, variables) => {
      // Aktualisiere den Query, indem wir die neue Nachricht hinzufügen
      queryClient.setQueryData(chatKeys.byProjekt(variables.projektId), (oldData: any) => {
        if (!oldData) {
          return { 
            messages: [{
              ...newMessage,
              timestamp: new Date(newMessage.timestamp || newMessage.created_at),
            }], 
            lastReadAt: null 
          };
        }
        
        // Prüfe ob Nachricht bereits existiert
        const exists = oldData.messages?.some((msg: any) => msg.id === newMessage.id);
        if (exists) return oldData;
        
        return {
          ...oldData,
          messages: [...(oldData.messages || []), {
            ...newMessage,
            timestamp: new Date(newMessage.timestamp || newMessage.created_at),
          }],
        };
      });
      
      // KEIN Refetch - das würde die Nachrichten überschreiben
      // Die Nachricht ist bereits im Query-Cache
    },
  });
}

// Clear all chat messages mutation (Admin only)
export function useClearChatMessages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projektId: string) => chatApi.clearAll(projektId),
    onSuccess: (_, projektId) => {
      // Leere den Query-Cache für dieses Projekt
      queryClient.setQueryData(chatKeys.byProjekt(projektId), {
        messages: [],
        lastReadAt: null,
      });
      // Invalidiere den Query, um sicherzustellen, dass die UI aktualisiert wird
      queryClient.invalidateQueries({ queryKey: chatKeys.byProjekt(projektId) });
    },
  });
}

