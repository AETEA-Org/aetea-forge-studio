import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { createCampaignViaChat, deleteChatById, getChat } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

export function useCreateProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);

  const createProject = useCallback(async (briefText?: string, files?: File[]) => {
    if (!user?.email) {
      setError("You must be logged in to create a campaign");
      return;
    }

    if (!briefText?.trim() && (!files || files.length === 0)) {
      setError("Please provide a brief or upload files");
      return;
    }

    // Generate fresh UUID for chat
    const newChatId = crypto.randomUUID();
    setChatId(newChatId);
    setIsSubmitting(true);
    setShowLoadingScreen(false);
    setProgress("");
    setError(null);

    // Always prepend the message, even if briefText is empty
    const message = `Create a campaign for me using the following details: ${briefText || ''}`.trim();

    try {
      let campaignCreationStarted = false;
      let loadingScreenActive = false;

      await createCampaignViaChat(
        user.email,
        newChatId,
        message,
        files,
        // onUpdate - only show if we're in loading screen
        (content: string) => {
          if (loadingScreenActive) {
            setProgress(content);
          }
        },
        // onEvent
        (eventName: string) => {
          if (eventName === 'campaign_creation_started') {
            campaignCreationStarted = true;
            loadingScreenActive = true;
            setShowLoadingScreen(true);
            setIsSubmitting(false); // Button loading done, now full screen loading
          }
        },
        // onComplete
        async () => {
          if (!campaignCreationStarted) {
            // Error case: complete without campaign_creation_started
            setError("Campaign creation failed. Please try again later.");
            setIsSubmitting(false);
            setShowLoadingScreen(false);
            
            // Silently delete the chat that was created
            try {
              await deleteChatById(newChatId, user.email);
            } catch (deleteError) {
              console.error('Failed to delete chat after error:', deleteError);
            }
            return;
          }

          // Success case
          setShowLoadingScreen(false);
          
          // Invalidate chats query to refetch the list
          queryClient.invalidateQueries({ queryKey: ['chats'] });
          
          // Navigate to chat view
          navigate(`/app/chat/${newChatId}`);
        },
        // onError
        (message: string) => {
          setError(message);
          setIsSubmitting(false);
          setShowLoadingScreen(false);
          
          // Silently delete the chat if it was created
          if (newChatId) {
            deleteChatById(newChatId, user.email).catch((deleteError) => {
              console.error('Failed to delete chat after error:', deleteError);
            });
          }
        }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Campaign creation failed. Please try again later.";
      setError(message);
      setIsSubmitting(false);
      setShowLoadingScreen(false);
      
      // Silently delete the chat if it was created
      if (newChatId) {
        deleteChatById(newChatId, user.email).catch((deleteError) => {
          console.error('Failed to delete chat after error:', deleteError);
        });
      }
    }
  }, [user?.email, navigate, queryClient]);

  const reset = useCallback(() => {
    setError(null);
    setProgress("");
    setChatId(null);
  }, []);

  return {
    createProject,
    isSubmitting,
    showLoadingScreen,
    progress,
    error,
    reset,
  };
}
