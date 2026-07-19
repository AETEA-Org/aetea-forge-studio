import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { editAsset } from "@/services/api";
import { toast } from "sonner";
import { EditorCanvasArea } from "./EditorCanvasArea";
import { EditorPropertiesPanel } from "./EditorPropertiesPanel";
import { EditorToolRail } from "./EditorToolRail";
import { EditorTopBar } from "./EditorTopBar";
import { useFabricEditor } from "./useFabricEditor";
import type { ImageEditorDialogProps, ImageExportFormat } from "./types";

/** Near-fullscreen Fabric.js image editor with tool rail and properties panel. */
export function ImageEditorDialog({
  open,
  onOpenChange,
  assetId,
  imageUrl,
  fileName,
  chatId,
  userEmail,
  campaignId,
  taskId,
}: ImageEditorDialogProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [saveFormat, setSaveFormat] = useState<ImageExportFormat>("png");
  const [saveAsName, setSaveAsName] = useState("edited");

  const editor = useFabricEditor({
    open,
    assetId,
    imageUrl,
    userEmail,
  });

  const invalidateCaches = useCallback(
    (result: {
      mode: string;
      key_visual_updated?: boolean;
      deliverable_id?: string | null;
    }) => {
      void queryClient.invalidateQueries({ queryKey: ["assets", chatId] });
      if (taskId) {
        void queryClient.invalidateQueries({
          queryKey: ["campaign-task-deliverable-objects", taskId, userEmail],
        });
      }
      if (campaignId && (result.mode === "save" || result.key_visual_updated)) {
        void queryClient.invalidateQueries({
          queryKey: ["creative", campaignId, userEmail],
        });
      }
    },
    [queryClient, chatId, taskId, userEmail, campaignId]
  );

  const mimeType =
    saveFormat === "jpeg" ? ("image/jpeg" as const) : ("image/png" as const);

  const handleSave = useCallback(async () => {
    const blob = editor.exportImageBlob(saveFormat);
    if (!blob) return;
    setSaving(true);
    try {
      const result = await editAsset(assetId, userEmail, "save", blob, {
        campaignId,
        mimeType,
      });
      invalidateCaches(result);
      toast.success("Image saved");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [
    editor,
    assetId,
    userEmail,
    campaignId,
    invalidateCaches,
    onOpenChange,
    saveFormat,
    mimeType,
  ]);

  const handleSaveAs = useCallback(async () => {
    const name = saveAsName.trim();
    if (!name) {
      toast.error("Enter a file name");
      return;
    }
    const ext = saveFormat === "jpeg" ? ".jpg" : ".png";
    const finalName = /\.(png|jpe?g)$/i.test(name)
      ? name.replace(/\.(png|jpe?g)$/i, ext)
      : `${name}${ext}`;
    const blob = editor.exportImageBlob(saveFormat);
    if (!blob) return;
    setSaving(true);
    try {
      const result = await editAsset(assetId, userEmail, "save_as", blob, {
        fileName: finalName,
        campaignId,
        mimeType,
      });
      invalidateCaches(result);
      toast.success(
        result.deliverable_id
          ? "Saved as new canvas card"
          : "Saved as new asset"
      );
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save As failed");
    } finally {
      setSaving(false);
    }
  }, [
    saveAsName,
    editor,
    assetId,
    userEmail,
    campaignId,
    invalidateCaches,
    onOpenChange,
    saveFormat,
    mimeType,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        void editor.undo();
      } else if (mod && (e.key === "Z" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        void editor.redo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        const selected = editor.selectedObject;
        if (
          selected &&
          "isEditing" in selected &&
          Boolean(selected.isEditing)
        ) {
          return;
        }
        if (editor.tool === "select" && editor.selectedObject) {
          e.preventDefault();
          editor.deleteSelected();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, editor]);

  useEffect(() => {
    if (!open) {
      setSaveAsOpen(false);
      setSaveFormat("png");
      setSaveAsName(fileName?.replace(/\.[^.]+$/, "") ?? "edited");
    }
  }, [open, fileName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[95vh] w-[98vw] max-w-[98vw] flex-col gap-0 overflow-hidden p-0 outline-none focus:outline-none focus-visible:outline-none"
        hideCloseButton
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement | null;
          if (
            target?.closest(
              "[data-radix-select-content], [data-radix-popper-content-wrapper]"
            )
          ) {
            e.preventDefault();
          }
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <EditorTopBar
          fileName={fileName}
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
          onUndo={() => void editor.undo()}
          onRedo={() => void editor.redo()}
          onCancel={() => onOpenChange(false)}
          onSave={() => void handleSave()}
          onSaveAsConfirm={() => void handleSaveAs()}
          saving={saving}
          ready={editor.ready}
          saveFormat={saveFormat}
          onSaveFormatChange={setSaveFormat}
          saveAsOpen={saveAsOpen}
          onSaveAsOpenChange={setSaveAsOpen}
          saveAsName={saveAsName}
          onSaveAsNameChange={setSaveAsName}
        />

        <div className="flex min-h-0 flex-1">
          <EditorToolRail tool={editor.tool} onToolChange={editor.setTool} />

          <main className="flex min-h-0 min-w-0 flex-1 flex-col p-3">
            <EditorCanvasArea
              hostRef={editor.hostRef}
              textareaContainerRef={editor.textareaContainerRef}
              loading={editor.loading}
              ready={editor.ready}
              canvasWidth={editor.originalWidth}
              canvasHeight={editor.originalHeight}
              zoom={editor.zoom}
              onZoomChange={editor.setZoom}
              tool={editor.tool}
              brushSize={editor.style.brushSize}
              brushColor={editor.style.brushColor}
            />
          </main>

          <EditorPropertiesPanel
            tool={editor.tool}
            style={editor.style}
            onStyleChange={editor.setStyle}
            selectedObject={editor.selectedObject}
            hasCropRect={editor.hasCropRect}
            cropAspect={editor.cropAspect}
            onCropAspectChange={editor.setCropAspect}
            onApplyCrop={() => void editor.applyCrop()}
            onCancelCrop={editor.cancelCrop}
            scalePercent={editor.scalePercent}
            onScalePercentChange={editor.setScalePercent}
            originalWidth={editor.originalWidth}
            originalHeight={editor.originalHeight}
            onApplyResize={editor.applyResize}
            onDelete={editor.deleteSelected}
            onBringForward={editor.bringForward}
            onSendBackward={editor.sendBackward}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
