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

interface RenameChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTitle: string;
  onConfirm: (title: string) => void;
  isSaving: boolean;
}

export function RenameChatDialog({
  open,
  onOpenChange,
  initialTitle,
  onConfirm,
  isSaving,
}: RenameChatDialogProps) {
  const [value, setValue] = useState(initialTitle);

  useEffect(() => {
    if (open) {
      setValue(initialTitle);
    }
  }, [open, initialTitle]);

  const trimmed = value.trim();
  const canSave = trimmed.length > 0 && trimmed !== initialTitle.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || isSaving) return;
    onConfirm(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
            <DialogDescription>
              Choose a new name for this project. It appears in your sidebar list.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Chat title"
              autoFocus
              disabled={isSaving}
              maxLength={500}
              aria-label="Chat title"
            />
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
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
