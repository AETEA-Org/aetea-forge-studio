import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useCreativeState, useUpdateCreativeState } from "@/hooks/useCreativeState";
import { useStyleCards } from "@/hooks/useStyleCards";
import { useCampaignTasks } from "@/hooks/useCampaignTasks";
import { useAuth } from "@/hooks/useAuth";
import { useModification } from "@/hooks/useModification";
import { useAutoMessage } from "@/hooks/useAutoMessage";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { StyleCard } from "@/types/api";
import { CreativeTruthCard } from "./CreativeTruthCard";
import { CreativeToneCard } from "./CreativeToneCard";
import { VisualDirectionCard } from "./VisualDirectionCard";
import { GenerateKeyVisualButton } from "./GenerateKeyVisualButton";
import { CreativeTaskCard } from "./CreativeTaskCard";
import { ModificationOverlay } from "@/components/app/ModificationOverlay";
import { refreshAssetDownloadUrl } from "@/services/api";
import { cn } from "@/lib/utils";

interface CreativeTabProps {
  campaignId: string;
  chatId: string;
  isModifying?: boolean;
}

export function CreativeTab({ campaignId, chatId, isModifying }: CreativeTabProps) {
  const { user } = useAuth();
  const { setIsModifying } = useModification();
  const { triggerAutoSend } = useAutoMessage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [flippedCards, setFlippedCards] = useState<Set<'truth' | 'tone' | 'visual'>>(new Set());
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch creative state
  const { data: creativeState, isLoading, error } = useCreativeState(campaignId);
  const updateCreativeStateMutation = useUpdateCreativeState();

  // Fetch campaign tasks (for Tasks section below Key Visual)
  const { data: tasksData, isLoading: tasksLoading } = useCampaignTasks(campaignId);
  const tasks = tasksData?.tasks ?? [];

  // Fetch fresh download URL for key visual (signed URLs expire; refreshAssetDownloadUrl returns a valid one).
  const keyVisualAssetId = creativeState?.key_visual_asset_id ?? null;
  const { data: keyVisualDownloadUrl } = useQuery({
    queryKey: ['asset-download', keyVisualAssetId, user?.email],
    queryFn: () =>
      refreshAssetDownloadUrl(keyVisualAssetId!, user!.email!).then(
        (r) => r.download_url
      ),
    enabled: !!keyVisualAssetId && !!user?.email,
    staleTime: 50 * 60 * 1000, // 50 min (URLs often expire in ~1h)
  });

  // Fetch style cards (only when Visual Direction card is flipped), with pagination
  const shouldLoadStyleCards = flippedCards.has('visual');
  const [styleCardPage, setStyleCardPage] = useState(0);
  const [accumulatedStyleCards, setAccumulatedStyleCards] = useState<StyleCard[]>([]);
  const styleCardOffset = styleCardPage * 30;
  const { data: styleCardsData, isLoading: isLoadingStyleCards } = useStyleCards(
    shouldLoadStyleCards ? 30 : 0,
    styleCardOffset
  );

  useEffect(() => {
    if (!styleCardsData?.style_cards) return;
    if (styleCardOffset === 0) {
      setAccumulatedStyleCards(styleCardsData.style_cards);
    } else {
      setAccumulatedStyleCards((prev) => [...prev, ...styleCardsData.style_cards]);
    }
  }, [styleCardsData, styleCardOffset]);

  useEffect(() => {
    if (!shouldLoadStyleCards) {
      setStyleCardPage(0);
      setAccumulatedStyleCards([]);
    }
  }, [shouldLoadStyleCards]);

  const styleCards = shouldLoadStyleCards ? accumulatedStyleCards : [];
  const totalStyleCards = styleCardsData?.total ?? 0;
  const hasMoreStyleCards = totalStyleCards > styleCards.length;

  const selectedStyleId = creativeState?.selected_style_id || null;

  const toggleFlip = useCallback((card: 'truth' | 'tone' | 'visual') => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (next.has(card)) {
        next.delete(card);
      } else {
        next.add(card);
      }
      return next;
    });
  }, []);

  const handleStyleSelect = useCallback(async (styleId: string) => {
    try {
      await updateCreativeStateMutation.mutateAsync({
        campaignId,
        updates: { selected_style_id: styleId },
      });
      toast({
        title: "Style selected",
        description: "Style card has been saved.",
      });
    } catch (error) {
      console.error('Failed to select style:', error);
      toast({
        title: "Failed to select style",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive",
      });
    }
  }, [campaignId, updateCreativeStateMutation, toast]);

  const handleReferenceImageAdd = useCallback((files: File[]) => {
    setReferenceImages(files);
  }, []);

  const handleReferenceImageRemove = useCallback((index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleLoadMoreStyleCards = useCallback(() => {
    if (!isLoadingStyleCards && hasMoreStyleCards) {
      setStyleCardPage((p) => p + 1);
    }
  }, [isLoadingStyleCards, hasMoreStyleCards]);

  const handleGenerateKeyVisual = useCallback(async () => {
    if (!selectedStyleId || !user?.email || isGenerating) return;

    setIsGenerating(true);

    try {
      // Build message with reference image file names
      const imageNames = referenceImages.map((f) => f.name).join(', ');
      const message = `Generate a key visual using the selected style.${
        imageNames ? ` Reference images: ${imageNames}` : ''
      }`;

      // Send PATCH request to update visual_direction (with empty reference_image_ids for now)
      await updateCreativeStateMutation.mutateAsync({
        campaignId,
        updates: {
          visual_direction: {
            reference_image_ids: [], // Backend will associate files from POST /ai/chat
          },
        },
      });

      // Trigger auto-send: message appears in chatbox, then auto-sends and streams in AICopilotPanel
      // Overlay driven only by backend campaign_modifying event
      await triggerAutoSend(message, {
        files: referenceImages.length > 0 ? referenceImages : undefined,
        context: 'tab:creative',
        onEvent: (eventName: string) => {
          if (eventName === 'campaign_modified') {
            queryClient.invalidateQueries({
              queryKey: ['creative', campaignId, user.email],
            });
            queryClient.invalidateQueries({
              queryKey: ['campaign', campaignId, 'tasks', user.email],
            });
            queryClient.invalidateQueries({ queryKey: ['asset-download'] });
            queryClient.invalidateQueries({
              queryKey: ['assets', chatId, user.email],
            });
          }
        },
        onComplete: () => {
          setIsModifying(false, null);
          setIsGenerating(false);
          setReferenceImages([]);
        },
        onError: (errorMsg: string) => {
          setIsModifying(false, null);
          setIsGenerating(false);
          toast({
            title: "Failed to generate key visual",
            description: errorMsg,
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      setIsModifying(false, null);
      setIsGenerating(false);
      console.error('Failed to generate key visual:', error);
      toast({
        title: "Failed to generate key visual",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive",
      });
    }
  }, [
    selectedStyleId,
    referenceImages,
    user,
    chatId,
    campaignId,
    isGenerating,
    updateCreativeStateMutation,
    triggerAutoSend,
    setIsModifying,
    queryClient,
    toast,
  ]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    console.error('Creative state load error:', error);
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load creative state</p>
        <p className="text-sm text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative", isModifying && "pointer-events-none")}>
      <ModificationOverlay
        isActive={isModifying || false}
        message="AETEA is modifying campaign..."
      />

      {/* Two-column card layout per plan */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - 2 stacked cards */}
        <div className="flex flex-col gap-6">
          <CreativeTruthCard
            flipped={flippedCards.has('truth')}
            onFlip={() => toggleFlip('truth')}
            data={creativeState?.creative_truth}
          />
          <CreativeToneCard
            flipped={flippedCards.has('tone')}
            onFlip={() => toggleFlip('tone')}
            data={creativeState?.creative_tone}
          />
        </div>

        {/* Right Column - 1 tall card (height = combined height of left cards) */}
        <div className="min-h-0 flex flex-col">
          <VisualDirectionCard
            flipped={flippedCards.has('visual')}
            onFlip={() => toggleFlip('visual')}
            selectedStyleId={selectedStyleId}
            onStyleSelect={handleStyleSelect}
            referenceImages={referenceImages}
            onReferenceImageAdd={handleReferenceImageAdd}
            onReferenceImageRemove={handleReferenceImageRemove}
            styleCards={styleCards}
            isLoadingStyleCards={isLoadingStyleCards && styleCardPage === 0}
            hasMoreStyleCards={hasMoreStyleCards}
            onLoadMoreStyleCards={handleLoadMoreStyleCards}
          />
        </div>
      </div>

      {/* Key visual - shown only when it exists, above Generate Key Visual button. Title left, image centered in tab. */}
      {keyVisualAssetId && (
        <section className="mt-8 pt-6 border-t border-border">
          <h3 className="text-lg font-semibold mb-4 text-left">Key Visual</h3>
          <div className="flex justify-center w-full">
            {keyVisualDownloadUrl ? (
              <div className="rounded-lg border border-border overflow-hidden bg-muted/30 max-w-2xl w-full flex justify-center">
                <img
                  src={keyVisualDownloadUrl}
                  alt="Key visual"
                  className="max-w-full h-auto object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 bg-muted/30 rounded-lg border border-border max-w-2xl w-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Generate Key Visual - large prominent button below entire card layout */}
      <section className="mt-8 pt-6 border-t border-border">
        <GenerateKeyVisualButton
          disabled={!selectedStyleId || isGenerating}
          onClick={handleGenerateKeyVisual}
          isGenerating={isGenerating}
        />
      </section>

      {/* Tasks - list of campaign tasks (task detail page later) */}
      <section className="mt-8 pt-6 border-t border-border">
        <h3 className="text-lg font-semibold mb-4">Tasks</h3>
        {tasksLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No tasks yet.</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <CreativeTaskCard key={task.id} task={task} chatId={chatId} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
