import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listChats, getChatMessages, sendChatMessage, deleteChat } from "@/services/api";
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

export function useChatMessages(chatId: string | undefined) {
  const { user } = useAuth();
  const userEmail = user?.email;

  return useQuery({
    queryKey: ['chat-messages', chatId, userEmail],
    queryFn: () => getChatMessages(chatId!, userEmail!),
    enabled: !!chatId && !!userEmail,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSendChatMessage(
  projectId: string | undefined,
  chatId: string | undefined,
  context: string,
  callbacks?: UseSendChatMessageOptions
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [willModify, setWillModify] = useState(false);

  const mutation = useMutation({
    mutationFn: async (message: string) => {
      if (!user?.email || !projectId || !chatId) {
        throw new Error('Missing required parameters');
      }

      setIsStreaming(true);
      setWillModify(false);

      await sendChatMessage(
        user.email,
        projectId,
        chatId,
        context,
        message,
        // onUpdate
        (content, willModifyFlag) => {
          if (willModifyFlag) setWillModify(true);
          callbacks?.onUpdate?.(content, willModifyFlag);
        },
        // onContent
        (content, willModifyFlag) => {
          if (willModifyFlag) setWillModify(true);
          callbacks?.onContent?.(content, willModifyFlag);
        },
        // onComplete
        async (content, willModifyFlag) => {
          if (willModifyFlag) {
            setWillModify(true);
            // Invalidate relevant queries based on context
            if (['tab:brief', 'tab:research', 'tab:strategy'].includes(context)) {
              const tab = context.replace('tab:', '');
              await queryClient.invalidateQueries({
                queryKey: ['campaign', projectId, tab],
              });
            }
          }
          setIsStreaming(false);
          setWillModify(false);
          // Invalidate messages to refetch
          await queryClient.invalidateQueries({
            queryKey: ['chat-messages', chatId],
          });
          callbacks?.onComplete?.(content, willModifyFlag);
        },
        // onError
        (error) => {
          setIsStreaming(false);
          setWillModify(false);
          callbacks?.onError?.(error);
        }
      );
    },
  });

  return {
    ...mutation,
    isStreaming,
    willModify,
  };
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
