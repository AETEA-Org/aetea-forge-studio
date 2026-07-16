import { FabricImage, type Canvas } from "fabric";
import type { BgRef } from "./types";

/** Merge all canvas objects into a single background image. */
export async function flattenCanvas(
  canvas: Canvas,
  bgRef: BgRef
): Promise<void> {
  const w = canvas.getWidth();
  const h = canvas.getHeight();
  const dataUrl = canvas.toDataURL({
    format: "png",
    multiplier: 1,
    left: 0,
    top: 0,
    width: w,
    height: h,
  });
  const img = await FabricImage.fromURL(dataUrl);
  canvas.clear();
  canvas.backgroundColor = "";
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
  canvas.requestRenderAll();
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header?.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(data ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}
