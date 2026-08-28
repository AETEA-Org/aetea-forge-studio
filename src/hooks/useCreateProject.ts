import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { createCampaignViaChat, getChat } from "@/services/api";
import type { ProgressStep } from "@/services/agentRun";
import { useAuth } from "@/hooks/useAuth";

export function useCreateProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [steps, setSteps] = useState<ProgressStep[]>([]);
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
    setSteps([]);
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
        // onProgress - the steps the loading screen shows
        (step: ProgressStep) => {
          if (!loadingScreenActive) return;
          setSteps((current) => {
            const at = current.findIndex((s) => s.step_id === step.step_id);
            if (at === -1) return [...current, step];
            const next = [...current];
            next[at] = step;
            return next;
          });
        },
        // onStarted - the campaign build has actually begun
        () => {
          campaignCreationStarted = true;
          loadingScreenActive = true;
          setShowLoadingScreen(true);
          setIsSubmitting(false); // Button loading done, now full screen loading
        },
        // onComplete
        async () => {
          if (!campaignCreationStarted) {
            // The turn finished without a campaign being created. The
            // conversation is kept either way: the run happens in the
            // background, so a client-side failure says nothing about whether
            // work is still going on the server.
            setError(
              "That did not turn into a campaign. Open the conversation to see " +
              "what AETEA said, or try again with more detail."
            );
            setIsSubmitting(false);
            setShowLoadingScreen(false);
            queryClient.invalidateQueries({ queryKey: ['chats'] });
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
          // Losing the stream is not losing the work: the run continues on the
          // server, so the conversation stays and the user can reopen it.
          queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Campaign creation failed. Please try again later.";
      setError(message);
      setIsSubmitting(false);
      setShowLoadingScreen(false);
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    }
  }, [user?.email, navigate, queryClient]);

  const reset = useCallback(() => {
    setError(null);
    setSteps([]);
    setChatId(null);
  }, []);

  return {
    createProject,
    isSubmitting,
    showLoadingScreen,
    steps,
    error,
    reset,
  };
}
