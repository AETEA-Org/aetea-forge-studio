import { useCallback, useEffect, useRef, useState } from "react";
import {
  Canvas,
  Ellipse,
  FabricImage,
  Group,
  IText,
  Line,
  PencilBrush,
  Polygon,
  Rect,
  Triangle,
  type FabricObject,
  type TEvent,
} from "fabric";
import { EraserBrush } from "@erase2d/fabric";
import { fetchAssetContentBlob } from "@/services/api";
import { loadFonts, getFontFamily } from "@/lib/fontUtils";
import { FabricHistory } from "./fabricHistory";
import { flattenCanvas, dataUrlToBlob } from "./flattenCanvas";
import {
  DEFAULT_STYLE,
  EDITOR_FONTS,
  type BgRef,
  type CropAspect,
  type EditorStyleState,
  type EditorTool,
  type ImageExportFormat,
  isArrowGroup,
  isTextObject,
} from "./types";

export interface UseFabricEditorOptions {
  open: boolean;
  assetId: string;
  imageUrl: string;
  fileName?: string | null;
  userEmail: string;
}

export interface UseFabricEditorResult {
  hostRef: React.MutableRefObject<HTMLDivElement | null>;
  /** Mount Fabric's hidden text textarea inside the dialog (not document.body). */
  textareaContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  ready: boolean;
  loading: boolean;
  tool: EditorTool;
  setTool: (tool: EditorTool) => void;
  style: EditorStyleState;
  setStyle: React.Dispatch<React.SetStateAction<EditorStyleState>>;
  selectedObject: FabricObject | null;
  hasCropRect: boolean;
  cropAspect: CropAspect;
  setCropAspect: (aspect: CropAspect) => void;
  zoom: number;
  setZoom: (z: number) => void;
  scalePercent: number;
  setScalePercent: (p: number) => void;
  originalWidth: number;
  originalHeight: number;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  applyCrop: () => Promise<void>;
  cancelCrop: () => void;
  applyResize: () => void;
  deleteSelected: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  exportImageBlob: (format: ImageExportFormat) => Blob | null;
  syncBgRef: () => void;
}

function aspectRatio(aspect: CropAspect): number | null {
  if (aspect === "1:1") return 1;
  if (aspect === "16:9") return 16 / 9;
  if (aspect === "9:16") return 9 / 16;
  return null;
}

const SHAPE_DRAW_TOOLS = new Set<EditorTool>([
  "rect",
  "ellipse",
  "line",
  "triangle",
  "arrow",
]);

function getArrowParts(group: FabricObject): {
  line: Line;
  head: Polygon;
} | null {
  if (!isArrowGroup(group)) return null;
  const items = (group as Group)._objects;
  if (!items || items.length !== 2) return null;
  return { line: items[0] as Line, head: items[1] as Polygon };
}

function buildArrowGroup(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: EditorStyleState
): Group | null {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 4) return null;

  const angle = Math.atan2(dy, dx);
  const headLen = Math.min(16, len * 0.3);
  const headWidth = headLen * 0.6;
  const bx = x2 - headLen * Math.cos(angle);
  const by = y2 - headLen * Math.sin(angle);
  const px = headWidth * Math.cos(angle + Math.PI / 2);
  const py = headWidth * Math.sin(angle + Math.PI / 2);

  const line = new Line([x1, y1, x2, y2], {
    stroke: style.strokeColor,
    strokeWidth: style.strokeWidth,
  });
  const head = new Polygon(
    [
      { x: x2, y: y2 },
      { x: bx + px, y: by + py },
      { x: bx - px, y: by - py },
    ],
    {
      fill: style.strokeColor,
      stroke: style.strokeColor,
      strokeWidth: 1,
    }
  );
  const group = new Group([line, head], {
    opacity: style.objectOpacity,
  });
  return group;
}

