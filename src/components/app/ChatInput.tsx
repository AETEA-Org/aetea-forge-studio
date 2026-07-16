import { useState, useRef, useEffect, forwardRef, useImperativeHandle, type ReactNode } from "react";
import {
  Send,
  Loader2,
  Paperclip,
  X,
  Lightbulb,
  LayoutDashboard,
  Ratio,
  Scan,
  Palette,
  Timer,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Video,
  MessageSquare,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChatContextIndicator } from "./ChatContextIndicator";
import { cn } from "@/lib/utils";
import { partitionChatFiles, validateChatFile } from "@/lib/chatFileValidation";
import { useStyleCards } from "@/hooks/useStyleCards";

export type ChatMode = "brainstorm" | "campaign";
export type GenerationMode = "general" | "image" | "video";

export type GenerationOptions = {
  aspect_ratio?: string;
  image_size?: string;
  style_card_id?: string;
  resolution?: string;
  duration_seconds?: number;
  audio?: boolean;
};

export type ChatSendMeta = {
  generationMode?: GenerationMode;
  generationOptions?: GenerationOptions;
};

interface ChatInputProps {
  onSend: (message: string, files?: File[], meta?: ChatSendMeta) => void;
  isStreaming: boolean;
  contextLabel: string;
  disabled?: boolean;
  /** When false, hide the "Context: ..." label (e.g. in Chat View; only relevant in campaign view). Default true. */
  showContextIndicator?: boolean;
  /** When provided, shows mode toggle (icon + label) and uses this as current mode */
  mode?: ChatMode;
  onModeToggle?: () => void;
  /** Max height (px) for textarea before scrolling. Default 120. Use 200+ for chat view. */
  textareaMaxHeight?: number;
  /** When set, display this message in the textarea and optionally animate it. Parent clears when send starts. */
  prefillMessage?: string | null;
  /** Called when prefill is done (after typewriter or instant delay) so parent can trigger send. */
  onPrefillComplete?: () => void;
  /** How to display prefill: instant (brief pause) or typewriter (char-by-char). Default instant. */
  prefillMode?: "instant" | "typewriter";
  /** Optional custom placeholder for chat textarea. */
  inputPlaceholder?: string;
  /** Visual style variant for container. */
  variant?: "default" | "floating";
  /** Task-canvas only: General / Image / Video mode switch + option pickers. */
  enableGenerationModes?: boolean;
}

export interface ChatInputHandle {
  /** Append validated files (same as picking via paperclip). */
  addFiles: (files: File[]) => void;
}

const PREFILL_INSTANT_DELAY_MS = 180;
const PREFILL_TYPEWRITER_INTERVAL_MS = 20;

const IMAGE_ASPECTS = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"];
const IMAGE_SIZES = ["1K", "2K", "4K"];
const VIDEO_ASPECTS = ["16:9", "9:16", "1:1"];
const VIDEO_RESOLUTIONS = ["720p", "1080p", "4k"];
const VIDEO_DURATIONS = [5, 10, 15, 30, 45, 60];

const GENERATION_MODE_META: Record<
  GenerationMode,
  { label: string; icon: LucideIcon }
> = {
  general: { label: "General", icon: MessageSquare },
  image: { label: "Image", icon: ImageIcon },
  video: { label: "Video", icon: Video },
};

