import type { FabricImage, FabricObject } from "fabric";

export type ShapeTool = "rect" | "ellipse" | "line" | "triangle" | "arrow";

export type EditorTool =
  | "select"
  | "draw"
  | "erase"
  | ShapeTool
  | "text"
  | "crop"
  | "resize";

export type ImageExportFormat = "png" | "jpeg";

export const SHAPE_TOOLS: ShapeTool[] = [
  "rect",
  "ellipse",
  "line",
  "triangle",
  "arrow",
];

export function isShapeTool(tool: EditorTool): tool is ShapeTool {
  return (SHAPE_TOOLS as readonly string[]).includes(tool);
}

export type CropAspect = "free" | "1:1" | "16:9" | "9:16";

export interface EditorStyleState {
  brushSize: number;
  brushColor: string;
  brushOpacity: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textAlign: "left" | "center" | "right";
  textColor: string;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  objectOpacity: number;
}

export const DEFAULT_STYLE: EditorStyleState = {
  brushSize: 8,
  brushColor: "#111827",
  brushOpacity: 1,
  fontSize: 28,
  fontFamily: "Inter",
  fontWeight: "normal",
  fontStyle: "normal",
  textAlign: "left",
  textColor: "#111827",
  strokeColor: "#111827",
  fillColor: "transparent",
  strokeWidth: 2,
  objectOpacity: 1,
};

export const EDITOR_FONTS = [
  "Inter",
  "Syne",
  "Roboto",
  "Open Sans",
  "Montserrat",
  "Playfair Display",
  "Lato",
  "Poppins",
  "Oswald",
  "Raleway",
  "Nunito",
  "Source Sans 3",
  "Merriweather",
  "Roboto Slab",
  "Bebas Neue",
  "DM Sans",
  "Space Grotesk",
  "Libre Baskerville",
] as const;

export interface ImageEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  imageUrl: string;
  fileName?: string | null;
  chatId: string;
  userEmail: string;
  campaignId?: string;
  taskId?: string;
}

export type BgRef = { current: FabricImage | null };

export function isTextObject(obj: FabricObject | null): obj is FabricObject & {
  type: "i-text" | "text" | "textbox";
} {
  if (!obj) return false;
  const t = (obj.type || "").toLowerCase();
  return t === "i-text" || t === "text" || t === "textbox";
}

export function isArrowGroup(obj: FabricObject | null): boolean {
  if (!obj || (obj.type || "").toLowerCase() !== "group") return false;
  const items = (obj as FabricObject & { _objects?: FabricObject[] })._objects;
  if (!items || items.length !== 2) return false;
  const types = items.map((item) => (item.type || "").toLowerCase());
  return types[0] === "line" && types[1] === "polygon";
}

export function isShapeObject(obj: FabricObject | null): boolean {
  if (!obj) return false;
  const t = (obj.type || "").toLowerCase();
  return (
    t === "rect" ||
    t === "ellipse" ||
    t === "line" ||
    t === "circle" ||
    t === "triangle" ||
    t === "polygon" ||
    isArrowGroup(obj)
  );
}
