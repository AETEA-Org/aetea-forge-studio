import { Loader2, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditorTopBarProps {
  fileName?: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCancel: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  saving: boolean;
  ready: boolean;
  showSaveAs: boolean;
  saveAsName: string;
  onSaveAsNameChange: (name: string) => void;
  onSaveAsConfirm: () => void;
  onSaveAsBack: () => void;
}

/** Top bar with undo/redo, title, and save actions. */
export function EditorTopBar({
  fileName,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onCancel,
  onSave,
  onSaveAs,
  saving,
  ready,
  showSaveAs,
  saveAsName,
  onSaveAsNameChange,
  onSaveAsConfirm,
  onSaveAsBack,
}: EditorTopBarProps) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-2">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onUndo}
          disabled={!canUndo || saving}
          aria-label="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onRedo}
          disabled={!canRedo || saving}
          aria-label="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <h2 className="min-w-0 flex-1 truncate text-sm font-medium">
        {fileName ? `Edit — ${fileName}` : "Edit image"}
      </h2>

      {showSaveAs ? (
        <div className="flex items-center gap-2">
          <Label className="sr-only">File name</Label>
          <Input
            value={saveAsName}
            onChange={(e) => onSaveAsNameChange(e.target.value)}
            className="h-8 w-48"
            placeholder="edited.png"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSaveAsBack}
            disabled={saving}
          >
            Back
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSaveAsConfirm}
            disabled={saving || !ready}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save As"
            )}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onSaveAs}
            disabled={saving || !ready}
          >
            Save As
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={saving || !ready}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      )}
    </header>
  );
}
