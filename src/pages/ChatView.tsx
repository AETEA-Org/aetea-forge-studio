import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessages } from "@/components/app/ChatMessages";
import {
  ChatInput,
  type ChatMode,
  type ChatInputHandle,
  type ChatSendMeta,
} from "@/components/app/ChatInput";
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
import { CampaignChangeProposal } from "@/components/app/CampaignChangeProposal";
import { invalidateForDataChange } from "@/services/dataChanged";
import { reportSendFailure } from "@/services/sendFailure";
import { OutOfCredits } from "@/components/app/billing/OutOfCredits";
import {
  acceptCampaignMode,
  cancelRun,
  decideProposal,
  editTurn,
  followRun,
  getRunStatus,
  listProposals,
  runTurn,
  type AgentTurnHandlers,
  type CampaignProposal,
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
  // How much intelligence to apply. "auto" lets AETEA choose per message, which
  // is where a new chat starts; the backend remembers whatever was last used.
  const [tier, setTier] = useState<string>("auto");
  const [streamingContent, setStreamingContent] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [thinkingText, setThinkingText] = useState("");
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [modeProposal, setModeProposal] = useState<string | null>(null);
  // A campaign change waiting on the user. Unlike the mode offer this has an
  // id on the server, so it survives the run that raised it and comes back on
  // a reload — see the fetch below.
  const [changeProposal, setChangeProposal] = useState<CampaignProposal | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  // Shown where the answer would have been, and cleared as soon as they try
  // again — a stale "out of credits" card after a successful top-up would be
  // worse than not showing one at all.
  const [outOfCredits, setOutOfCredits] = useState(false);
  const [showCampaignLoading, setShowCampaignLoading] = useState(false);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [streamingAssets, setStreamingAssets] = useState<ChatRenderableAsset[]>([]);

  const { data: chatData } = useQuery({
    queryKey: ["chat", chatId, user?.email],
    queryFn: () => getChat(chatId!),
    enabled: !!chatId && !!user?.email,
    retry: false,
  });
  const { data: messagesData } = useChatMessages(chatId);
  const serverMessages: ChatMessage[] = messagesData?.messages ?? [];

  const mergeStreamAssets = useCallback(async (hints: StreamAssetHint[]) => {
    if (!user?.email || hints.length === 0) return;
    const resolved = await resolveStreamAssetHints(hints);
    setStreamingAssets((prev) => {
      const m = new Map(prev.map((a) => [a.id, a]));
      resolved.forEach((a) => m.set(a.id, a));
      return Array.from(m.values());
    });
  }, [user?.email]);

  /** What to do with a stream this view is following. Shared by the edit
   *  path and the re-attach path, which want identical behaviour. */
  const streamHandlers = useCallback(
    (): AgentTurnHandlers => ({
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
      onCampaignProposal: (proposal) => setChangeProposal(proposal),
      onAssets: (assets) => {
        mergeStreamAssets(
          assets.map((a) => ({ id: a.id, mime_type: a.mime_type ?? "" }))
        ).catch(() => {});
      },
      onDataChanged: (entity) => {
        invalidateForDataChange(queryClient, entity, { chatId, userEmail: user?.email });
      },
      onComplete: async () => {
        setUpdateMessage(null);
        await queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
        queryClient.invalidateQueries({ queryKey: ["chats"] });
        setStreamingContent("");
        setThinkingText("");
        setSteps([]);
        setIsStreaming(false);
      },
      onCancelled: () => {
        setStreamingContent("");
        setThinkingText("");
        setSteps([]);
        setIsStreaming(false);
      },
      onError: (msg) => {
        setStreamingContent("");
        setThinkingText("");
        setSteps([]);
        setIsStreaming(false);
        toast({ title: "Something went wrong", description: msg, variant: "destructive" });
      },
    }),
    [chatId, queryClient, toast, mergeStreamAssets, user?.email]
  );

  const messages = [...serverMessages, ...optimisticMessages];
  const chatTitle = chatData?.title ?? "Chat";

  // A change the agent proposed and nobody answered. The card is raised as a
  // run event, which only the client that was watching ever saw — so a person
  // who closed the tab would come back to a campaign quietly waiting on a
  // decision they were never shown. Asked for on open, and again whenever a
  // run ends, so the card outlives the turn that raised it.
  useEffect(() => {
    if (!chatId || !user?.email || isStreaming) return;
    let cancelled = false;
    listProposals(chatId)
      .then((open) => {
        if (!cancelled) setChangeProposal(open[0] ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [chatId, user?.email, isStreaming]);

  // Answering the card. The decision is recorded and applied on the server:
  // approving applies the payload stored when the card was raised, never
  // anything sent from here.
  const decideChange = useCallback(
    async (decision: "approve" | "decline") => {
      if (!chatId || !changeProposal) return;
      let outcome: { status: string };
      try {
        outcome = await decideProposal(
          chatId,
          changeProposal.proposal_id,
          decision,
          changeProposal.content_hash
        );
      } catch (err) {
        // Without this the rejection was silent: the card stayed put, nothing
        // happened, and the person had no idea the click had failed.
        toast({
          title: "Could not record that",
          description: err instanceof Error ? err.message : "Try again in a moment.",
          variant: "destructive",
        });
        return;
      }
      setChangeProposal(null);

      // Approving does not always apply. The campaign can move while the card
      // is open, or the card can go stale, and the server answers 200 with a
      // status saying so — which the catch above never sees. Clearing the card
      // and saying nothing would mean they pressed Apply, watched it vanish,
      // and got no change and no reason: the same silent failure the catch
      // exists to prevent, one layer down.
      const stalled: Record<string, string> = {
        conflict:
          "The campaign changed while this was waiting, so nothing was applied. " +
          "Ask AETEA to propose it again.",
        expired:
          "That suggestion sat too long to apply. Nothing changed — ask AETEA to propose it again.",
        superseded: "A newer suggestion replaced that one, so nothing was applied.",
      };
      if (stalled[outcome.status]) {
        toast({ title: "Nothing was changed", description: stalled[outcome.status] });
        return;
      }

      if (outcome.status === "applied") {
        // The campaign tabs are now showing the old version of whatever moved.
        ["section", "creative_state", "task"].forEach((entity) =>
          invalidateForDataChange(queryClient, entity, { chatId, userEmail: user?.email })
        );
      }
      // Nothing else to do. If the turn that raised this is still running it is
      // watching the same row and carries on by itself.
    },
    [chatId, changeProposal, queryClient, toast, user?.email]
  );

  // Open the composer where the chat was left: the mode it was in, and the
  // tier it was last sent on.
  useEffect(() => {
    if (chatData?.tier) setTier(chatData.tier);
    if (chatData?.mode === "campaign" || chatData?.mode === "brainstorm") {
      setMode(chatData.mode);
    }
  }, [chatData?.mode, chatData?.tier]);

  // Rewriting a message replaces everything after it, then re-answers.
  const handleEditMessage = useCallback(
    async (messageId: string, text: string) => {
      if (!user?.email || !chatId) return;
      setStreamingContent("");
      setThinkingText("");
      setSteps([]);
      setIsStreaming(true);
      try {
        await editTurn(chatId, messageId, {
          message: text,
          mode,
        });
      } catch (err) {
        setIsStreaming(false);
        toast({
          title: "Could not edit that message",
          description: err instanceof Error ? err.message : "Try again in a moment.",
          variant: "destructive",
        });
        return;
      }
      await queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
      await followRun(chatId, streamHandlers());
    },
    [user?.email, chatId, mode, queryClient, toast, streamHandlers]
  );

  // Stopping is the send button's other job while a run is going.
  const handleStop = useCallback(async () => {
    if (!user?.email || !chatId) return;
    await cancelRun(chatId);
    setIsStreaming(false);
    setSteps([]);
    setThinkingText("");
    setStreamingContent("");
    setUpdateMessage(null);
    await queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
  }, [user?.email, chatId, queryClient]);


  const handleSendMessage = useCallback(
    async (message: string, files?: File[], meta?: ChatSendMeta) => {
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
            chatId,
            message,
            mode,
            files,
            tier: meta?.tier ?? tier,
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
            onCampaignProposal: (proposal) => setChangeProposal(proposal),
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
        reportSendFailure(err, {
          toast,
          chatId,
          userEmail: user?.email,
          onStopped: () => setIsStreaming(false),
          onOutOfCredits: () => setOutOfCredits(true),
        });
      }
    },
    [chatId, mode, tier, user, queryClient, toast, mergeStreamAssets, chatData?.campaign_id]
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

    getRunStatus(chatId)
      .then((status) => {
        if (!status.active || controller.signal.aborted) return;
        consumedPendingRef.current = true;
        setIsStreaming(true);
        return followRun(
          chatId,
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
            onCampaignProposal: (proposal) => setChangeProposal(proposal),
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
          onEditMessage={handleEditMessage}
          messages={messages}
          threadAssets={messagesData?.assets ?? []}
          streamingAssets={streamingAssets}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
          updateMessage={updateMessage}
        />

        {(thinkingText || steps.length > 0 || modeProposal || changeProposal) && (
          <div className="space-y-2 px-4 pb-2">
            <AgentThinking text={thinkingText} />
            <AgentSteps steps={steps} />
            {modeProposal && (
              <CampaignModeOffer
                rationale={modeProposal}
                onAccept={async () => {
                  if (!user?.email || !chatId) return;
                  try {
                    await acceptCampaignMode(chatId);
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
            {changeProposal && (
              <CampaignChangeProposal
                proposal={changeProposal}
                onApprove={() => decideChange("approve")}
                onDecline={() => decideChange("decline")}
              />
            )}
          </div>
        )}

        {outOfCredits && (
          <OutOfCredits
            compact
            className="mb-3"
            onTopUp={() => navigate("/app/settings?tab=billing")}
          />
        )}

        <ChatInput
          ref={chatInputRef}
          onSend={(message, files, meta) => {
            // Trying again is the signal they have dealt with it.
            setOutOfCredits(false);
            void handleSendMessage(message, files, meta);
          }}
          isStreaming={isStreaming}
          onStop={handleStop}
          disabled={showCampaignLoading}
          mode={mode}
          onModeToggle={() => setMode((m) => (m === "brainstorm" ? "campaign" : "brainstorm"))}
          tier={tier}
          onTierChange={setTier}
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
