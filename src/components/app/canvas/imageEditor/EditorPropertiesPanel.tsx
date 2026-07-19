import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bold,
  Italic,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { FabricObject } from "fabric";
import {
  EDITOR_FONTS,
  type CropAspect,
  type EditorStyleState,
  type EditorTool,
  isArrowGroup,
  isShapeObject,
  isShapeTool,
  isTextObject,
} from "./types";

interface EditorPropertiesPanelProps {
  tool: EditorTool;
  style: EditorStyleState;
  onStyleChange: React.Dispatch<React.SetStateAction<EditorStyleState>>;
  selectedObject: FabricObject | null;
  hasCropRect: boolean;
  cropAspect: CropAspect;
  onCropAspectChange: (aspect: CropAspect) => void;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
  scalePercent: number;
  onScalePercentChange: (p: number) => void;
  originalWidth: number;
  originalHeight: number;
  onApplyResize: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}

function toHexColor(value: string, fallback = "#ffffff"): string {
  if (value.startsWith("#") && (value.length === 7 || value.length === 4)) {
    return value;
  }
  return fallback;
}

function ColorField({
  label,
  value,
  onChange,
  allowTransparent,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allowTransparent?: boolean;
}) {
  const isTransparent = value === "transparent" || value === "";
  const hex = toHexColor(isTransparent ? "#ffffff" : value);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-border bg-background p-0.5"
          aria-label={`${label} color`}
        />
        <Input
          value={isTransparent ? "" : value}
          placeholder="#000000"
          onChange={(e) => {
            const next = e.target.value.trim();
            if (!next) {
              if (allowTransparent) onChange("transparent");
              return;
            }
            onChange(next);
          }}
          className="h-8 flex-1 font-mono text-xs"
        />
      </div>
      {allowTransparent && (
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={isTransparent}
            onChange={(e) => {
              if (e.target.checked) onChange("transparent");
              else onChange(hex === "#ffffff" ? "#111827" : hex);
            }}
            className="h-3.5 w-3.5 rounded border-border"
          />
          No fill
        </label>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 border-b border-border px-4 py-3 last:border-b-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Right context panel — controls change with active tool or selection. */
export function EditorPropertiesPanel({
  tool,
  style,
  onStyleChange,
  selectedObject,
  hasCropRect,
  cropAspect,
  onCropAspectChange,
  onApplyCrop,
  onCancelCrop,
  scalePercent,
  onScalePercentChange,
  originalWidth,
  originalHeight,
  onApplyResize,
  onDelete,
  onBringForward,
  onSendBackward,
}: EditorPropertiesPanelProps) {
  const patch = (partial: Partial<EditorStyleState>) => {
    onStyleChange((prev) => ({ ...prev, ...partial }));
  };

  const showBrush = tool === "draw" || tool === "erase";
  const showTextTool = tool === "text";
  const showTextSelected = isTextObject(selectedObject);
  const showShapeSelected = isShapeObject(selectedObject);
  const showObjectActions = selectedObject !== null && tool === "select";
  const showShapeFill =
    (isShapeTool(tool) &&
      tool !== "line" &&
      tool !== "arrow") ||
    (showShapeSelected &&
      selectedObject?.type !== "line" &&
      !isArrowGroup(selectedObject));

  const previewW = Math.round((originalWidth * scalePercent) / 100);
  const previewH = Math.round((originalHeight * scalePercent) / 100);

  return (
    <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-l border-border bg-muted/20">
      {showBrush && (
        <Section title={tool === "erase" ? "Eraser" : "Brush"}>
          {tool === "erase" && (
            <p className="text-xs text-muted-foreground">
              Creates transparent cutouts on the image.
            </p>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Size</Label>
            <Slider
              min={1}
              max={80}
              step={1}
              value={[style.brushSize]}
              onValueChange={([v]) => patch({ brushSize: v ?? 8 })}
            />
            <span className="text-xs tabular-nums text-muted-foreground">
              {style.brushSize}px
            </span>
          </div>
          {tool === "draw" && (
            <>
              <ColorField
                label="Color"
                value={style.brushColor}
                onChange={(v) => patch({ brushColor: v })}
              />
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Opacity</Label>
                <Slider
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={[style.brushOpacity]}
                  onValueChange={([v]) => patch({ brushOpacity: v ?? 1 })}
                />
              </div>
            </>
          )}
        </Section>
      )}

      {(showTextTool || showTextSelected) && (
        <Section title="Text">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Font</Label>
            <Select
              value={style.fontFamily}
              onValueChange={(v) => patch({ fontFamily: v })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[120]">
                {EDITOR_FONTS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Size</Label>
            <Slider
              min={8}
              max={120}
              step={1}
              value={[style.fontSize]}
              onValueChange={([v]) => patch({ fontSize: v ?? 28 })}
            />
            <span className="text-xs tabular-nums text-muted-foreground">
              {style.fontSize}px
            </span>
          </div>
          <ToggleGroup
            type="multiple"
            value={[
              ...(style.fontWeight === "bold" ? ["bold"] : []),
              ...(style.fontStyle === "italic" ? ["italic"] : []),
            ]}
            onValueChange={(vals) => {
              patch({
                fontWeight: vals.includes("bold") ? "bold" : "normal",
                fontStyle: vals.includes("italic") ? "italic" : "normal",
              });
            }}
            className="justify-start"
          >
            <ToggleGroupItem value="bold" aria-label="Bold">
              <Bold className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Italic">
              <Italic className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            type="single"
            value={style.textAlign}
            onValueChange={(v) => {
              if (v) patch({ textAlign: v as EditorStyleState["textAlign"] });
            }}
            className="justify-start"
          >
            <ToggleGroupItem value="left" aria-label="Align left">
              <AlignLeft className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align center">
              <AlignCenter className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align right">
              <AlignRight className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <ColorField
            label="Color"
            value={style.textColor}
            onChange={(v) => patch({ textColor: v })}
          />
        </Section>
      )}

      {(isShapeTool(tool) || showShapeSelected) && (
        <Section title="Shape">
          <ColorField
            label="Stroke"
            value={style.strokeColor}
            onChange={(v) => patch({ strokeColor: v })}
          />
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Stroke width</Label>
            <Slider
              min={1}
              max={24}
              step={1}
              value={[style.strokeWidth]}
              onValueChange={([v]) => patch({ strokeWidth: v ?? 2 })}
            />
          </div>
          {showShapeFill && (
            <ColorField
              label="Fill"
              value={style.fillColor}
              onChange={(v) => patch({ fillColor: v })}
              allowTransparent
            />
          )}
        </Section>
      )}

      {tool === "crop" && (
        <Section title="Crop">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Aspect ratio</Label>
            <Select
              value={cropAspect}
              onValueChange={(v) => onCropAspectChange(v as CropAspect)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[120]">
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="1:1">1:1</SelectItem>
                <SelectItem value="16:9">16:9</SelectItem>
                <SelectItem value="9:16">9:16</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Drag on the canvas to draw a crop region.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="flex-1"
              onClick={onApplyCrop}
              disabled={!hasCropRect}
            >
              Apply
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="flex-1"
              onClick={onCancelCrop}
            >
              Cancel
            </Button>
          </div>
        </Section>
      )}

      {tool === "resize" && (
        <Section title="Resize">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Scale</Label>
            <Slider
              min={25}
              max={200}
              step={5}
              value={[scalePercent]}
              onValueChange={([v]) => onScalePercentChange(v ?? 100)}
            />
            <span className="text-xs tabular-nums text-muted-foreground">
              {scalePercent}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Result: {previewW} × {previewH} px
          </p>
          <Button
            type="button"
            size="sm"
            className="w-full"
            onClick={onApplyResize}
          >
            Apply resize
          </Button>
        </Section>
      )}

      {showObjectActions && (
        <Section title="Selection">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Opacity</Label>
            <Slider
              min={0.1}
              max={1}
              step={0.05}
              value={[style.objectOpacity]}
              onValueChange={([v]) => patch({ objectOpacity: v ?? 1 })}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onBringForward}
            >
              <ArrowUp className="mr-1 h-3.5 w-3.5" />
              Forward
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onSendBackward}
            >
              <ArrowDown className="mr-1 h-3.5 w-3.5" />
              Back
            </Button>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={onDelete}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Delete
          </Button>
          <p className="text-xs text-muted-foreground">
            Press Delete or Backspace to remove selection.
          </p>
        </Section>
      )}

      {!showBrush &&
        !showTextTool &&
        !showTextSelected &&
        !showShapeSelected &&
        tool !== "crop" &&
        tool !== "resize" &&
        !showObjectActions && (
          <div className="px-4 py-6 text-center text-xs text-muted-foreground">
            Select a tool or object to see properties.
          </div>
        )}
    </aside>
  );
}
