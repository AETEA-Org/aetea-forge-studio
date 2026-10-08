import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ClampBoxProps {
  children: React.ReactNode;
  /** How tall the box may be before its contents are cut, in pixels. */
  maxHeight: number;
  /** Tailwind `to-` colour the fade resolves to. Must match the surface. */
  fadeClassName: string;
  /** Tailwind colour classes for the More/Less control. */
  linkClassName: string;
  /** Left inset so the control lines up with the text, not the bullet. */
  indentClassName?: string;
  className?: string;
}

/**
 * Content capped at a height, with an inline control to see the rest.
 *
 * Built for the SWOT quadrants, where a 2×2 grid has to give every quadrant an
 * equal box while the content is nothing like equal — on the 2026-10-06 build,
 * 2 strengths against 3 weaknesses, one of them 1,198 characters. Rows stretch
 * to the tallest cell, so three quadrants sat in half-empty boxes.
 *
 * **The cut is a height and nothing else.** An earlier design keyed the layout
 * on each entry's opening sentence as a headline; measured against all 435
 * bullets in the database, only 51% had one, so the layout would have asserted
 * a claim the model never made in half of all cases. This makes no claim about
 * what is above the fold.
 *
 * The control appears only when something is genuinely cut off, measured after
 * layout rather than guessed from a character count — the same text wraps to a
 * different number of lines at a different width, and a dead *More* that opens
 * nothing is the kind of control this work exists to remove. It is re-measured
 * on resize for the same reason.
 */
export function ClampBox({
  children,
  maxHeight,
  fadeClassName,
  linkClassName,
  indentClassName = "",
  className,
}: ClampBoxProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [open, setOpen] = useState(false);

  const measure = useCallback(() => {
    const body = bodyRef.current;
    if (!body) return;
    // Measured against the cap rather than against the live height, which is
    // `auto` once opened and would report no overflow and remove the control
    // the user just used to open it.
    setOverflows(body.scrollHeight > maxHeight + 2);
  }, [maxHeight]);

  useEffect(() => {
    measure();
    const body = bodyRef.current;
    if (!body || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    return () => observer.disconnect();
  }, [measure, children]);

  return (
    <div className={className}>
      <div
        ref={bodyRef}
        className="relative overflow-hidden"
        style={{ maxHeight: open ? undefined : maxHeight }}
      >
        {children}
        {overflows && !open && (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent",
              fadeClassName
            )}
          />
        )}
      </div>
      {overflows && (
        <button
          type="button"
          onClick={() => setOpen((wasOpen) => !wasOpen)}
          className={cn(
            "mt-1.5 text-xs font-semibold hover:underline",
            linkClassName,
            indentClassName
          )}
        >
          {open ? "Less" : "More"}
        </button>
      )}
    </div>
  );
}
