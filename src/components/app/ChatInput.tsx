import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Send, Loader2, Paperclip, X, Lightbulb, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatContextIndicator } from "./ChatContextIndicator";
import { cn } from "@/lib/utils";
import { partitionChatFiles, validateChatFile } from "@/lib/chatFileValidation";

export type ChatMode = "brainstorm" | "campaign";

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
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
}

export interface ChatInputHandle {
  /** Append validated files (same as picking via paperclip). */
  addFiles: (files: File[]) => void;
}

const PREFILL_INSTANT_DELAY_MS = 180;
const PREFILL_TYPEWRITER_INTERVAL_MS = 20;

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
  },
  ref
) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [prefillDisplayText, setPrefillDisplayText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Prefill logic: show message (instant or typewriter), then call onPrefillComplete
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

    // typewriter mode
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
  }, [prefillMessage, prefillMode]); // eslint-disable-line react-hooks/exhaustive-deps -- onPrefillComplete intentionally excluded

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPrefillActive) return;
    if ((!message.trim() && files.length === 0) || isStreaming || disabled) return;
    
    onSend(message.trim(), files.length > 0 ? files : undefined);
    setMessage("");
    setFiles([]);
    
    // Reset textarea height
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

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
      
      {/* File previews */}
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
        <Button
          type="submit"
          disabled={isPrefillActive || ((!message.trim() && files.length === 0) || isStreaming || disabled)}
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
      </form>
    </div>
  );
});
