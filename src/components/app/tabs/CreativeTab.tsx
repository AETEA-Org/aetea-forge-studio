import { useState, useCallback, useEffect } from "react";
import { Loader2, Upload, X } from "lucide-react";
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
import { refreshAssetUrls } from "@/services/api";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isKeyVisualDialogOpen, setIsKeyVisualDialogOpen] = useState(false);
  const [keyVisualDetails, setKeyVisualDetails] = useState("");
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [isDraggingImages, setIsDraggingImages] = useState(false);

  const MAX_REFERENCE_IMAGES = 3;
  const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

  // Fetch creative state
  const { data: creativeState, isLoading, error } = useCreativeState(campaignId);
  const updateCreativeStateMutation = useUpdateCreativeState();

  // Fetch campaign tasks (for Tasks section below Key Visual)
  const { data: tasksData, isLoading: tasksLoading } = useCampaignTasks(campaignId);
  const tasks = tasksData?.tasks ?? [];

  // Fetch fresh download URL for key visual (works in img; view_url has CORS issues for embedding).
  const keyVisualAssetId = creativeState?.key_visual_asset_id ?? null;
  const { data: keyVisualUrl } = useQuery({
    queryKey: ['asset-urls', keyVisualAssetId, user?.email],
    queryFn: () =>
      refreshAssetUrls(keyVisualAssetId!, user!.email!).then((r) => r.download_url),
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
  // When API omits total (null), infer hasMore from full-page response (30 cards = possibly more)
  const hasMoreStyleCards =
    totalStyleCards > styleCards.length ||
    (totalStyleCards === 0 && (styleCardsData?.style_cards?.length ?? 0) >= 30);

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

  const handleLoadMoreStyleCards = useCallback(() => {
    if (!isLoadingStyleCards && hasMoreStyleCards) {
      setStyleCardPage((p) => p + 1);
    }
  }, [isLoadingStyleCards, hasMoreStyleCards]);

  const resetKeyVisualDialog = useCallback(() => {
    setKeyVisualDetails("");
    setReferenceImages([]);
    setIsDraggingImages(false);
  }, []);

  const handleReferenceFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const validImages: File[] = [];
    const errors: string[] = [];
    const slotsRemaining = MAX_REFERENCE_IMAGES - referenceImages.length;

    if (slotsRemaining <= 0) {
      toast({
        title: "Image limit reached",
        description: `You can upload up to ${MAX_REFERENCE_IMAGES} images.`,
        variant: "destructive",
      });
      return;
    }

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name} is not an image file.`);
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        errors.push(`${file.name} exceeds 10MB.`);
        return;
      }
      validImages.push(file);
    });

    if (errors.length > 0) {
      toast({
        title: "Some files were skipped",
        description: errors[0],
        variant: "destructive",
      });
    }

    if (validImages.length > 0) {
      setReferenceImages((prev) => [...prev, ...validImages].slice(0, MAX_REFERENCE_IMAGES));
    }
  }, [referenceImages.length, toast]);

  const handleRemoveReferenceImage = useCallback((index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleGenerateKeyVisual = useCallback(async () => {
    if (!selectedStyleId || !user?.email || isGenerating) return;

    setIsGenerating(true);

    try {
      const normalizedDetails = keyVisualDetails.trim();
      const filesToSend = [...referenceImages];
      const imageNames = filesToSend.map((file) => file.name).join(", ");
      const selectedStyle = styleCards.find((s) => s.id === selectedStyleId);
      const styleLine = selectedStyle?.name
        ? `selected style is named ${selectedStyle.name}`
        : `selected style is named ${selectedStyleId}`;

      const messageParts = [
        "Generate a key visual using the selected style and following details:",
        normalizedDetails,
        styleLine,
        imageNames ? `reference images ${imageNames}` : "",
      ].filter(Boolean);
      const message = messageParts.join("\n");

      // Close dialog immediately after submit, while generation continues in background.
      setIsKeyVisualDialogOpen(false);
      resetKeyVisualDialog();

      // Trigger auto-send: message appears in chatbox, then auto-sends and streams in the copilot panel
      // Overlay driven only by backend campaign_modifying event
      await triggerAutoSend(message, {
        files: filesToSend.length > 0 ? filesToSend : undefined,
        context: 'tab:creative',
        onEvent: (eventName: string) => {
          if (eventName === 'campaign_modified') {
            queryClient.invalidateQueries({
              queryKey: ['creative', campaignId, user.email],
            });
            queryClient.invalidateQueries({
              queryKey: ['campaign', campaignId, 'tasks', user.email],
            });
            queryClient.invalidateQueries({ queryKey: ['asset-urls'] });
            queryClient.invalidateQueries({
              queryKey: ['assets', chatId, user.email],
            });
          }
        },
        onComplete: () => {
          setIsModifying(false, null);
          setIsGenerating(false);
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
    styleCards,
    keyVisualDetails,
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
    resetKeyVisualDialog,
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
            {keyVisualUrl ? (
              <div className="rounded-lg border border-border overflow-hidden bg-muted/30 max-w-2xl w-full flex justify-center">
                <img
                  src={keyVisualUrl}
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
          onClick={() => setIsKeyVisualDialogOpen(true)}
          isGenerating={isGenerating}
        />
      </section>

      <Dialog
        open={isKeyVisualDialogOpen}
        onOpenChange={(open) => {
          setIsKeyVisualDialogOpen(open);
          if (!open && !isGenerating) {
            resetKeyVisualDialog();
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Generate Key Visual</DialogTitle>
            <DialogDescription>
              Add optional details to guide generation. You can submit with or without these fields.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleGenerateKeyVisual();
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="key-visual-details">
                Additional details (optional)
              </label>
              <Input
                id="key-visual-details"
                placeholder="Describe mood, composition, lighting, or any direction..."
                value={keyVisualDetails}
                onChange={(e) => setKeyVisualDetails(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Reference images (optional)
              </label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-5 text-center transition-colors cursor-pointer",
                  isDraggingImages ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                  isGenerating && "pointer-events-none opacity-60"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingImages(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDraggingImages(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingImages(false);
                  handleReferenceFiles(e.dataTransfer.files);
                }}
                onClick={() => {
                  if (isGenerating) return;
                  const input = document.getElementById("key-visual-file-input") as HTMLInputElement | null;
                  input?.click();
                }}
              >
                <Upload className="h-7 w-7 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isDraggingImages ? "Drop images here" : "Click or drag images to upload"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Up to {MAX_REFERENCE_IMAGES} images, max 10MB each
                </p>
              </div>
              <input
                id="key-visual-file-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleReferenceFiles(e.target.files)}
                disabled={isGenerating}
              />

              {referenceImages.length > 0 && (
                <div className="space-y-2">
                  {referenceImages.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                      <span className="text-sm truncate pr-2">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveReferenceImage(index)}
                        className="p-1 rounded hover:bg-muted"
                        disabled={isGenerating}
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <CreativeTaskCard key={task.id} task={task} chatId={chatId} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