function OptionChip({
  label,
  active,
  onClick,
  disabled,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-md px-2 py-1 text-[11px] border transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

function StyleCardPicker({
  cards,
  selectedId,
  disabled,
  onToggle,
}: {
  cards: { id: string; name: string; preview_url: string | null }[];
  selectedId?: string;
  disabled?: boolean;
  onToggle: (id: string) => void;
}) {
  if (cards.length === 0) {
    return <p className="text-xs text-muted-foreground py-2">No style cards</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {cards.map((card) => {
        const active = selectedId === card.id;
        const label = card.name || card.id.slice(0, 8);
        return (
          <button
            key={card.id}
            type="button"
            disabled={disabled}
            title={label}
            onClick={() => onToggle(card.id)}
            className={cn(
              "relative aspect-square rounded-md border overflow-hidden transition-colors",
              active
                ? "border-primary ring-2 ring-primary/30"
                : "border-border hover:border-primary/50"
            )}
          >
            {card.preview_url ? (
              <img
                src={card.preview_url}
                alt={label}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-muted flex items-center justify-center px-1">
                <span className="text-[10px] text-muted-foreground text-center line-clamp-2">
                  {label}
                </span>
              </div>
            )}
            <span className="absolute inset-x-0 bottom-0 bg-background/80 px-1 py-0.5 text-[9px] truncate text-center">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function IconTipButton({
  tip,
  disabled,
  onClick,
  active,
  children,
  className,
}: {
  tip: string;
  disabled?: boolean;
  onClick?: () => void;
  active?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={onClick}
          className={cn(
            "h-7 w-7",
            active && "bg-primary/15 text-primary",
            className
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{tip}</TooltipContent>
    </Tooltip>
  );
}

function OptionPopover({
  tip,
  disabled,
  active,
  children,
  content,
  contentClassName,
}: {
  tip: string;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
  content: ReactNode;
  contentClassName?: string;
}) {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7", active && "bg-primary/15 text-primary")}
              disabled={disabled}
            >
              {children}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">{tip}</TooltipContent>
      </Tooltip>
      <PopoverContent className={cn("p-2", contentClassName)} align="start">
        {content}
      </PopoverContent>
    </Popover>
  );
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput(
  {
    onSend,
    isStreaming,
    contextLabel,
    disabled,
    showContextIndicator = true,
    mode,
    onModeToggle,
    textareaMaxHeight = 120,
    prefillMessage,
    onPrefillComplete,
    prefillMode = "instant",
    inputPlaceholder = "Ask a question...",
    variant = "default",
    enableGenerationModes = false,
  },
  ref
) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [prefillDisplayText, setPrefillDisplayText] = useState("");
  const [generationMode, setGenerationMode] = useState<GenerationMode>("general");
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStyles =
    enableGenerationModes &&
    (generationMode === "image" || generationMode === "video");
  const { data: styleData } = useStyleCards(loadStyles ? 30 : 0);
  const styleCards = styleData?.style_cards ?? [];

  useImperativeHandle(ref, () => ({
    addFiles: (incoming: File[]) => {
      if (!incoming.length || isStreaming || disabled) return;
      const valid: File[] = [];
      incoming.forEach((file) => {
        if (validateChatFile(file).valid) valid.push(file);
      });
      if (valid.length > 0) {
        setFiles((prev) => [...prev, ...valid]);
      }
    },
  }), [isStreaming, disabled]);

  const isPrefillActive = prefillMessage != null && prefillMessage.length > 0;
  const displayedValue = isPrefillActive ? prefillDisplayText : message;

  useEffect(() => {
    if (!prefillMessage) {
      setPrefillDisplayText("");
      return;
    }
    if (!onPrefillComplete) return;

    if (prefillMode === "instant") {
      setPrefillDisplayText(prefillMessage);
      const timer = setTimeout(() => {
        onPrefillComplete();
      }, PREFILL_INSTANT_DELAY_MS);
      return () => clearTimeout(timer);
    }

    setPrefillDisplayText("");
    let idx = 0;
    const interval = setInterval(() => {
      idx += 1;
      setPrefillDisplayText(prefillMessage.slice(0, idx));
      if (idx >= prefillMessage.length) {
        clearInterval(interval);
        onPrefillComplete();
      }
    }, PREFILL_TYPEWRITER_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [prefillMessage, prefillMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const patchOptions = (patch: Partial<GenerationOptions>) => {
    setGenerationOptions((prev) => {
      const next = { ...prev, ...patch };
      (Object.keys(patch) as (keyof GenerationOptions)[]).forEach((key) => {
        if (patch[key] === undefined) delete next[key];
      });
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPrefillActive) return;
    if ((!message.trim() && files.length === 0) || isStreaming || disabled) return;

    const meta: ChatSendMeta | undefined = enableGenerationModes
      ? {
          generationMode,
          generationOptions:
            Object.keys(generationOptions).length > 0 ? generationOptions : undefined,
        }
      : undefined;

    onSend(message.trim(), files.length > 0 ? files : undefined, meta);
    setMessage("");
    setFiles([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const { accepted, errors } = partitionChatFiles(Array.from(selectedFiles));

    if (errors.length > 0) {
      console.error("File validation errors:", errors);
    }

    if (accepted.length > 0) {
      setFiles((prev) => [...prev, ...accepted]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnterInput = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!Array.from(e.dataTransfer.types || []).includes("Files")) return;
    dragDepthInputRef.current += 1;
    setIsDragging(true);
  };

  const dragDepthInputRef = useRef(0);
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthInputRef.current = Math.max(0, dragDepthInputRef.current - 1);
    if (dragDepthInputRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthInputRef.current = 0;
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const pickerDisabled = isStreaming || disabled;
  const ModeIcon = GENERATION_MODE_META[generationMode].icon;
  const modeLabel = GENERATION_MODE_META[generationMode].label;

  return (
    <div
      className={cn(
        variant === "floating"
          ? "rounded-2xl border border-border/50 bg-background/90 backdrop-blur-md shadow-2xl p-3 space-y-2 min-w-0 overflow-x-hidden"
          : "border-t border-border bg-background p-4 space-y-3 min-w-0 overflow-x-hidden",
        isDragging && "bg-primary/5 border-primary/50"
      )}
      onDragEnter={handleDragEnterInput}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {showContextIndicator && <ChatContextIndicator contextLabel={contextLabel} />}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 border border-border text-xs"
            >
              <Paperclip className="h-3 w-3 text-muted-foreground" />
              <span className="max-w-[150px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="text-muted-foreground hover:text-foreground"
                disabled={isStreaming || disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 min-w-0">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming || disabled}
              className={cn(
                "h-[44px] w-[44px] shrink-0 flex-shrink-0",
                variant === "floating" && "rounded-xl"
              )}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Attach files</TooltipContent>
        </Tooltip>
        <Textarea
          ref={textareaRef}
          value={displayedValue}
          onChange={(e) => !isPrefillActive && setMessage(e.target.value)}
          placeholder={isDragging ? "Drop files here..." : inputPlaceholder}
          disabled={isStreaming || disabled}
          readOnly={isPrefillActive}
          className={cn(
            "min-h-[44px] resize-none bg-background/50 border-border/50 flex-1 min-w-0",
            variant === "floating" && "rounded-xl bg-background/70"
          )}
          style={{ maxHeight: `${textareaMaxHeight}px` }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        {onModeToggle && mode !== undefined && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onModeToggle}
            disabled={isStreaming || disabled}
            className="h-[44px] shrink-0 flex items-center gap-1.5 px-3 border-border"
          >
            {mode === "brainstorm" ? (
              <Lightbulb className="h-4 w-4" />
            ) : (
              <LayoutDashboard className="h-4 w-4" />
            )}
            <span className="text-xs font-medium capitalize">{mode}</span>
          </Button>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="submit"
              disabled={
                isPrefillActive ||
                ((!message.trim() && files.length === 0) || isStreaming || disabled)
              }
              size="icon"
              className={cn(
                "h-[44px] w-[44px] shrink-0 flex-shrink-0",
                variant === "floating" && "rounded-xl"
              )}
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Send</TooltipContent>
        </Tooltip>
      </form>

      {enableGenerationModes && (
        <div className="flex flex-wrap items-center gap-0.5 pt-0.5">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pickerDisabled}
                    className={cn(
                      "h-7 gap-0.5 px-1.5 text-muted-foreground",
                      generationMode !== "general" && "text-primary bg-primary/10"
                    )}
                  >
                    <ModeIcon className="h-3.5 w-3.5" />
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top">{modeLabel}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" side="top" className="min-w-[9rem]">
              {(Object.keys(GENERATION_MODE_META) as GenerationMode[]).map((m) => {
                const meta = GENERATION_MODE_META[m];
                const Icon = meta.icon;
                return (
                  <DropdownMenuItem
                    key={m}
                    disabled={pickerDisabled}
                    onClick={() => {
                      setGenerationMode(m);
                      setGenerationOptions({});
                    }}
                    className={cn(
                      "gap-2",
                      generationMode === m && "bg-accent"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{meta.label}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {generationMode === "image" && (
            <>
              <OptionPopover
                tip="Aspect ratio"
                disabled={pickerDisabled}
                active={!!generationOptions.aspect_ratio}
                contentClassName="w-52"
                content={
                  <>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Aspect ratio</p>
                    <div className="flex flex-wrap gap-1">
                      {IMAGE_ASPECTS.map((a) => (
                        <OptionChip
                          key={a}
                          label={a}
                          active={generationOptions.aspect_ratio === a}
                          disabled={pickerDisabled}
                          onClick={() =>
                            patchOptions({
                              aspect_ratio:
                                generationOptions.aspect_ratio === a ? undefined : a,
                            })
                          }
                        />
                      ))}
                    </div>
                  </>
                }
              >
                <Ratio className="h-3.5 w-3.5" />
              </OptionPopover>

              <OptionPopover
                tip="Resolution"
                disabled={pickerDisabled}
                active={!!generationOptions.image_size}
                contentClassName="w-40"
                content={
                  <>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Resolution</p>
                    <div className="flex flex-wrap gap-1">
                      {IMAGE_SIZES.map((s) => (
                        <OptionChip
                          key={s}
                          label={s}
                          active={generationOptions.image_size === s}
                          disabled={pickerDisabled}
                          onClick={() =>
                            patchOptions({
                              image_size:
                                generationOptions.image_size === s ? undefined : s,
                            })
                          }
                        />
                      ))}
                    </div>
                  </>
                }
              >
                <Scan className="h-3.5 w-3.5" />
              </OptionPopover>

              <OptionPopover
                tip="Style"
                disabled={pickerDisabled}
                active={!!generationOptions.style_card_id}
                contentClassName="w-56 max-h-64 overflow-y-auto"
                content={
                  <>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Style card</p>
                    <StyleCardPicker
                      cards={styleCards}
                      selectedId={generationOptions.style_card_id}
                      disabled={pickerDisabled}
                      onToggle={(id) =>
                        patchOptions({
                          style_card_id:
                            generationOptions.style_card_id === id ? undefined : id,
                        })
                      }
                    />
                  </>
                }
              >
                <Palette className="h-3.5 w-3.5" />
              </OptionPopover>
            </>
          )}

          {generationMode === "video" && (
            <>
              <OptionPopover
                tip="Aspect ratio"
                disabled={pickerDisabled}
                active={!!generationOptions.aspect_ratio}
                contentClassName="w-40"
                content={
                  <>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Aspect ratio</p>
                    <div className="flex flex-wrap gap-1">
                      {VIDEO_ASPECTS.map((a) => (
                        <OptionChip
                          key={a}
                          label={a}
                          active={generationOptions.aspect_ratio === a}
                          disabled={pickerDisabled}
                          onClick={() =>
                            patchOptions({
                              aspect_ratio:
                                generationOptions.aspect_ratio === a ? undefined : a,
                            })
                          }
                        />
                      ))}
                    </div>
                  </>
                }
              >
                <Ratio className="h-3.5 w-3.5" />
              </OptionPopover>

              <OptionPopover
                tip="Resolution"
                disabled={pickerDisabled}
                active={!!generationOptions.resolution}
                contentClassName="w-40"
                content={
                  <>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Resolution</p>
                    <div className="flex flex-wrap gap-1">
                      {VIDEO_RESOLUTIONS.map((r) => (
                        <OptionChip
                          key={r}
                          label={r}
                          active={generationOptions.resolution === r}
                          disabled={pickerDisabled}
                          onClick={() =>
                            patchOptions({
                              resolution:
                                generationOptions.resolution === r ? undefined : r,
                            })
                          }
                        />
                      ))}
                    </div>
                  </>
                }
              >
                <Scan className="h-3.5 w-3.5" />
              </OptionPopover>

              <OptionPopover
                tip="Duration"
                disabled={pickerDisabled}
                active={!!generationOptions.duration_seconds}
                contentClassName="w-48"
                content={
                  <>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Duration</p>
                    <div className="flex flex-wrap gap-1">
                      {VIDEO_DURATIONS.map((d) => (
                        <OptionChip
                          key={d}
                          label={`${d}s`}
                          active={generationOptions.duration_seconds === d}
                          disabled={pickerDisabled}
                          onClick={() =>
                            patchOptions({
                              duration_seconds:
                                generationOptions.duration_seconds === d
                                  ? undefined
                                  : d,
                            })
                          }
                        />
                      ))}
                    </div>
                  </>
                }
              >
                <Timer className="h-3.5 w-3.5" />
              </OptionPopover>

              <OptionPopover
                tip="Style"
                disabled={pickerDisabled}
                active={!!generationOptions.style_card_id}
                contentClassName="w-56 max-h-64 overflow-y-auto"
                content={
                  <>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Style card</p>
                    <StyleCardPicker
                      cards={styleCards}
                      selectedId={generationOptions.style_card_id}
                      disabled={pickerDisabled}
                      onToggle={(id) =>
                        patchOptions({
                          style_card_id:
                            generationOptions.style_card_id === id ? undefined : id,
                        })
                      }
                    />
                  </>
                }
              >
                <Palette className="h-3.5 w-3.5" />
              </OptionPopover>

              <IconTipButton
                tip={generationOptions.audio === false ? "Audio off" : "Audio on"}
                disabled={pickerDisabled}
                active={generationOptions.audio === false}
                onClick={() =>
                  patchOptions({
                    audio: generationOptions.audio === false ? true : false,
                  })
                }
              >
                {generationOptions.audio === false ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </IconTipButton>
            </>
          )}
        </div>
      )}
    </div>
  );
});
