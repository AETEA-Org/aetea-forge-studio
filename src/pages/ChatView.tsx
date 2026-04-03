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
  sendChatMessage,
  getChat,
  getAndClearPendingBrainstormStream,
  consumeAgentStream,
  deleteChatById,
  resolveStreamAssetHints,
} from "@/services/api";
import type { ChatMessage, ChatRenderableAsset, StreamAssetHint } from "@/types/api";
import { AssetsModal } from "@/components/app/AssetsModal";

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
  const [isStreaming, setIsStreaming] = useState(false);
  const [showCampaignLoading, setShowCampaignLoading] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState("");
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

      try {
        await sendChatMessage(
          user.email,
          chatId,
          message,
          mode,
          undefined,
          files,
          (content: string) => {
            if (mode === "campaign") setCampaignProgress(content);
            setUpdateMessage(content);
          },
          (content: string) => {
            setUpdateMessage(null);
            setStreamingContent(content);
          },
          (eventName: string) => {
            if (eventName === "campaign_creation_started") {
              setShowCampaignLoading(true);
              setIsStreaming(false);
            }
          },
          (hints: StreamAssetHint[]) => {
            mergeStreamAssets(hints).catch(() => {});
          },
          async () => {
            setShowCampaignLoading(false);
            setUpdateMessage(null);
            await queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
            queryClient.invalidateQueries({ queryKey: ["chat", chatId, user?.email] });
            setStreamingContent("");
            setStreamingAssets([]);
            setIsStreaming(false);
            setOptimisticMessages([]);

            if (mode === "campaign") {
              const chat = await getChat(chatId, user.email);
              queryClient.setQueryData(["chat", chatId, user.email], chat);
              if (!chat.campaign_id) {
                toast({
                  title: "Campaign could not be created",
                  description: "Please try again or add more details.",
                  variant: "destructive",
                });
              }
            }
          },
          (errorMsg: string) => {
            setShowCampaignLoading(false);
            setUpdateMessage(null);
            setStreamingContent("");
            setStreamingAssets([]);
            setIsStreaming(false);
            setOptimisticMessages([]);
            toast({
              title: "Error",
              description: errorMsg,
              variant: "destructive",
            });
          }
        );
      } catch (err) {
        setShowCampaignLoading(false);
        setUpdateMessage(null);
        setStreamingContent("");
        setStreamingAssets([]);
        setIsStreaming(false);
        setOptimisticMessages([]);
        toast({
          title: "Failed to send message",
          description: err instanceof Error ? err.message : "Something went wrong",
          variant: "destructive",
        });
      }
    },
    [chatId, mode, user, queryClient, toast, showCampaignLoading, mergeStreamAssets]
  );

  useEffect(() => {
    setStreamingContent("");
    setStreamingAssets([]);
    setUpdateMessage(null);
    setOptimisticMessages([]);
    setShowCampaignLoading(false);
    consumedPendingRef.current = false;
  }, [chatId]);

  // Consume pending brainstorm stream from Start Brainstorming (landing): show user message + streaming AI reply; on error delete chat and redirect
  useEffect(() => {
    if (!chatId || !user?.email) return;
    const pending = getAndClearPendingBrainstormStream(chatId);
    if (!pending || consumedPendingRef.current) return;
    consumedPendingRef.current = true;
    const { userMessage, reader } = pending;
    const optimisticMessage: ChatMessage = {
      message_id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setOptimisticMessages([optimisticMessage]);
    setStreamingContent("");
    setStreamingAssets([]);
    setUpdateMessage(null);
    setIsStreaming(true);
    consumeAgentStream(reader, {
      onUpdate: (content) => setUpdateMessage(content),
      onContent: (content) => {
        setUpdateMessage(null);
        setStreamingContent(content);
      },
      onAssets: (hints) => {
        mergeStreamAssets(hints).catch(() => {});
      },
      onComplete: async () => {
        setUpdateMessage(null);
        await queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
        queryClient.invalidateQueries({ queryKey: ["chats"] });
        queryClient.invalidateQueries({ queryKey: ["chat", chatId, user?.email] });
        setStreamingContent("");
        setStreamingAssets([]);
        setIsStreaming(false);
        setOptimisticMessages([]);
      },
      onError: () => {
        setStreamingContent("");
        setStreamingAssets([]);
        setIsStreaming(false);
        setOptimisticMessages([]);
        deleteChatById(chatId, user.email).catch(() => {});
        navigate("/app");
        toast({
          title: "Brainstorming failed",
          description: "Please try again later.",
          variant: "destructive",
        });
      },
    }).catch(() => {
      setStreamingContent("");
      setIsStreaming(false);
      setOptimisticMessages([]);
      deleteChatById(chatId, user.email).catch(() => {});
      navigate("/app");
      toast({
        title: "Brainstorming failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    });
  }, [chatId, user?.email, queryClient, navigate, toast, mergeStreamAssets]);

  if (!chatId) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-muted-foreground">No chat selected</p>
      </div>
    );
  }

  if (showCampaignLoading) {
    return <BriefAnalysisLoading progress={campaignProgress} />;
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
        <ChatInput
          ref={chatInputRef}
          onSend={handleSendMessage}
          isStreaming={isStreaming}
          contextLabel={mode === "brainstorm" ? "Brainstorm" : "Campaign"}
          showContextIndicator={false}
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
