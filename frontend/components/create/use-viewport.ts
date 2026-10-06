/**
 * use-viewport.ts
 *
 * Viewport-only zoom and pan state.  Nothing here touches document data,
 * undo/redo history, or export output.  The canvas document is always
 * rendered and exported at its natural coordinate size; this hook only
 * controls the CSS transform applied to the visual container.
 */

import { useCallback, useState } from "react";

export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 4;
export const ZOOM_STEP = 0.25;
export const ZOOM_DEFAULT = 1;

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
  /** Follow workspace changes until the user manually zooms or pans. */
  isFitted: boolean;
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

export function getFitZoom(containerWidth: number, containerHeight: number, canvasWidth: number, canvasHeight: number): number | null {
  if (![containerWidth, containerHeight, canvasWidth, canvasHeight].every((value) => Number.isFinite(value) && value > 0)) return null;
  // Reserve 4% on each edge (about 85% area for matching aspect ratios),
  // with room for selection handles on laptops and a smaller reserve in tiny stages.
  const inset = (size: number) => Math.min(size / 4, Math.max(16, size * 0.04));
  return Math.min(
    ZOOM_MAX,
    (containerWidth - inset(containerWidth) * 2) / canvasWidth,
    (containerHeight - inset(containerHeight) * 2) / canvasHeight
  );
}

export function useViewport(): ViewportControls {
  const [state, setState] = useState<ViewportState>({
    zoom: ZOOM_DEFAULT,
    panX: 0,
    panY: 0,
    isFitted: true,
  });

  const setZoom = useCallback((zoom: number) => {
    setState((prev) => ({ ...prev, zoom: snapNearOne(clampZoom(zoom)), isFitted: false }));
  }, []);

  const setPan = useCallback((x: number, y: number) => {
    setState((prev) => ({ ...prev, panX: x, panY: y, isFitted: false }));
  }, []);

  const zoomIn = useCallback(() => {
    setState((prev) => {
      const next = snapNearOne(clampZoom(prev.zoom + ZOOM_STEP));
      return { ...prev, zoom: next, isFitted: false };
    });
  }, []);

  const zoomOut = useCallback(() => {
    setState((prev) => {
      const next = Math.min(prev.zoom, snapNearOne(clampZoom(prev.zoom - ZOOM_STEP)));
      return { ...prev, zoom: next, isFitted: false };
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
        const requestedZoom = snapNearOne(clampZoom(prev.zoom + delta));
        const nextZoom = delta < 0 ? Math.min(prev.zoom, requestedZoom) : requestedZoom;
        if (nextZoom === prev.zoom) return prev;

        // Offset from container centre in CSS pixels
        const ox = cx - containerWidth / 2;
        const oy = cy - containerHeight / 2;

        // Adjust pan so the point under the cursor stays fixed
        const scale = nextZoom / prev.zoom;
        const nextPanX = ox + (prev.panX - ox) * scale;
        const nextPanY = oy + (prev.panY - oy) * scale;

        return { zoom: nextZoom, panX: nextPanX, panY: nextPanY, isFitted: false };
      });
    },
    []
  );

  const pan = useCallback((dx: number, dy: number) => {
    setState((prev) => ({ ...prev, panX: prev.panX + dx, panY: prev.panY + dy, isFitted: false }));
  }, []);

  const fitToContainer = useCallback(
    (containerWidth: number, containerHeight: number, canvasWidth: number, canvasHeight: number) => {
      const zoom = getFitZoom(containerWidth, containerHeight, canvasWidth, canvasHeight);
      if (zoom === null) return;
      // Fit may go below the manual zoom minimum so short windows never clip.
      // Do not snap near 100%: rounding upward can exceed the measured fit.
      setState((prev) => prev.isFitted && prev.zoom === zoom && prev.panX === 0 && prev.panY === 0
        ? prev
        : { zoom, panX: 0, panY: 0, isFitted: true });
    },
    []
  );

  const resetZoom = useCallback(() => {
    setState({ zoom: ZOOM_DEFAULT, panX: 0, panY: 0, isFitted: false });
  }, []);

  return { state, setZoom, setPan, zoomIn, zoomOut, zoomAround, pan, fitToContainer, resetZoom };
}
