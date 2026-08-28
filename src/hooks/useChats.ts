import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listChats, getChatMessages, deleteChat } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessage } from "@/types/api";

interface UseSendChatMessageOptions {
  onUpdate?: (content: string, willModify: boolean) => void;
  onContent?: (content: string, willModify: boolean) => void;
  onComplete?: (content: string, willModify: boolean) => void;
  onError?: (message: string) => void;
}

export function useChats(projectId: string | undefined) {
  const { user } = useAuth();
  const userEmail = user?.email;

  return useQuery({
    queryKey: ['chats', projectId, userEmail],
    queryFn: () => listChats(userEmail!, projectId!),
    enabled: !!projectId && !!userEmail,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useChatMessages(chatId: string | undefined, branchId: string = 'main') {
  const { user } = useAuth();
  const userEmail = user?.email;

  return useQuery({
    queryKey: ['chat-messages', chatId, branchId, userEmail],
    queryFn: () => getChatMessages(chatId!, userEmail!, branchId),
    enabled: !!chatId && !!userEmail,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDeleteChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chatId,
      projectId,
    }: {
      chatId: string;
      projectId: string;
    }) => {
      if (!user?.email) {
        throw new Error('User not authenticated');
      }
      return deleteChat(chatId, user.email, projectId);
    },
    onSuccess: (_, variables) => {
      // Invalidate chats list
      queryClient.invalidateQueries({
        queryKey: ['chats', variables.projectId],
      });
    },
  });
}
