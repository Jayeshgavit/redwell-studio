/**
 * use-viewport.ts
 *
 * Viewport-only zoom and pan state.  Nothing here touches document data,
 * undo/redo history, or export output.  The canvas document is always
 * rendered and exported at its natural coordinate size; this hook only
 * controls the CSS transform applied to the visual container.
 */

import { useCallback, useRef, useState } from "react";

export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 4;
export const ZOOM_STEP = 0.25;
export const ZOOM_DEFAULT = 1;

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface ViewportControls {
  state: ViewportState;
  /** Set an absolute zoom level, clamped to [ZOOM_MIN, ZOOM_MAX]. */
  setZoom: (zoom: number) => void;
  /** Set absolute pan coordinates. */
  setPan: (x: number, y: number) => void;
  /** Zoom in by one ZOOM_STEP. */
  zoomIn: () => void;
  /** Zoom out by one ZOOM_STEP. */
  zoomOut: () => void;
  /** Zoom in/out centred on the given viewport-relative point. */
  zoomAround: (delta: number, cx: number, cy: number, containerWidth: number, containerHeight: number) => void;
  /** Move the pan offset by (dx, dy) pixels. */
  pan: (dx: number, dy: number) => void;
  /** Fit the canvas to the available container and reset pan. */
  fitToContainer: (containerWidth: number, containerHeight: number, canvasWidth: number, canvasHeight: number) => void;
  /** Reset zoom to 100 % and centre pan. */
  resetZoom: () => void;
}

function clampZoom(z: number) {
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
}

function snapNearOne(z: number): number {
  // Snap to exactly 1.0 when within a tiny epsilon so the display always
  // shows "100 %" rather than "99 %" / "101 %".
  return Math.abs(z - 1) < 0.01 ? 1 : z;
}

export function useViewport(): ViewportControls {
  const [state, setState] = useState<ViewportState>({
    zoom: ZOOM_DEFAULT,
    panX: 0,
    panY: 0,
  });

  const setZoom = useCallback((zoom: number) => {
    setState((prev) => ({ ...prev, zoom: snapNearOne(clampZoom(zoom)) }));
  }, []);

  const setPan = useCallback((x: number, y: number) => {
    setState((prev) => ({ ...prev, panX: x, panY: y }));
  }, []);

  const zoomIn = useCallback(() => {
    setState((prev) => {
      const next = snapNearOne(clampZoom(prev.zoom + ZOOM_STEP));
      return { ...prev, zoom: next };
    });
  }, []);

  const zoomOut = useCallback(() => {
    setState((prev) => {
      const next = snapNearOne(clampZoom(prev.zoom - ZOOM_STEP));
      return { ...prev, zoom: next };
    });
  }, []);

  /**
   * Zoom centred on a point (cx, cy) relative to the top-left of the
   * scrollable container.  The viewport transform origin is always
   * "center center", so we first convert (cx, cy) to be relative to the
   * container centre, then adjust pan so that point stays fixed.
   */
  const zoomAround = useCallback(
    (delta: number, cx: number, cy: number, containerWidth: number, containerHeight: number) => {
      setState((prev) => {
        const nextZoom = snapNearOne(clampZoom(prev.zoom + delta));
        if (nextZoom === prev.zoom) return prev;

        // Offset from container centre in CSS pixels
        const ox = cx - containerWidth / 2;
        const oy = cy - containerHeight / 2;

        // Adjust pan so the point under the cursor stays fixed
        const scale = nextZoom / prev.zoom;
        const nextPanX = ox + (prev.panX - ox) * scale;
        const nextPanY = oy + (prev.panY - oy) * scale;

        return { zoom: nextZoom, panX: nextPanX, panY: nextPanY };
      });
    },
    []
  );

  const pan = useCallback((dx: number, dy: number) => {
    setState((prev) => ({ ...prev, panX: prev.panX + dx, panY: prev.panY + dy }));
  }, []);

  const fitToContainer = useCallback(
    (containerWidth: number, containerHeight: number, canvasWidth: number, canvasHeight: number) => {
      if (containerWidth <= 0 || containerHeight <= 0 || canvasWidth <= 0 || canvasHeight <= 0) return;
      const padding = 32; // visual breathing room (px)
      const scaleW = (containerWidth - padding * 2) / canvasWidth;
      const scaleH = (containerHeight - padding * 2) / canvasHeight;
      const zoom = snapNearOne(clampZoom(Math.min(scaleW, scaleH)));
      setState({ zoom, panX: 0, panY: 0 });
    },
    []
  );

  const resetZoom = useCallback(() => {
    setState({ zoom: ZOOM_DEFAULT, panX: 0, panY: 0 });
  }, []);

  return { state, setZoom, setPan, zoomIn, zoomOut, zoomAround, pan, fitToContainer, resetZoom };
}
