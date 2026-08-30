import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessages } from "@/components/app/ChatMessages";
import { ChatInput, type ChatMode, type ChatInputHandle } from "@/components/app/ChatInput";
import { ChatPanelDropZone } from "@/components/app/ChatPanelDropZone";
import { BriefAnalysisLoading } from "@/components/app/BriefAnalysisLoading";
import { useQuery } from "@tanstack/react-query";
import { useChatMessages } from "@/hooks/useChats";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  getChat,
  deleteChatById,
  resolveStreamAssetHints,
} from "@/services/api";
import type { ChatMessage, ChatRenderableAsset, StreamAssetHint } from "@/types/api";
import { AssetsModal } from "@/components/app/AssetsModal";
import { AgentThinking } from "@/components/app/AgentThinking";
import { AgentSteps } from "@/components/app/AgentSteps";
import { CampaignModeOffer } from "@/components/app/CampaignModeOffer";
import {
  acceptCampaignMode,
  cancelRun,
  followRun,
  getRunStatus,
  runTurn,
  type ProgressStep,
} from "@/services/agentRun";

export default function ChatView() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const consumedPendingRef = useRef(false);
  const chatInputRef = useRef<ChatInputHandle>(null);

  const [mode, setMode] = useState<ChatMode>("brainstorm");
  const [streamingContent, setStreamingContent] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [thinkingText, setThinkingText] = useState("");
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [modeProposal, setModeProposal] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showCampaignLoading, setShowCampaignLoading] = useState(false);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [streamingAssets, setStreamingAssets] = useState<ChatRenderableAsset[]>([]);

  const { data: chatData } = useQuery({
    queryKey: ["chat", chatId, user?.email],
    queryFn: () => getChat(chatId!, user!.email!),
    enabled: !!chatId && !!user?.email,
    retry: false,
  });
  const { data: messagesData } = useChatMessages(chatId);
  const serverMessages: ChatMessage[] = messagesData?.messages ?? [];
  const messages = [...serverMessages, ...optimisticMessages];
  const chatTitle = chatData?.title ?? "Chat";

  useEffect(() => {
    if (chatData?.mode === "campaign" || chatData?.mode === "brainstorm") {
      setMode(chatData.mode);
    }
  }, [chatData?.mode]);

  // Stopping is the send button's other job while a run is going.
  const handleStop = useCallback(async () => {
    if (!user?.email || !chatId) return;
    await cancelRun(chatId, user.email);
    setIsStreaming(false);
    setSteps([]);
    setThinkingText("");
    setStreamingContent("");
    setUpdateMessage(null);
    await queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
  }, [user?.email, chatId, queryClient]);

  const mergeStreamAssets = useCallback(async (hints: StreamAssetHint[]) => {
    if (!user?.email || hints.length === 0) return;
    const resolved = await resolveStreamAssetHints(user.email, hints);
    setStreamingAssets((prev) => {
      const m = new Map(prev.map((a) => [a.id, a]));
      resolved.forEach((a) => m.set(a.id, a));
      return Array.from(m.values());
    });
  }, [user?.email]);

  const handleSendMessage = useCallback(
    async (message: string, files?: File[]) => {
      if (!user?.email || !chatId) {
        toast({
          title: "Authentication required",
          description: "Please sign in to send messages.",
          variant: "destructive",
        });
        return;
      }

      const optimisticMessage: ChatMessage = {
        message_id: `temp-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };
      setOptimisticMessages([optimisticMessage]);
      setStreamingContent("");
      setStreamingAssets([]);
      setUpdateMessage(null);
      setIsStreaming(true);

      const needsCampaignThisTurn = mode === "campaign" && !chatData?.campaign_id;
      let campaignCreationStarted = false;

      try {
        await runTurn(
          {
            userEmail: user.email,
            chatId,
            message,
            mode,
            files,
          },
          {
            onToken: (_delta, accumulated) => {
              setUpdateMessage(null);
              setStreamingContent(accumulated);
            },
            onThinking: (_delta, accumulated) => setThinkingText(accumulated),
            onProgress: (step) => {
              setSteps((current) => {
                const at = current.findIndex((s) => s.step_id === step.step_id);
                if (at === -1) return [...current, step];
                const next = [...current];
                next[at] = step;
                return next;
              });
            },
            onCampaign: (_id, state) => {
              // The campaign build has its own view; leave it up until the
              // campaign exists rather than guessing a percentage.
              if (state === "creating") {
                campaignCreationStarted = true;
                setShowCampaignLoading(true);
              }
              if (state === "created") setShowCampaignLoading(false);
            },
            onModeProposal: (rationale) => setModeProposal(rationale),
            onAssets: (assets) => {
              mergeStreamAssets(
                assets.map((a) => ({ id: a.id, mime_type: a.mime_type ?? "" }))
              ).catch(() => {});
            },
            onCancelled: () => {
              setIsStreaming(false);
              setStreamingContent("");
              setSteps([]);
              queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
            },
            onComplete: async () => {
              if (needsCampaignThisTurn && !campaignCreationStarted) {
                setShowCampaignLoading(false);
                setUpdateMessage(null);
                setStreamingContent("");
                setStreamingAssets([]);
                setThinkingText("");
                setSteps([]);
                setIsStreaming(false);
                setOptimisticMessages([]);
                toast({
                  title: "Campaign not created",
                  description: "Campaign creation failed. Please try again later.",
                  variant: "destructive",
                });
                await queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
                return;
              }
              setShowCampaignLoading(false);
              setUpdateMessage(null);
              await queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
              queryClient.invalidateQueries({ queryKey: ["chat", chatId, user?.email] });
              setStreamingContent("");
              setStreamingAssets([]);
              setThinkingText("");
              setSteps([]);
              setIsStreaming(false);
              setOptimisticMessages([]);
            },
            onError: (errorMsg: string) => {
              setShowCampaignLoading(false);
              setUpdateMessage(null);
              setStreamingContent("");
              setStreamingAssets([]);
              setThinkingText("");
              setSteps([]);
              setIsStreaming(false);
              setOptimisticMessages([]);
              toast({
                title: "Something went wrong",
                description: errorMsg,
                variant: "destructive",
              });
            },
          }
        );
      } catch (err) {
        setShowCampaignLoading(false);
        setUpdateMessage(null);
        setStreamingContent("");
        setStreamingAssets([]);
        setThinkingText("");
        setSteps([]);
        setIsStreaming(false);
        setOptimisticMessages([]);
        toast({
          title: "Could not send that message",
          description: err instanceof Error ? err.message : "Please try again",
          variant: "destructive",
        });
      }
    },
    [chatId, mode, user, queryClient, toast, mergeStreamAssets, chatData?.campaign_id]
  );

  useEffect(() => {
    setStreamingContent("");
    setStreamingAssets([]);
    setUpdateMessage(null);
    setOptimisticMessages([]);
    setShowCampaignLoading(false);
    consumedPendingRef.current = false;
  }, [chatId]);

  // Attach to a run already in progress.
  //
  // This covers both arriving from the landing page, where the first message
  // was started before navigating, and reloading the page mid-answer. The run
  // belongs to the server, so there is nothing to hand over — we just ask
  // where it got to and follow from there.
  useEffect(() => {
    if (!chatId || !user?.email || consumedPendingRef.current) return;
    const controller = new AbortController();
    const email = user.email;

    getRunStatus(chatId, email)
      .then((status) => {
        if (!status.active || controller.signal.aborted) return;
        consumedPendingRef.current = true;
        setIsStreaming(true);
        return followRun(
          chatId,
          email,
          {
            onToken: (_delta, accumulated) => {
              setUpdateMessage(null);
              setStreamingContent(accumulated);
            },
            onThinking: (_delta, accumulated) => setThinkingText(accumulated),
            onProgress: (step) =>
              setSteps((current) => {
                const at = current.findIndex((s) => s.step_id === step.step_id);
                if (at === -1) return [...current, step];
                const next = [...current];
                next[at] = step;
                return next;
              }),
            onModeProposal: (rationale) => setModeProposal(rationale),
            onAssets: (assets) => {
              mergeStreamAssets(
                assets.map((a) => ({ id: a.id, mime_type: a.mime_type ?? "" }))
              ).catch(() => {});
            },
            onComplete: async () => {
              setUpdateMessage(null);
              await queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
              queryClient.invalidateQueries({ queryKey: ["chats"] });
              queryClient.invalidateQueries({ queryKey: ["chat", chatId, email] });
              setStreamingContent("");
              setStreamingAssets([]);
              setThinkingText("");
              setSteps([]);
              setIsStreaming(false);
              setOptimisticMessages([]);
            },
            onCancelled: () => {
              setIsStreaming(false);
              setStreamingContent("");
              setSteps([]);
              setThinkingText("");
            },
            onError: (message) => {
              setStreamingContent("");
              setIsStreaming(false);
              setThinkingText("");
              setSteps([]);
              toast({
                title: "Something went wrong",
                description: message,
                variant: "destructive",
              });
            },
          },
          // Resume from where this client got to, rather than replaying the
          // whole run from the beginning.
          { signal: controller.signal, sinceEventId: status.last_event_id }
        );
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [chatId, user?.email, queryClient, toast, mergeStreamAssets]);

  if (!chatId) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-muted-foreground">No chat selected</p>
      </div>
    );
  }

  if (showCampaignLoading) {
    return <BriefAnalysisLoading steps={steps} />;
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header with Assets button */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-lg font-semibold truncate">{chatTitle}</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAssetsOpen(true)}
          className="gap-2"
        >
          <FolderOpen className="h-4 w-4" />
          View assets
        </Button>
      </div>

      {/* Messages + drag-and-drop attach */}
      <ChatPanelDropZone
        disabled={isStreaming}
        onFilesDropped={(files) => chatInputRef.current?.addFiles(files)}
      >
        <ChatMessages
          messages={messages}
          threadAssets={messagesData?.assets ?? []}
          streamingAssets={streamingAssets}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
          updateMessage={updateMessage}
        />

        {(thinkingText || steps.length > 0 || modeProposal) && (
          <div className="space-y-2 px-4 pb-2">
            <AgentThinking text={thinkingText} />
            <AgentSteps steps={steps} />
            {modeProposal && (
              <CampaignModeOffer
                rationale={modeProposal}
                onAccept={async () => {
                  if (!user?.email || !chatId) return;
                  try {
                    await acceptCampaignMode(chatId, user.email);
                  } catch {
                    // Without this the rejection was silent: the card stayed
                    // put, nothing switched, and the person had no idea the
                    // click had failed.
                    toast({
                      title: "Could not switch to campaign mode",
                      description: "Try again in a moment.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setModeProposal(null);
                  setMode("campaign");
                  queryClient.invalidateQueries({ queryKey: ["chat", chatId, user.email] });
                  // Nothing else to do here. The turn that made the offer is
                  // still running and waiting on this; it sees the change and
                  // carries on building the campaign in the same answer.
                }}
                onDecline={() => setModeProposal(null)}
              />
            )}
          </div>
        )}

        <ChatInput
          ref={chatInputRef}
          onSend={handleSendMessage}
          isStreaming={isStreaming}
          onStop={handleStop}
          disabled={showCampaignLoading}
          mode={mode}
          onModeToggle={() => setMode((m) => (m === "brainstorm" ? "campaign" : "brainstorm"))}
          textareaMaxHeight={200}
        />
      </ChatPanelDropZone>

      <AssetsModal
        chatId={chatId}
        open={assetsOpen}
        onOpenChange={setAssetsOpen}
      />
    </div>
  );
}
