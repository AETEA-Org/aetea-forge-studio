import { Image, RotateCcw, X, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { StyleCardGrid } from "./StyleCardGrid";
import type { StyleCard } from "@/types/api";

const MAX_REFERENCE_IMAGES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

interface VisualDirectionCardProps {
  flipped: boolean;
  onFlip: () => void;
  selectedStyleId: string | null;
  onStyleSelect: (styleId: string) => void;
  referenceImages: File[];
  onReferenceImageAdd: (files: File[]) => void;
  onReferenceImageRemove: (index: number) => void;
  styleCards: StyleCard[];
  isLoadingStyleCards: boolean;
  hasMoreStyleCards: boolean;
  onLoadMoreStyleCards: () => void;
}

function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `${file.name} exceeds 10MB limit` };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: `${file.name} is not a supported image type` };
  }

  return { valid: true };
}

export function VisualDirectionCard({
  flipped,
  onFlip,
  selectedStyleId,
  onStyleSelect,
  referenceImages,
  onReferenceImageAdd,
  onReferenceImageRemove,
  styleCards,
  isLoadingStyleCards,
  hasMoreStyleCards,
  onLoadMoreStyleCards,
}: VisualDirectionCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      if (referenceImages.length >= MAX_REFERENCE_IMAGES) {
        errors.push(`Maximum ${MAX_REFERENCE_IMAGES} images allowed`);
        return;
      }

      const validation = validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(validation.error || 'Invalid file');
      }
    });

    if (errors.length > 0) {
      console.error('File validation errors:', errors);
      // Could show toast here
    }

    if (validFiles.length > 0) {
      const newFiles = [...referenceImages, ...validFiles].slice(0, MAX_REFERENCE_IMAGES);
      onReferenceImageAdd(newFiles);
    }
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

  return (
    <div className="relative h-full min-h-[600px] perspective-1000">
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-500 preserve-3d",
          flipped && "rotate-y-180"
        )}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Side - title, icon; hover indicates interactivity */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full backface-hidden rounded-lg border border-border bg-card p-6 flex flex-col items-center justify-center cursor-pointer",
            "hover:shadow-lg hover:border-primary/30 transition-all duration-300",
            !flipped ? "z-10" : "z-0"
          )}
          onClick={onFlip}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <Image className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Visual Direction</h3>
          <p className="text-sm text-muted-foreground">Click to view</p>
        </div>

        {/* Back Side */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full backface-hidden rounded-lg border border-border bg-card p-6 overflow-y-auto",
            flipped ? "z-10 rotate-y-180" : "z-0"
          )}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="flex items-start justify-between mb-4 sticky top-0 bg-card pb-2 z-10">
            <h3 className="text-lg font-semibold">Visual Direction</h3>
            <button
              onClick={onFlip}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              title="Flip back"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Style Card Grid Section */}
            <div>
              <h4 className="text-sm font-medium mb-4">Style Cards</h4>
              <StyleCardGrid
                selectedStyleId={selectedStyleId}
                onSelect={onStyleSelect}
                styleCards={styleCards}
                isLoading={isLoadingStyleCards}
                hasMore={hasMoreStyleCards}
                onLoadMore={onLoadMoreStyleCards}
              />
            </div>

            {/* Reference Images Section - max 3, thumbnails ~80x80px */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium">Reference Images (max {MAX_REFERENCE_IMAGES})</h4>
                <span className="text-xs text-muted-foreground">
                  {referenceImages.length}/{MAX_REFERENCE_IMAGES}
                </span>
              </div>

              {/* Upload Area */}
              {referenceImages.length < MAX_REFERENCE_IMAGES && (
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {isDragging ? 'Drop images here' : 'Click or drag images to upload'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max {MAX_REFERENCE_IMAGES} images, 10MB each
                  </p>
                </div>
              )}

              {/* Thumbnail Grid - ~80x80px, remove X top-right per plan */}
              {referenceImages.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {referenceImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted shrink-0">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => onReferenceImageRemove(index)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <p className="text-xs text-muted-foreground mt-1 truncate" title={file.name}>
                        {file.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
