import type { FabricImage, FabricObject } from "fabric";

export type EditorTool =
  | "select"
  | "draw"
  | "erase"
  | "rect"
  | "ellipse"
  | "line"
  | "text"
  | "crop"
  | "resize";

export type ShapeTool = "rect" | "ellipse" | "line";

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

export function isShapeObject(obj: FabricObject | null): boolean {
  if (!obj) return false;
  const t = (obj.type || "").toLowerCase();
  return t === "rect" || t === "ellipse" || t === "line" || t === "circle";
}
