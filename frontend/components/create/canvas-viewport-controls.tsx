"use client";

/**
 * canvas-viewport-controls.tsx
 *
 * Compact zoom/pan toolbar rendered below the workspace mode selector.
 * Displays:  −  75%  +  Fit
 *
 * All interactions are viewport-only: no document data is modified.
 */

import type { ViewportControls } from "./use-viewport";
import { ZOOM_MAX, ZOOM_MIN } from "./use-viewport";

interface CanvasViewportControlsProps {
  viewport: ViewportControls;
  onFit: () => void;
}

export function CanvasViewportControls({ viewport, onFit }: CanvasViewportControlsProps) {
  const { state, zoomOut, zoomIn } = viewport;
  const pct = Math.round(state.zoom * 100);

  return (
    <div
      role="group"
      aria-label="Canvas view zoom controls"
      title="Viewport only: scroll to zoom; hold Space and drag or middle-drag to pan. Ctrl/Cmd + scroll is left to browser zoom."
      className="flex h-9 shrink-0 items-center gap-0.5 rounded-md border border-brand-border bg-brand-paper px-1"
    >
      {/* Zoom out */}
      <button
        type="button"
        onClick={zoomOut}
        disabled={state.zoom <= ZOOM_MIN}
        aria-label="Zoom out"
        title="Zoom out"
        className="flex h-7 w-7 items-center justify-center rounded-sm text-base font-medium leading-none text-brand-muted transition-colors hover:bg-brand-neutral focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
      >
        −
      </button>
      <span className="sr-only">
        Viewport zoom changes only how large the canvas appears; image zoom changes a photo crop.
      </span>

      {/* Current zoom percentage — click to reset to 100 % */}
      <button
        type="button"
        onClick={() => viewport.resetZoom()}
        title="Click to reset zoom to 100%"
        aria-label={`Current zoom: ${pct}%. Click to reset to 100%`}
        className="min-w-[3.2rem] rounded-sm px-1 py-1 text-center text-xs font-semibold tabular-nums text-brand-ink transition-colors hover:bg-brand-neutral focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500"
      >
        {pct}%
      </button>

      {/* Zoom in */}
      <button
        type="button"
        onClick={zoomIn}
        disabled={state.zoom >= ZOOM_MAX}
        aria-label="Zoom in"
        title="Zoom in"
        className="flex h-7 w-7 items-center justify-center rounded-sm text-base font-medium leading-none text-brand-muted transition-colors hover:bg-brand-neutral focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
      >
        +
      </button>

      {/* Separator */}
      <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-brand-border" />

      {/* Fit */}
      <button
        type="button"
        onClick={onFit}
        aria-label="Fit canvas to window"
        title="Fit canvas to window"
        className="h-7 rounded-sm px-2 text-xs font-semibold text-brand-muted transition-colors hover:bg-brand-neutral focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500"
      >
        Fit
      </button>
    </div>
  );
}
