import type { RunConnectionState } from "@/services/agentRun";
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
import { useQuery } from "@tanstack/react-query";
import { useChatMessages } from "@/hooks/useChats";
import { useRewind } from "@/hooks/useRewind";
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
import { AgentProgress } from "@/components/app/AgentProgress";
import { CampaignModeOffer } from "@/components/app/CampaignModeOffer";
import { CampaignChangeProposal } from "@/components/app/CampaignChangeProposal";
import { invalidateForDataChange } from "@/services/dataChanged";
import { reportSendFailure } from "@/services/sendFailure";
import { OutOfCredits } from "@/components/app/billing/OutOfCredits";
import {
  acceptCampaignMode,
  cancelRun,
  decideProposal,
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
  const chatInputRef = useRef<ChatInputHandle>(null);
  const subscriptionRef = useRef<AbortController | null>(null);

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
  const [connection, setConnection] = useState<RunConnectionState>("idle");
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
    const signal = subscriptionRef.current?.signal;
    const resolved = await resolveStreamAssetHints(hints);
    if (signal?.aborted) return;
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
      onConnectionState: setConnection,
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
  const {
    arm: armRewind,
    cancel: cancelRewind,
    target: rewindTarget,
    targetId: rewindTargetId,
    replacingCount: rewindReplacingCount,
  } = useRewind(messages);
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

  // Stopping is the send button's other job while a run is going.
  const handleStop = useCallback(async () => {
    if (!user?.email || !chatId) return;
    if (connection === "stopping") return;
    const controller = subscriptionRef.current;
    setConnection("stopping");
    try {
      await cancelRun(chatId);
      if (controller?.signal.aborted) return;
    } catch (error) {
      if (controller?.signal.aborted) return;
      setConnection("interrupted");
      toast({ title: "Could not stop the run", description: error instanceof Error ? error.message : "Try again.", variant: "destructive" });
      return;
    }
    controller?.abort();
    setConnection("idle");
    setShowCampaignLoading(false);
    setIsStreaming(false);
    setOptimisticMessages([]);
    setStreamingAssets([]);
    setSteps([]);
    setThinkingText("");
    setStreamingContent("");
    setUpdateMessage(null);
    await queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
  }, [user?.email, chatId, queryClient, connection, toast]);


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

      subscriptionRef.current?.abort();
      const controller = new AbortController();
      subscriptionRef.current = controller;

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
      setThinkingText("");
      setSteps([]);
      setConnection("idle");
      setIsStreaming(true);

      const needsCampaignThisTurn = mode === "campaign" && !chatData?.campaign_id;
      let campaignCreationStarted = false;

      // Read before clearing: the turn has to carry it, and the thread should
      // stop looking rewound the moment it is on its way.
      const rewindToMessageId = rewindTargetId ?? undefined;
      cancelRewind();

      try {
        await runTurn(
          {
            chatId,
            message,
            mode,
            files,
            tier: meta?.tier ?? tier,
            rewindToMessageId,
          },
          {
            onConnectionState: setConnection,
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
              setShowCampaignLoading(false);
              setIsStreaming(false);
              setStreamingContent("");
              setStreamingAssets([]);
              setThinkingText("");
              setUpdateMessage(null);
              setOptimisticMessages([]);
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
                if (controller.signal.aborted) return;
                return;
              }
              setShowCampaignLoading(false);
              setUpdateMessage(null);
              await queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
              if (controller.signal.aborted) return;
              queryClient.invalidateQueries({ queryKey: ["chat", chatId, user?.email] });
              setStreamingContent("");
              setStreamingAssets([]);
              setThinkingText("");
              setSteps([]);
              setIsStreaming(false);
              setOptimisticMessages([]);
            },
            onError: async (errorMsg: string) => {
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
              // A failed turn still leaves behind whatever it finished. One
              // campaign build wrote its sections, its creative direction and
              // six tasks, then died on the last model call — and because this
              // branch cleared the screen without re-reading anything, the
              // client never learned the campaign existed. It showed an error
              // over an empty chat while the finished campaign sat in the
              // sidebar, reachable only by clicking it.
              await queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
              if (controller.signal.aborted) return;
              queryClient.invalidateQueries({ queryKey: ["chat", chatId, user?.email] });
            },
          },
          controller.signal
        );
      } catch (err) {
        if (controller.signal.aborted) return;
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
        // Same reasoning as `onError`: a turn that died on the way out may
        // still have committed work server-side, and only a re-read finds it.
        queryClient.refetchQueries({ queryKey: ["chat-messages", chatId] });
        queryClient.invalidateQueries({ queryKey: ["chat", chatId, user?.email] });
      }
    },
    [chatId, mode, tier, user, queryClient, toast, mergeStreamAssets, chatData?.campaign_id,
     cancelRewind, rewindTargetId]
  );

  useEffect(() => {
    setStreamingContent("");
    setStreamingAssets([]);
    setUpdateMessage(null);
    setOptimisticMessages([]);
    setShowCampaignLoading(false);
    setThinkingText("");
    setSteps([]);
    setIsStreaming(false);
    setConnection("idle");
  }, [chatId]);

  // Attach to a run already in progress.
  //
  // This covers both arriving from the landing page, where the first message
  // was started before navigating, and reloading the page mid-answer. The run
  // belongs to the server, so there is nothing to hand over — we just ask
  // where it got to and follow from there.
  useEffect(() => {
    if (!chatId || !user?.email) return;
    subscriptionRef.current?.abort();
    const controller = new AbortController();
    subscriptionRef.current = controller;

    getRunStatus(chatId)
      .then((status) => {
        if (!status.active || controller.signal.aborted) return;
        setIsStreaming(true);
        return followRun(
          chatId,
          {
            onConnectionState: setConnection,
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
              if (controller.signal.aborted) return;
              queryClient.invalidateQueries({ queryKey: ["chats"] });
              queryClient.invalidateQueries({ queryKey: ["chat", chatId, user?.email] });
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
              setStreamingAssets([]);
              setThinkingText("");
              setUpdateMessage(null);
              setOptimisticMessages([]);
              setSteps([]);
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
          // Rebuild partial text and progress from retained run events.
          { signal: controller.signal, sinceEventId: 0 }
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) { setIsStreaming(true); setConnection("interrupted"); }
      });

    return () => { controller.abort(); subscriptionRef.current?.abort(); };
  }, [chatId, user?.email, queryClient, toast, mergeStreamAssets]);

  if (!chatId) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-muted-foreground">No chat selected</p>
      </div>
    );
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
          onRewind={armRewind}
          rewindingFromId={rewindTargetId}
          messages={messages}
          threadAssets={messagesData?.assets ?? []}
          streamingAssets={streamingAssets}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
          updateMessage={updateMessage}
        />

        {showCampaignLoading && isStreaming && (
          <p role="status" className="shrink-0 px-4 pb-2 text-sm text-muted-foreground">Building your campaign…</p>
        )}
        <AgentProgress thinkingText={thinkingText} steps={steps} connection={connection} onReconnect={() => window.location.reload()} onStop={handleStop} />
        {(modeProposal || changeProposal) && (
          <div className="space-y-2 px-4 pb-2">
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

        <div className="chat-scrollbar shrink-0 min-h-0 max-h-[calc(100%-72px)] overflow-y-auto px-3 pb-3">
        <ChatInput
          ref={chatInputRef}
          onSend={(message, files, meta) => {
            // Trying again is the signal they have dealt with it.
            setOutOfCredits(false);
            void handleSendMessage(message, files, meta);
          }}
          isStreaming={isStreaming}
          onStop={handleStop}
          mode={mode}
          onModeToggle={() => setMode((m) => (m === "brainstorm" ? "campaign" : "brainstorm"))}
          tier={tier}
          onTierChange={setTier}
          textareaMaxHeight={200}
          rewind={
            rewindTarget
              ? {
                  messageId: rewindTarget.message_id,
                  text: rewindTarget.content,
                  replacingCount: rewindReplacingCount,
                  onCancel: cancelRewind,
                }
              : null
          }
        />
        </div>
      </ChatPanelDropZone>

      <AssetsModal
        chatId={chatId}
        open={assetsOpen}
        onOpenChange={setAssetsOpen}
      />
    </div>
  );
}
