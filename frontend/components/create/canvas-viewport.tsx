"use client";

/**
 * canvas-viewport.tsx
 *
 * A container that applies a CSS transform (zoom + pan) to its children
 * while keeping the scrollable workspace contained.
 *
 * Supported interactions (all viewport-only, no document mutation):
 *   - Wheel over workspace → zoom centred on cursor
 *   - Ctrl/Cmd + wheel    → left to the browser
 *   - Space + left drag   → pan
 *   - Middle-mouse drag   → pan
 *   - Arrow keys (future) → pan
 */

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type WheelEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { ViewportControls } from "./use-viewport";

interface CanvasViewportProps {
  children: ReactNode;
  viewport: ViewportControls;
  /** Called whenever the viewport container is resized. */
  onContainerResize?: (width: number, height: number) => void;
}

/** Wheel-zoom sensitivity (fraction of zoom per pixel of deltaY). */
const WHEEL_SENSITIVITY = 0.004;

export function CanvasViewport({ children, viewport, onContainerResize }: CanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state, zoomAround, setPan } = viewport;

  // ── Pan gesture tracking ────────────────────────────────────────────────
  const panRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);

  const spaceHeldRef = useRef(false);
  const isPanningRef = useRef(false);
  // Reactive cursor state (refs alone won't trigger re-render)
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  // ── ResizeObserver ──────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      onContainerResize?.(container.clientWidth, container.clientHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [onContainerResize]);

  // ── Space key tracking ──────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isTypingTarget(e.target)) {
        spaceHeldRef.current = true;
        if (!isPanningRef.current) setCursor("grab");
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceHeldRef.current = false;
        if (!isPanningRef.current) setCursor(undefined);
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
    };
  }, []);

  // ── Wheel ───────────────────────────────────────────────────────────────
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const delta = -(e.deltaY || e.deltaX) * WHEEL_SENSITIVITY;
    zoomAround(delta, cx, cy, container.clientWidth, container.clientHeight);
  };

  // ── Pointer events for panning ─────────────────────────────────────────
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const isMiddle = e.button === 1;
    const isSpaceLeft = e.button === 0 && spaceHeldRef.current;
    if (!isMiddle && !isSpaceLeft) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isPanningRef.current = true;
    setCursor("grabbing");
    panRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPanX: state.panX,
      startPanY: state.panY,
    };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const ps = panRef.current;
    if (!ps || ps.pointerId !== e.pointerId) return;

    const dx = e.clientX - ps.startClientX;
    const dy = e.clientY - ps.startClientY;
    setPan(ps.startPanX + dx, ps.startPanY + dy);
  };

  const endPan = (e: ReactPointerEvent<HTMLDivElement>) => {
    const ps = panRef.current;
    if (!ps || ps.pointerId !== e.pointerId) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    panRef.current = null;
    isPanningRef.current = false;
    setCursor(spaceHeldRef.current ? "grab" : undefined);
  };


  // ── Transform ───────────────────────────────────────────────────────────
  const { zoom, panX, panY } = state;
  const innerStyle: CSSProperties = {
    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
    transformOrigin: "center center",
  };

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Canvas workspace. Scroll to zoom. Hold Space and drag, or use the middle mouse button, to pan."
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      style={{ cursor }}
      // overflow-hidden keeps zoomed canvas inside the workspace
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-brand-neutral"
    >
      {/* This div is the CSS-transform target. Canvas content is rendered at
          its natural size; zoom only affects presentation. */}
      <div style={innerStyle} className="flex shrink-0 items-center justify-center">
        {children}
      </div>
    </div>
  );
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}
