import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PptxViewer } from "@aiden0z/pptx-renderer";

/** Soft ceiling so a huge deck or brief cannot freeze the canvas. */
export const OFFICE_PREVIEW_MAX_BYTES = 20 * 1024 * 1024;

class PreviewTooLargeError extends Error {
  constructor() {
    super("Preview exceeds size limit");
    this.name = "PreviewTooLargeError";
  }
}

export type OfficeKind = "docx" | "pptx";
export type OfficePreviewMode = "card" | "reader";
export type OfficeZoom = "fit" | "100" | "150";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; reason: "too_large" | "failed" };

interface OfficePreviewProps {
  url: string;
  kind: OfficeKind;
  mode: OfficePreviewMode;
  /** Reader zoom. Cards always fit the first page or slide into the card. */
  zoom?: OfficeZoom;
  /** Increments on every zoom click, including a click on the zoom already selected. */
  zoomEpoch?: number;
  /** When false, do not fetch or render (e.g. dialog closed). */
  enabled?: boolean;
  className?: string;
}

/**
 * Draws a Word or PowerPoint file from its signed URL.
 * Card mode shows page/slide 1 only. Reader mode shows the whole file.
 * The original bytes are never written back to storage.
 */
export function OfficePreview({
  url,
  kind,
  mode,
  zoom = "fit",
  zoomEpoch = 0,
  enabled = true,
  className,
}: OfficePreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pptxRef = useRef<PptxViewer | null>(null);
  const pptxGen = useRef(0);
  const [state, setState] = useState<LoadState>({ status: "idle" });

  useEffect(() => {
    if (!enabled || !url) {
      setState({ status: "idle" });
      return;
    }

    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let viewer: PptxViewer | undefined;
    let dispose: (() => void) | undefined;
    const abort = new AbortController();

    setState({ status: "loading" });
    host.replaceChildren();
    pptxRef.current = null;

    (async () => {
      try {
        const response = await fetch(url, { signal: abort.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const buffer = await readCapped(response);
        if (cancelled) return;

        if (kind === "docx") {
          // Render off the live card so a late finish cannot paint into the
          // next file after this effect has already been cleaned up.
          const sandbox = document.createElement("div");
          sandbox.style.width = "100%";
          sandbox.style.height = mode === "card" ? "100%" : "auto";
          const discard = await renderDocx(sandbox, buffer, mode);
          if (cancelled) {
            discard();
            return;
          }
          host.replaceChildren(sandbox);
          dispose = () => {
            discard();
            if (host.contains(sandbox)) sandbox.remove();
          };
        } else {
          const started = await mountPptx(host, buffer, mode, abort.signal);
          viewer = started.viewer;
          if (cancelled) {
            started.dispose();
            return;
          }
          pptxRef.current = started.viewer;
          dispose = started.dispose;
        }

        if (!cancelled) setState({ status: "ready" });
      } catch (err) {
        viewer?.destroy();
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        if (!cancelled) {
          setState({
            status: "error",
            reason: err instanceof PreviewTooLargeError ? "too_large" : "failed",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      abort.abort();
      viewer?.destroy();
      dispose?.();
      pptxRef.current = null;
      host.replaceChildren();
    };
  }, [url, kind, mode, enabled]);

  // Apply the zoom that is current once the file is on screen, and again
  // when the same button is clicked. An older apply bails if a newer one started.
  useEffect(() => {
    if (mode !== "reader" || state.status !== "ready") return;
    const host = hostRef.current;
    if (!host) return;

    if (kind === "docx") {
      const sandbox = host.firstElementChild as HTMLElement | null;
      if (!sandbox) return;
      const apply = () => layoutDocx(sandbox, zoom);
      apply();
      const scroller = host.parentElement;
      if (!scroller) return;
      const observer = new ResizeObserver(apply);
      observer.observe(scroller);
      return () => observer.disconnect();
    }

    const viewer = pptxRef.current;
    if (kind !== "pptx" || !viewer) return;
    const gen = ++pptxGen.current;
    void applyPptxZoom(viewer, zoom, () => gen !== pptxGen.current);
  }, [zoom, zoomEpoch, kind, mode, state.status]);

  return (
    <div
      className={cn(
        "relative h-full w-full min-h-0",
        mode === "card" && "overflow-hidden pointer-events-none",
        mode === "reader" && "overflow-auto",
        className
      )}
    >
      {(state.status === "loading" || state.status === "idle") && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      {state.status === "error" && (
        <p className="absolute inset-0 z-10 flex items-center justify-center p-4 text-center text-sm text-muted-foreground">
          {state.reason === "too_large"
            ? "This file is too large to preview here. Use Download to open it."
            : "Preview unavailable. Use Download to open it."}
        </p>
      )}
      <div
        ref={hostRef}
        className={cn(
          "office-preview-host w-full",
          mode === "card" ? "h-full office-preview-card" : "office-preview-reader",
          state.status !== "ready" && "invisible"
        )}
      />
    </div>
  );
}

/** Read the body in chunks and stop once it passes the preview ceiling. */
async function readCapped(response: Response): Promise<ArrayBuffer> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > OFFICE_PREVIEW_MAX_BYTES) {
    await response.body?.cancel();
    throw new PreviewTooLargeError();
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > OFFICE_PREVIEW_MAX_BYTES) {
      throw new PreviewTooLargeError();
    }
    return buffer;
  }

  const chunks: BlobPart[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    received += value.byteLength;
    if (received > OFFICE_PREVIEW_MAX_BYTES) {
      await reader.cancel();
      throw new PreviewTooLargeError();
    }
    chunks.push(value);
  }

  return new Blob(chunks).arrayBuffer();
}

async function applyPptxZoom(
  viewer: PptxViewer,
  zoom: OfficeZoom,
  stale: () => boolean
): Promise<void> {
  if (stale()) return;
  if (zoom === "fit") {
    await viewer.setFitMode("contain");
    if (stale()) return;
    await viewer.setZoom(100);
    return;
  }
  await viewer.setFitMode("none");
  if (stale()) return;
  await viewer.setZoom(zoom === "150" ? 150 : 100);
}

/**
 * Scale a rendered Word document from the top left and size the box to the
 * painted pages. A center origin paints the page outside that box, and
 * overflow then cuts off the sides.
 */
function layoutDocx(sandbox: HTMLElement, zoom: OfficeZoom) {
  const wrapper = sandbox.querySelector(".aetea-docx-wrapper") as HTMLElement | null;
  if (!wrapper) return;

  let naturalWidth = Number(sandbox.dataset.pageWidth);
  let naturalHeight = Number(sandbox.dataset.pageHeight);
  if (!naturalWidth || !naturalHeight) {
    wrapper.style.transform = "none";
    wrapper.style.margin = "0";
    const page = wrapper.querySelector("section.aetea-docx") as HTMLElement | null;
    naturalWidth = page?.offsetWidth || wrapper.offsetWidth;
    wrapper.style.width = `${naturalWidth}px`;
    naturalHeight = wrapper.offsetHeight;
    if (!naturalWidth || !naturalHeight) return;
    sandbox.dataset.pageWidth = String(naturalWidth);
    sandbox.dataset.pageHeight = String(naturalHeight);
  }

  const scroller = sandbox.parentElement?.parentElement;
  const avail = Math.max((scroller?.clientWidth ?? naturalWidth) - 2, 1);
  const scale = zoom === "150" ? 1.5 : zoom === "100" ? 1 : avail / naturalWidth;

  wrapper.style.width = `${naturalWidth}px`;
  wrapper.style.margin = "0";
  wrapper.style.transformOrigin = "top left";
  wrapper.style.transform = `scale(${scale})`;
  sandbox.style.overflow = "hidden";
  sandbox.style.margin = "0";
  sandbox.style.width = `${naturalWidth * scale}px`;
  sandbox.style.height = `${naturalHeight * scale}px`;
  sandbox.dataset.zoomScale = String(scale);
}

async function renderDocx(
  host: HTMLDivElement,
  buffer: ArrayBuffer,
  mode: OfficePreviewMode
): Promise<() => void> {
  const { renderAsync } = await import("docx-preview");
  await renderAsync(buffer, host, undefined, {
    className: "aetea-docx",
    inWrapper: true,
    breakPages: true,
    ignoreWidth: mode === "card",
    ignoreHeight: mode === "card",
    renderHeaders: true,
    renderFooters: true,
    renderFootnotes: true,
    renderEndnotes: true,
    useBase64URL: true,
  });

  if (mode === "card") {
    // Card only needs page 1 — drop the rest so the canvas stays light.
    const pages = host.querySelectorAll(".aetea-docx-wrapper > section.aetea-docx");
    pages.forEach((page, index) => {
      if (index > 0) page.remove();
    });
  }

  return () => {
    host.replaceChildren();
  };
}

async function mountPptx(
  host: HTMLDivElement,
  buffer: ArrayBuffer,
  mode: OfficePreviewMode,
  signal: AbortSignal
): Promise<{ viewer: PptxViewer; dispose: () => void }> {
  const { PptxViewer, RECOMMENDED_ZIP_LIMITS } = await import(
    "@aiden0z/pptx-renderer"
  );
  // Own element so destroy() clears this deck only, not the next file's host.
  const sandbox = document.createElement("div");
  sandbox.style.width = "100%";
  sandbox.style.height = mode === "card" ? "100%" : "auto";
  host.appendChild(sandbox);
  const viewer = new PptxViewer(sandbox, {
    fitMode: "contain",
    zipLimits: RECOMMENDED_ZIP_LIMITS,
    pdfjs: false,
  });
  try {
    await viewer.open(buffer, {
      signal,
      renderMode: mode === "card" ? "slide" : "list",
      listOptions: mode === "reader" ? { windowed: true, batchSize: 4 } : undefined,
      lazyMedia: mode === "reader",
      lazySlides: mode === "reader",
    });
  } catch (err) {
    viewer.destroy();
    sandbox.remove();
    throw err;
  }

  return {
    viewer,
    dispose: () => {
      viewer.destroy();
      sandbox.remove();
    },
  };
}
