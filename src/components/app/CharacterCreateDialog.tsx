import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Images offered as a character's reference photos. */
export type CharacterSourceAsset = {
  id: string;
  file_name: string;
  view_url: string;
  mime_type: string;
};

const MAX_NAME_CHARS = 20;
const MAX_DESCRIPTION_CHARS = 100;
const MAX_ANGLES = 3;

interface CharacterCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: CharacterSourceAsset[];
  onConfirm: (payload: {
    name: string;
    description: string;
    frontal_asset_id: string;
    angle_asset_ids: string[];
  }) => void;
  isSaving: boolean;
  error?: string | null;
}

export function CharacterCreateDialog({
  open,
  onOpenChange,
  assets,
  onConfirm,
  isSaving,
  error,
}: CharacterCreateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frontalId, setFrontalId] = useState<string | null>(null);
  const [angleIds, setAngleIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setFrontalId(null);
      setAngleIds([]);
    }
  }, [open]);

  const canSave =
    name.trim().length > 0 && description.trim().length > 0 && !!frontalId;

  const toggleAngle = (id: string) => {
    setAngleIds((prev) => {
      if (prev.includes(id)) return prev.filter((a) => a !== id);
      if (prev.length >= MAX_ANGLES) return prev;
      return [...prev, id];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || isSaving) return;
    onConfirm({
      name: name.trim(),
      description: description.trim(),
      frontal_asset_id: frontalId!,
      angle_asset_ids: angleIds,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New character</DialogTitle>
            <DialogDescription>
              Save a person, mascot, or product once so it looks identical in
              every video you generate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name, e.g. Sara"
              autoFocus
              disabled={isSaving}
              maxLength={MAX_NAME_CHARS}
              aria-label="Character name"
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description, e.g. lead presenter in olive jacket"
              disabled={isSaving}
              maxLength={MAX_DESCRIPTION_CHARS}
              aria-label="Character description"
            />

            {assets.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No images in this chat yet. Generate or upload one first.
              </p>
            ) : (
              <>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1.5">
                    Front-facing image (required)
                  </p>
                  <AssetGrid
                    assets={assets}
                    selectedIds={frontalId ? [frontalId] : []}
                    disabled={isSaving}
                    onToggle={(id) =>
                      setFrontalId((prev) => {
                        const next = prev === id ? null : id;
                        setAngleIds((angles) => angles.filter((a) => a !== next));
                        return next;
                      })
                    }
                  />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1.5">
                    Other angles (optional, up to {MAX_ANGLES}) — these sharpen
                    the likeness
                  </p>
                  <AssetGrid
                    assets={assets.filter((a) => a.id !== frontalId)}
                    selectedIds={angleIds}
                    disabled={isSaving}
                    onToggle={toggleAngle}
                  />
                </div>
              </>
            )}

            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Preparing a character takes a couple of minutes; it becomes
                usable automatically when it is ready.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving…
                </>
              ) : (
                "Create character"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssetGrid({
  assets,
  selectedIds,
  disabled,
  onToggle,
}: {
  assets: CharacterSourceAsset[];
  selectedIds: string[];
  disabled?: boolean;
  onToggle: (id: string) => void;
}) {
  if (assets.length === 0) {
    return <p className="text-xs text-muted-foreground py-2">No images</p>;
  }
  return (
    <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto">
      {assets.map((asset) => {
        const active = selectedIds.includes(asset.id);
        const label = asset.file_name || asset.id.slice(0, 8);
        return (
          <button
            key={asset.id}
            type="button"
            disabled={disabled}
            title={label}
            onClick={() => onToggle(asset.id)}
            className={cn(
              "relative aspect-square rounded-md border overflow-hidden transition-colors",
              active
                ? "border-primary ring-2 ring-primary/30"
                : "border-border hover:border-primary/50"
            )}
          >
            <img
              src={asset.view_url}
              alt={label}
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-x-0 bottom-0 bg-background/80 px-1 py-0.5 text-[9px] truncate text-center">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
