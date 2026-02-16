import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Paperclip, X, Lightbulb, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatContextIndicator } from "./ChatContextIndicator";
import { cn } from "@/lib/utils";

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
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/msword', // DOC
  'application/vnd.ms-powerpoint', // PPT
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `${file.name} exceeds 10MB limit` };
  }

  // Check file type
  const extension = file.name.split('.').pop()?.toLowerCase();
  const isValidExtension = extension && ALLOWED_EXTENSIONS.includes(extension);
  const isValidMimeType = ALLOWED_FILE_TYPES.includes(file.type);

  if (!isValidExtension && !isValidMimeType) {
    return { valid: false, error: `${file.name} is not a supported file type` };
  }

  return { valid: true };
}

export function ChatInput({
  onSend,
  isStreaming,
  contextLabel,
  disabled,
  showContextIndicator = true,
  mode,
  onModeToggle,
  textareaMaxHeight = 120,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(validation.error || 'Invalid file');
      }
    });

    if (errors.length > 0) {
      // Show errors (could use toast here)
      console.error('File validation errors:', errors);
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
        "border-t border-border bg-background p-4 space-y-3 min-w-0 overflow-x-hidden",
        isDragging && "bg-primary/5 border-primary/50"
      )}
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
          className="h-[44px] w-[44px] shrink-0 flex-shrink-0"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isDragging ? "Drop files here..." : "Ask a question..."}
          disabled={isStreaming || disabled}
          className="min-h-[44px] resize-none bg-background/50 border-border/50 flex-1 min-w-0"
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
          disabled={(!message.trim() && files.length === 0) || isStreaming || disabled}
          size="icon"
          className="h-[44px] w-[44px] shrink-0 flex-shrink-0"
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
}