/** Imperative Fabric canvas lifecycle + tools for the image editor. */
export function useFabricEditor({
  open,
  assetId,
  imageUrl,
  userEmail,
}: UseFabricEditorOptions): UseFabricEditorResult {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const textareaContainerRef = useRef<HTMLDivElement | null>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const bgRef = useRef<FabricImage | null>(null);
  const historyRef = useRef(new FabricHistory());
  const toolRef = useRef<EditorTool>("select");
  const styleRef = useRef<EditorStyleState>({ ...DEFAULT_STYLE });
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const draftShapeRef = useRef<FabricObject | null>(null);
  const cropRectRef = useRef<Rect | null>(null);
  const cropOverlayRef = useRef<Group | null>(null);
  const flattenedRef = useRef(false);
  const cropAspectRef = useRef<CropAspect>("free");
  const originalDimsRef = useRef({ w: 800, h: 600 });
  /** Skip one style→canvas apply after selection sync (avoids killing text edit). */
  const skipStyleApplyRef = useRef(false);

  const [tool, setToolState] = useState<EditorTool>("select");
  const [style, setStyle] = useState<EditorStyleState>({ ...DEFAULT_STYLE });
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(
    null
  );
  const [hasCropRect, setHasCropRect] = useState(false);
  const [cropAspect, setCropAspectState] = useState<CropAspect>("free");
  const [zoom, setZoom] = useState(100);
  const [scalePercent, setScalePercent] = useState(100);
  const [originalWidth, setOriginalWidth] = useState(800);
  const [originalHeight, setOriginalHeight] = useState(600);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  toolRef.current = tool;
  styleRef.current = style;
  cropAspectRef.current = cropAspect;

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(historyRef.current.canUndo());
    setCanRedo(historyRef.current.canRedo());
  }, []);

  const pushHistory = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    historyRef.current.push(canvas);
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  const syncBgRef = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objs = canvas.getObjects();
    const bg =
      (objs.find((o) => o instanceof FabricImage && !o.selectable) as
        | FabricImage
        | undefined) ??
      (objs[0] instanceof FabricImage ? (objs[0] as FabricImage) : null);
    bgRef.current = bg;
  }, []);

  const markErasable = useCallback((obj: FabricObject) => {
    (obj as FabricObject & { erasable?: boolean }).erasable = true;
  }, []);

  /** Fabric appends its edit textarea to document.body by default — Radix Dialog
   * focus-traps that and kills editing. Keep the textarea inside the dialog. */
  const wireTextEditing = useCallback((text: IText) => {
    text.hiddenTextareaContainer = textareaContainerRef.current;
  }, []);

  const clearCropOverlay = useCallback(() => {
    const canvas = fabricRef.current;
    if (canvas && cropOverlayRef.current) {
      canvas.remove(cropOverlayRef.current);
      cropOverlayRef.current = null;
    }
  }, []);

  const clearCropRect = useCallback(() => {
    const canvas = fabricRef.current;
    if (canvas && cropRectRef.current) {
      canvas.remove(cropRectRef.current);
      cropRectRef.current = null;
    }
    clearCropOverlay();
    setHasCropRect(false);
  }, [clearCropOverlay]);

  const updateCropOverlay = useCallback(() => {
    const canvas = fabricRef.current;
    const crop = cropRectRef.current;
    if (!canvas || !crop) return;
    clearCropOverlay();
    const cw = canvas.getWidth();
    const ch = canvas.getHeight();
    const left = crop.left ?? 0;
    const top = crop.top ?? 0;
    const width = crop.width ?? 0;
    const height = crop.height ?? 0;
    const dim = "rgba(0,0,0,0.45)";
    const common = {
      fill: dim,
      selectable: false,
      evented: false,
      excludeFromExport: true,
    };
    const rects = [
      new Rect({ left: 0, top: 0, width: cw, height: top, ...common }),
      new Rect({
        left: 0,
        top: top + height,
        width: cw,
        height: Math.max(0, ch - top - height),
        ...common,
      }),
      new Rect({ left: 0, top, width: left, height, ...common }),
      new Rect({
        left: left + width,
        top,
        width: Math.max(0, cw - left - width),
        height,
        ...common,
      }),
    ];
    const overlay = new Group(rects, {
      selectable: false,
      evented: false,
      excludeFromExport: true,
    });
    cropOverlayRef.current = overlay;
    canvas.add(overlay);
    canvas.bringObjectToFront(crop);
    canvas.requestRenderAll();
  }, [clearCropOverlay]);

  const applyTool = useCallback(
    async (next: EditorTool, canvas: Canvas) => {
      if (next === "erase" && !flattenedRef.current) {
        await flattenCanvas(canvas, bgRef as BgRef);
        flattenedRef.current = true;
        pushHistory();
      }

      canvas.isDrawingMode = false;
      canvas.selection = next === "select";
      canvas.defaultCursor = "default";
      canvas.freeDrawingCursor = "crosshair";
      const s = styleRef.current;

      canvas.forEachObject((obj) => {
        const isBg = obj === bgRef.current;
        const isCrop = obj === cropRectRef.current;
        const isOverlay = obj === cropOverlayRef.current;
        obj.selectable = next === "select" && !isBg && !isCrop && !isOverlay;
        obj.evented = !isBg && !isOverlay;
      });

      if (next === "draw") {
        const brush = new PencilBrush(canvas);
        brush.width = s.brushSize;
        brush.color = s.brushColor;
        canvas.freeDrawingBrush = brush;
        canvas.isDrawingMode = true;
        canvas.freeDrawingCursor = "none";
        canvas.defaultCursor = "none";
        canvas.hoverCursor = "none";
      } else if (next === "erase") {
        const eraser = new EraserBrush(canvas);
        eraser.width = s.brushSize;
        canvas.freeDrawingBrush = eraser;
        canvas.isDrawingMode = true;
        canvas.forEachObject((obj) => markErasable(obj));
        canvas.freeDrawingCursor = "none";
        canvas.defaultCursor = "none";
        canvas.hoverCursor = "none";
      } else if (
        next === "text" ||
        next === "rect" ||
        next === "ellipse" ||
        next === "line" ||
        next === "triangle" ||
        next === "arrow" ||
        next === "crop"
      ) {
        canvas.defaultCursor = "crosshair";
        canvas.hoverCursor = "crosshair";
      } else {
        canvas.hoverCursor = "move";
      }
      canvas.requestRenderAll();
    },
    [markErasable, pushHistory]
  );

  const setTool = useCallback(
    (next: EditorTool) => {
      if (next !== "crop") clearCropRect();
      setToolState(next);
      const canvas = fabricRef.current;
      if (canvas && ready) {
        void applyTool(next, canvas);
      }
    },
    [applyTool, clearCropRect, ready]
  );

  // Mount / teardown Fabric canvas
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    let canvas: Canvas | null = null;
    let objectUrl: string | null = null;

    const waitForHost = async (): Promise<HTMLDivElement | null> => {
      for (let i = 0; i < 30; i += 1) {
        if (cancelled) return null;
        const host = hostRef.current;
        if (host) return host;
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
      }
      return hostRef.current;
    };

    const init = async () => {
      setLoading(true);
      setReady(false);
      setToolState("select");
      flattenedRef.current = false;
      clearCropRect();

      await loadFonts([...EDITOR_FONTS], [400, 600, 700]);

      const host = await waitForHost();
      if (!host || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }

      host.replaceChildren();
      const el = document.createElement("canvas");
      host.appendChild(el);

      canvas = new Canvas(el, {
        preserveObjectStacking: true,
        selection: true,
        backgroundColor: "",
      });
      fabricRef.current = canvas;

      const onPathCreated = (opt: { path?: FabricObject }) => {
        if (opt.path) {
          markErasable(opt.path);
          opt.path.set({ opacity: styleRef.current.brushOpacity });
        }
        pushHistory();
      };

      const onObjectModified = () => pushHistory();

      const onSelection = () => {
        const active = canvas!.getActiveObject() ?? null;
        if (active && active !== bgRef.current && active !== cropRectRef.current) {
          skipStyleApplyRef.current = true;
          setSelectedObject(active);
          // Sync panel from object without pushing those values back onto it
          if (isTextObject(active)) {
            const rawFamily =
              (active.fontFamily as string)
                ?.split(",")[0]
                ?.replace(/['"]/g, "")
                .trim() ?? "";
            const knownFamily = EDITOR_FONTS.find(
              (f) => f.toLowerCase() === rawFamily.toLowerCase()
            );
            setStyle((prev) => ({
              ...prev,
              fontSize: (active.fontSize as number) ?? prev.fontSize,
              fontFamily: knownFamily ?? prev.fontFamily,
              fontWeight: active.fontWeight === "bold" ? "bold" : "normal",
              fontStyle: active.fontStyle === "italic" ? "italic" : "normal",
              textAlign:
                (active.textAlign as "left" | "center" | "right") ??
                prev.textAlign,
              textColor: (active.fill as string) || prev.textColor,
              objectOpacity: active.opacity ?? prev.objectOpacity,
            }));
          } else if (
            active.type === "rect" ||
            active.type === "ellipse" ||
            active.type === "line" ||
            active.type === "circle" ||
            active.type === "triangle" ||
            active.type === "polygon" ||
            isArrowGroup(active)
          ) {
            const strokeSource = isArrowGroup(active)
              ? getArrowParts(active)?.line
              : active;
            setStyle((prev) => ({
              ...prev,
              strokeColor:
                (strokeSource?.stroke as string) || prev.strokeColor,
              strokeWidth:
                (strokeSource?.strokeWidth as number) ?? prev.strokeWidth,
              fillColor:
                active.type === "line" || isArrowGroup(active)
                  ? prev.fillColor
                  : !active.fill || active.fill === ""
                    ? "transparent"
                    : (active.fill as string),
              objectOpacity: active.opacity ?? prev.objectOpacity,
            }));
          } else if (active.type === "path") {
            setStyle((prev) => ({
              ...prev,
              brushColor: (active.stroke as string) || prev.brushColor,
              objectOpacity: active.opacity ?? prev.objectOpacity,
            }));
          } else {
            setStyle((prev) => ({
              ...prev,
              objectOpacity: active.opacity ?? prev.objectOpacity,
            }));
          }
        } else {
          setSelectedObject(null);
        }
      };

      const onSelectionCleared = () => setSelectedObject(null);

      const onTextEditingExited = () => {
        pushHistory();
        if (toolRef.current !== "select") {
          setToolState("select");
          void applyTool("select", canvas!);
        }
      };

      const onMouseDown = (opt: TEvent) => {
        const current = toolRef.current;
        const pointer = canvas!.getScenePoint(opt.e);
        const s = styleRef.current;

        if (current === "text") {
          const text = new IText("Text", {
            left: pointer.x,
            top: pointer.y,
            fontSize: s.fontSize,
            fill: s.textColor,
            fontFamily: getFontFamily(s.fontFamily),
            fontWeight: s.fontWeight,
            fontStyle: s.fontStyle,
            textAlign: s.textAlign,
            editable: true,
          });
          wireTextEditing(text);
          markErasable(text);
          canvas!.add(text);
          // Enter select mode so the object stays selectable, then start
          // editing on the next frame so the caret can take focus inside
          // the dialog (see wireTextEditing / hiddenTextareaContainer).
          setToolState("select");
          void applyTool("select", canvas!).then(() => {
            requestAnimationFrame(() => {
              if (!fabricRef.current) return;
              wireTextEditing(text);
              skipStyleApplyRef.current = true;
              canvas!.setActiveObject(text);
              text.enterEditing();
              text.selectAll();
              canvas!.requestRenderAll();
              pushHistory();
            });
          });
          return;
        }

        if (
          SHAPE_DRAW_TOOLS.has(current) ||
          current === "crop"
        ) {
          drawStartRef.current = { x: pointer.x, y: pointer.y };
          if (current === "crop") {
            clearCropRect();
            const crop = new Rect({
              left: pointer.x,
              top: pointer.y,
              width: 1,
              height: 1,
              fill: "rgba(37, 99, 235, 0.12)",
              stroke: "#2563eb",
              strokeWidth: 2,
              strokeDashArray: [6, 4],
              selectable: false,
              evented: false,
            });
            cropRectRef.current = crop;
            canvas!.add(crop);
            setHasCropRect(true);
            updateCropOverlay();
          } else {
            const common = {
              stroke: s.strokeColor,
              strokeWidth: s.strokeWidth,
              opacity: s.objectOpacity,
            };
            let shape: FabricObject;
            if (current === "rect") {
              shape = new Rect({
                left: pointer.x,
                top: pointer.y,
                width: 1,
                height: 1,
                fill: s.fillColor === "transparent" ? "transparent" : s.fillColor,
                ...common,
              });
            } else if (current === "ellipse") {
              shape = new Ellipse({
                left: pointer.x,
                top: pointer.y,
                rx: 1,
                ry: 1,
                fill: s.fillColor === "transparent" ? "transparent" : s.fillColor,
                ...common,
              });
            } else if (current === "triangle") {
              shape = new Triangle({
                left: pointer.x,
                top: pointer.y,
                width: 1,
                height: 1,
                fill: s.fillColor === "transparent" ? "transparent" : s.fillColor,
                ...common,
              });
            } else {
              shape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                ...common,
              });
            }
            markErasable(shape);
            draftShapeRef.current = shape;
            canvas!.add(shape);
          }
        }
      };

      const onMouseMove = (opt: TEvent) => {
        const start = drawStartRef.current;
        if (!start || !canvas) return;
        const pointer = canvas.getScenePoint(opt.e);
        const current = toolRef.current;
        let w = pointer.x - start.x;
        let h = pointer.y - start.y;
        const ratio = aspectRatio(cropAspectRef.current);

        if (current === "crop" && cropRectRef.current) {
          if (ratio) {
            if (Math.abs(w) > Math.abs(h) * ratio) {
              h = Math.sign(h || 1) * Math.abs(w) / ratio;
            } else {
              w = Math.sign(w || 1) * Math.abs(h) * ratio;
            }
          }
          const crop = cropRectRef.current;
          crop.set({
            left: Math.min(start.x, start.x + w),
            top: Math.min(start.y, start.y + h),
            width: Math.max(1, Math.abs(w)),
            height: Math.max(1, Math.abs(h)),
          });
          updateCropOverlay();
          canvas.requestRenderAll();
          return;
        }

        const draft = draftShapeRef.current;
        if (!draft) return;
        if (current === "rect") {
          draft.set({
            left: Math.min(start.x, pointer.x),
            top: Math.min(start.y, pointer.y),
            width: Math.max(1, Math.abs(w)),
            height: Math.max(1, Math.abs(h)),
          });
        } else if (current === "ellipse") {
          (draft as Ellipse).set({
            left: Math.min(start.x, pointer.x),
            top: Math.min(start.y, pointer.y),
            rx: Math.max(1, Math.abs(w) / 2),
            ry: Math.max(1, Math.abs(h) / 2),
          });
        } else if (current === "triangle") {
          draft.set({
            left: Math.min(start.x, pointer.x),
            top: Math.min(start.y, pointer.y),
            width: Math.max(1, Math.abs(w)),
            height: Math.max(1, Math.abs(h)),
          });
        } else if (current === "line" || current === "arrow") {
          (draft as Line).set({ x2: pointer.x, y2: pointer.y });
        }
        canvas.requestRenderAll();
      };

      const onMouseUp = () => {
        drawStartRef.current = null;
        let draft = draftShapeRef.current;
        if (draft && canvas) {
          draftShapeRef.current = null;
          const current = toolRef.current;
          if (current === "arrow" && draft instanceof Line) {
            const line = draft;
            const x1 = line.x1 ?? 0;
            const y1 = line.y1 ?? 0;
            const x2 = line.x2 ?? 0;
            const y2 = line.y2 ?? 0;
            canvas.remove(line);
            const arrow = buildArrowGroup(
              x1,
              y1,
              x2,
              y2,
              styleRef.current
            );
            if (!arrow) {
              canvas.requestRenderAll();
              return;
            }
            markErasable(arrow);
            canvas.add(arrow);
            draft = arrow;
          }
          if (SHAPE_DRAW_TOOLS.has(current)) {
            setToolState("select");
            void applyTool("select", canvas);
            canvas.setActiveObject(draft);
            pushHistory();
          }
        }
      };

      canvas.on("path:created", onPathCreated);
      canvas.on("object:modified", onObjectModified);
      canvas.on("object:removed", onObjectModified);
      canvas.on("object:added", (opt: { target?: FabricObject }) => {
        if (opt.target instanceof IText) {
          wireTextEditing(opt.target);
        }
      });
      canvas.on("selection:created", onSelection);
      canvas.on("selection:updated", onSelection);
      canvas.on("selection:cleared", onSelectionCleared);
      canvas.on("text:editing:exited", onTextEditingExited);
      canvas.on("mouse:down", onMouseDown);
      canvas.on("mouse:move", onMouseMove);
      canvas.on("mouse:up", onMouseUp);

      try {
        let blob: Blob;
        try {
          blob = await fetchAssetContentBlob(assetId, userEmail);
        } catch {
          const res = await fetch(imageUrl);
          if (!res.ok) throw new Error(`Failed to load image (${res.status})`);
          blob = await res.blob();
        }
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        const img = await FabricImage.fromURL(objectUrl);
        if (cancelled) {
          img.dispose();
          return;
        }
        const w = img.width || 800;
        const h = img.height || 600;
        originalDimsRef.current = { w, h };
        setOriginalWidth(Math.round(w));
        setOriginalHeight(Math.round(h));
        setScalePercent(100);
        canvas.setDimensions({ width: w, height: h });
        img.set({
          left: 0,
          top: 0,
          selectable: false,
          evented: false,
          erasable: true,
        } as Partial<FabricImage> & { erasable?: boolean });
        canvas.add(img);
        canvas.sendObjectToBack(img);
        bgRef.current = img;
        await applyTool("select", canvas);
        historyRef.current.reset(canvas);
        syncHistoryFlags();
        setReady(true);
      } catch {
        // caller shows toast via loading state
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void init();

    return () => {
      cancelled = true;
      clearCropRect();
      if (canvas) canvas.dispose();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      fabricRef.current = null;
      bgRef.current = null;
      draftShapeRef.current = null;
      flattenedRef.current = false;
      if (hostRef.current) hostRef.current.replaceChildren();
      setReady(false);
      setSelectedObject(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, assetId, userEmail, imageUrl]);

  // Re-apply tool when tool changes, or when brush props change while drawing
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !ready) return;
    const active = canvas.getActiveObject();
    if (
      active &&
      isTextObject(active) &&
      "isEditing" in active &&
      Boolean(active.isEditing)
    ) {
      return;
    }
    void applyTool(tool, canvas);
  }, [tool, ready, applyTool]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !ready) return;
    if (tool !== "draw" && tool !== "erase") return;
    void applyTool(tool, canvas);
  }, [
    style.brushSize,
    style.brushColor,
    style.brushOpacity,
    tool,
    ready,
    applyTool,
  ]);

  // Apply style to selected object when style state changes
  useEffect(() => {
    const canvas = fabricRef.current;
    const obj = selectedObject;
    if (!canvas || !obj || obj === bgRef.current) return;
    if (skipStyleApplyRef.current) {
      skipStyleApplyRef.current = false;
      return;
    }

    if (isTextObject(obj)) {
      obj.set({
        fontSize: style.fontSize,
        fontFamily: getFontFamily(style.fontFamily),
        fontWeight: style.fontWeight,
        fontStyle: style.fontStyle,
        textAlign: style.textAlign,
        fill: style.textColor,
        opacity: style.objectOpacity,
      });
    } else if (obj.type === "path") {
      obj.set({ stroke: style.brushColor, opacity: style.objectOpacity });
    } else if (isArrowGroup(obj)) {
      const parts = getArrowParts(obj);
      if (parts) {
        parts.line.set({
          stroke: style.strokeColor,
          strokeWidth: style.strokeWidth,
        });
        parts.head.set({
          fill: style.strokeColor,
          stroke: style.strokeColor,
        });
      }
      obj.set({ opacity: style.objectOpacity });
    } else {
      obj.set({
        stroke: style.strokeColor,
        strokeWidth: style.strokeWidth,
        fill:
          style.fillColor === "transparent" ? "transparent" : style.fillColor,
        opacity: style.objectOpacity,
      });
    }
    if (!(isTextObject(obj) && "isEditing" in obj && obj.isEditing)) {
      obj.setCoords();
    }
    canvas.requestRenderAll();
  }, [style, selectedObject]);

  const undo = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const ok = await historyRef.current.undo(canvas);
    if (ok) {
      syncBgRef();
      canvas.getObjects().forEach((obj) => {
        if (obj instanceof IText) wireTextEditing(obj);
      });
      syncHistoryFlags();
      setSelectedObject(null);
    }
  }, [syncBgRef, syncHistoryFlags, wireTextEditing]);

  const redo = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const ok = await historyRef.current.redo(canvas);
    if (ok) {
      syncBgRef();
      canvas.getObjects().forEach((obj) => {
        if (obj instanceof IText) wireTextEditing(obj);
      });
      syncHistoryFlags();
      setSelectedObject(null);
    }
  }, [syncBgRef, syncHistoryFlags, wireTextEditing]);

  const applyCrop = useCallback(async () => {
    const canvas = fabricRef.current;
    const crop = cropRectRef.current;
    if (!canvas || !crop) return;
    const left = crop.left ?? 0;
    const top = crop.top ?? 0;
    const width = Math.max(1, crop.width ?? 1);
    const height = Math.max(1, crop.height ?? 1);
    clearCropRect();
    const dataUrl = canvas.toDataURL({
      format: "png",
      multiplier: 1,
      left,
      top,
      width,
      height,
    });
    const cropped = await FabricImage.fromURL(dataUrl);
    canvas.clear();
    canvas.backgroundColor = "";
    canvas.setDimensions({ width, height });
    cropped.set({
      left: 0,
      top: 0,
      selectable: false,
      evented: false,
      erasable: true,
    } as Partial<FabricImage> & { erasable?: boolean });
    canvas.add(cropped);
    bgRef.current = cropped;
    flattenedRef.current = true;
    originalDimsRef.current = { w: width, h: height };
    setOriginalWidth(Math.round(width));
    setOriginalHeight(Math.round(height));
    setScalePercent(100);
    setToolState("select");
    await applyTool("select", canvas);
    pushHistory();
    canvas.requestRenderAll();
  }, [applyTool, clearCropRect, pushHistory]);

  const cancelCrop = useCallback(() => {
    clearCropRect();
    setToolState("select");
    const canvas = fabricRef.current;
    if (canvas) void applyTool("select", canvas);
  }, [applyTool, clearCropRect]);

  const applyResize = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const orig = originalDimsRef.current;
    const nextW = Math.max(1, Math.round((orig.w * scalePercent) / 100));
    const nextH = Math.max(1, Math.round((orig.h * scalePercent) / 100));
    const prevW = canvas.getWidth() || 1;
    const prevH = canvas.getHeight() || 1;
    const scaleX = nextW / prevW;
    const scaleY = nextH / prevH;
    canvas.getObjects().forEach((obj) => {
      obj.scaleX = (obj.scaleX ?? 1) * scaleX;
      obj.scaleY = (obj.scaleY ?? 1) * scaleY;
      obj.left = (obj.left ?? 0) * scaleX;
      obj.top = (obj.top ?? 0) * scaleY;
      obj.setCoords();
    });
    canvas.setDimensions({ width: nextW, height: nextH });
    originalDimsRef.current = { w: nextW, h: nextH };
    setOriginalWidth(nextW);
    setOriginalHeight(nextH);
    setScalePercent(100);
    pushHistory();
    canvas.requestRenderAll();
  }, [scalePercent, pushHistory]);

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj || obj === bgRef.current) return;
    canvas.remove(obj);
    canvas.discardActiveObject();
    setSelectedObject(null);
    pushHistory();
    canvas.requestRenderAll();
  }, [pushHistory]);

  const bringForward = useCallback(() => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj || obj === bgRef.current) return;
    canvas.bringObjectForward(obj);
    pushHistory();
    canvas.requestRenderAll();
  }, [pushHistory]);

  const sendBackward = useCallback(() => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj || obj === bgRef.current) return;
    canvas.sendObjectBackwards(obj);
    pushHistory();
    canvas.requestRenderAll();
  }, [pushHistory]);

  const exportImageBlob = useCallback(
    (format: ImageExportFormat): Blob | null => {
      const canvas = fabricRef.current;
      if (!canvas) return null;
      clearCropRect();
      const prevBg = canvas.backgroundColor;
      if (format === "jpeg") {
        canvas.backgroundColor = "#ffffff";
        canvas.requestRenderAll();
      }
      const dataUrl = canvas.toDataURL({
        format,
        quality: format === "jpeg" ? 0.92 : undefined,
        multiplier: 1,
      });
      if (format === "jpeg") {
        canvas.backgroundColor = prevBg ?? "";
        canvas.requestRenderAll();
      }
      return dataUrlToBlob(dataUrl);
    },
    [clearCropRect]
  );

  const setCropAspect = useCallback((aspect: CropAspect) => {
    setCropAspectState(aspect);
    cropAspectRef.current = aspect;
  }, []);

  return {
    hostRef,
    textareaContainerRef,
    ready,
    loading,
    tool,
    setTool,
    style,
    setStyle,
    selectedObject,
    hasCropRect,
    cropAspect,
    setCropAspect,
    zoom,
    setZoom,
    scalePercent,
    setScalePercent,
    originalWidth,
    originalHeight,
    canUndo,
    canRedo,
    undo,
    redo,
    applyCrop,
    cancelCrop,
    applyResize,
    deleteSelected,
    bringForward,
    sendBackward,
    exportImageBlob,
    syncBgRef,
  };
}
