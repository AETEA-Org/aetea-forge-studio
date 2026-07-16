import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { EditorTool } from "./types";

/**
 * Fabric mutates this node's children. React must never re-render it after mount
 * or it will wipe the canvas and throw insertBefore NotFoundError.
 */
const FabricCanvasHost = memo(
  function FabricCanvasHost({
    hostRef,
  }: {
    hostRef: React.MutableRefObject<HTMLDivElement | null>;
  }) {
    return <div ref={hostRef} />;
  },
  () => true
);

interface EditorCanvasAreaProps {
  hostRef: React.MutableRefObject<HTMLDivElement | null>;
  textareaContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  loading: boolean;
  ready: boolean;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  tool: EditorTool;
  brushSize: number;
  brushColor: string;
}

/** Checkerboard canvas host with zoom controls and brush radius preview. */
export function EditorCanvasArea({
  hostRef,
  textareaContainerRef,
  loading,
  ready,
  canvasWidth,
  canvasHeight,
  zoom,
  onZoomChange,
  tool,
  brushSize,
  brushColor,
}: EditorCanvasAreaProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const showBrushPreview = tool === "draw" || tool === "erase";

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !ready || canvasWidth <= 0 || canvasHeight <= 0) return;

    const computeFit = () => {
      const pad = 48;
      const availW = Math.max(1, el.clientWidth - pad);
      const availH = Math.max(1, el.clientHeight - pad);
      const fit = Math.min(
        100,
        Math.floor(
          Math.min(availW / canvasWidth, availH / canvasHeight) * 100
        )
      );
      onZoomChange(Math.max(10, fit));
    };

    computeFit();
    const ro = new ResizeObserver(computeFit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ready, canvasWidth, canvasHeight, onZoomChange]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!showBrushPreview || !frameRef.current) {
        setCursor(null);
        return;
      }
      const rect = frameRef.current.getBoundingClientRect();
      setCursor({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [showBrushPreview]
  );

  const onMouseLeave = useCallback(() => setCursor(null), []);

  const scale = zoom / 100;
  const previewDiameter = Math.max(4, brushSize * scale);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div
        ref={scrollRef}
        className={cn(
          "relative min-h-0 flex-1 overflow-auto rounded-md border border-border",
          "bg-[length:16px_16px] bg-[position:0_0,8px_8px]",
          "bg-[image:linear-gradient(45deg,#e4e4e7_25%,transparent_25%),linear-gradient(-45deg,#e4e4e7_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e4e4e7_75%),linear-gradient(-45deg,transparent_75%,#e4e4e7_75%)]"
        )}
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <div className="flex min-h-full items-center justify-center p-6">
          <div
            ref={frameRef}
            style={{
              width: canvasWidth * scale,
              height: canvasHeight * scale,
            }}
            className={cn(
              "relative shrink-0 shadow-md outline-none",
              showBrushPreview && "cursor-none"
            )}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                width: canvasWidth,
                height: canvasHeight,
              }}
              className="absolute left-0 top-0 outline-none [&_canvas]:outline-none"
            >
              <FabricCanvasHost hostRef={hostRef} />
            </div>
            {/* Fabric IText mounts its hidden textarea here (inside the dialog
                focus trap). Default is document.body, which Radix Dialog blocks. */}
            <div
              ref={textareaContainerRef}
              className="absolute left-0 top-0 h-0 w-0 overflow-visible"
              aria-hidden
            />
            {showBrushPreview && cursor && (
              <div
                aria-hidden
                className="pointer-events-none absolute rounded-full border-2"
                style={{
                  width: previewDiameter,
                  height: previewDiameter,
                  left: cursor.x - previewDiameter / 2,
                  top: cursor.y - previewDiameter / 2,
                  borderColor: tool === "erase" ? "#ef4444" : brushColor,
                  backgroundColor:
                    tool === "erase"
                      ? "rgba(239,68,68,0.12)"
                      : `${brushColor}22`,
                }}
              />
            )}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 px-1">
        <Label className="w-10 shrink-0 text-xs text-muted-foreground">
          Zoom
        </Label>
        <Slider
          min={25}
          max={200}
          step={5}
          value={[zoom]}
          onValueChange={([v]) => onZoomChange(v ?? 100)}
          className="flex-1"
        />
        <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
          {zoom}%
        </span>
      </div>
    </div>
  );
}
