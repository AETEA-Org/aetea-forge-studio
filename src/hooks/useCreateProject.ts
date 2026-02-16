import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { analyzeBrief } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import type { SSEMessage } from "@/types/api";

export function useCreateProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const createProject = useCallback(async (briefText?: string, files?: File[]) => {
    if (!user?.email) {
      setError("You must be logged in to create a project");
      return;
    }

    if (!briefText?.trim() && (!files || files.length === 0)) {
      setError("Please provide a brief or upload files");
      return;
    }

    setIsSubmitting(true);
    setProgress("Starting brief analysis...");
    setError(null);

    try {
      await analyzeBrief(
        user.email,
        briefText,
        files,
        // onProgress
        (message) => {
          setProgress(message);
        },
        // onComplete
        (data) => {
          const { project_id, title } = data.data;
          
          // Invalidate chats query to refetch the list
          queryClient.invalidateQueries({ queryKey: ['chats'] });
          
          setProgress("");
          setIsSubmitting(false);
          
          // Navigate to the new project
          navigate(`/app/project/${project_id}`);
        },
        // onError
        (message) => {
          setError(message);
          setProgress("");
          setIsSubmitting(false);
        }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create project";
      setError(message);
      setProgress("");
      setIsSubmitting(false);
    }
  }, [user?.email, navigate, queryClient]);

  const reset = useCallback(() => {
    setError(null);
    setProgress("");
  }, []);

  return {
    createProject,
    isSubmitting,
    progress,
    error,
    reset,
  };
}
