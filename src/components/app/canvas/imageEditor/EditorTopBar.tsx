import { Loader2, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ImageExportFormat } from "./types";

interface EditorTopBarProps {
  fileName?: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCancel: () => void;
  onSave: () => void;
  onSaveAsConfirm: () => void;
  saving: boolean;
  ready: boolean;
  saveFormat: ImageExportFormat;
  onSaveFormatChange: (format: ImageExportFormat) => void;
  saveAsOpen: boolean;
  onSaveAsOpenChange: (open: boolean) => void;
  saveAsName: string;
  onSaveAsNameChange: (name: string) => void;
}

function FormatToggle({
  value,
  onChange,
  disabled,
  idPrefix,
}: {
  value: ImageExportFormat;
  onChange: (format: ImageExportFormat) => void;
  disabled?: boolean;
  idPrefix: string;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v === "png" || v === "jpeg") onChange(v);
      }}
      className="h-8"
      disabled={disabled}
    >
      <ToggleGroupItem
        value="png"
        aria-label="PNG format"
        className="h-7 px-2 text-xs"
        id={`${idPrefix}-png`}
      >
        PNG
      </ToggleGroupItem>
      <ToggleGroupItem
        value="jpeg"
        aria-label="JPEG format"
        className="h-7 px-2 text-xs"
        id={`${idPrefix}-jpeg`}
      >
        JPG
      </ToggleGroupItem>
    </ToggleGroup>
  );
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
  onSaveAsConfirm,
  saving,
  ready,
  saveFormat,
  onSaveFormatChange,
  saveAsOpen,
  onSaveAsOpenChange,
  saveAsName,
  onSaveAsNameChange,
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

        <Popover open={saveAsOpen} onOpenChange={onSaveAsOpenChange}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={saving || !ready}
            >
              Save As
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="z-[120] w-72 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="save-as-name">Save as</Label>
              <Input
                id="save-as-name"
                value={saveAsName}
                onChange={(e) => onSaveAsNameChange(e.target.value)}
                className="h-8"
                placeholder={
                  saveFormat === "jpeg" ? "edited.jpg" : "edited.png"
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Format</Label>
              <FormatToggle
                idPrefix="save-as"
                value={saveFormat}
                onChange={onSaveFormatChange}
                disabled={saving}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onSaveAsOpenChange(false)}
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
          </PopoverContent>
        </Popover>

        <FormatToggle
          idPrefix="save"
          value={saveFormat}
          onChange={onSaveFormatChange}
          disabled={saving || !ready}
        />

        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={saving || !ready}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </div>
    </header>
  );
}
