import { COLLAGE_LAYOUTS, type LayoutDefinition } from "@/types/editor";

// Carousel reserves space for copy. Keep these out of Collage's layout catalog.
export const CAROUSEL_COMPOSITION_LAYOUTS: LayoutDefinition[] = [
  { id: "carousel-feature-column", name: "Feature column", photoCount: 1,
    cells: [{ x: 0.52, y: 0.08, width: 0.42, height: 0.84 }] },
  { id: "carousel-step-note", name: "Step with evidence", photoCount: 1,
    cells: [{ x: 0.08, y: 0.5, width: 0.84, height: 0.32 }] },
  { id: "carousel-gallery-caption", name: "Captioned gallery", photoCount: 3,
    cells: [{ x: 0.08, y: 0.28, width: 0.5, height: 0.42 }, { x: 0.64, y: 0.28, width: 0.28, height: 0.18 }, { x: 0.64, y: 0.52, width: 0.28, height: 0.18 }] },
  { id: "carousel-wide-screen", name: "Wide screen", photoCount: 1,
    cells: [{ x: 0, y: 0.28, width: 1, height: 0.44, isBackground: true }] },
  { id: "carousel-portrait-label", name: "Portrait label", photoCount: 1,
    cells: [{ x: 0.18, y: 0.08, width: 0.64, height: 0.64 }] },
  { id: "carousel-margin-cover", name: "Margin cover", photoCount: 1,
    cells: [{ x: 0.08, y: 0.42, width: 0.84, height: 0.5 }] },
  { id: "carousel-snapshot-note", name: "Snapshot note", photoCount: 2,
    cells: [{ x: 0.12, y: 0.26, width: 0.48, height: 0.44, rotation: -2, frameStyle: "card" }, { x: 0.5, y: 0.38, width: 0.36, height: 0.34, rotation: 2, zIndex: 1, frameStyle: "polaroid", frameColor: "#e8ece4" }] },
  { id: "carousel-detail-pair", name: "Detail pair", photoCount: 2,
    cells: [{ x: 0.08, y: 0.26, width: 0.52, height: 0.46 }, { x: 0.66, y: 0.46, width: 0.26, height: 0.26 }] },
  { id: "carousel-type", name: "Type canvas", photoCount: 0, cells: [] },
  { id: "carousel-photo-note", name: "Photo with caption", photoCount: 1,
    cells: [{ x: 0.08, y: 0.26, width: 0.84, height: 0.48 }] },
  { id: "carousel-comparison", name: "Comparison", photoCount: 2,
    cells: [{ x: 0.08, y: 0.28, width: 0.41, height: 0.4 }, { x: 0.51, y: 0.28, width: 0.41, height: 0.4 }] },
];

export function resolveCreativeLayout(id: string | null | undefined) {
  return COLLAGE_LAYOUTS.find((layout) => layout.id === id) ??
    CAROUSEL_COMPOSITION_LAYOUTS.find((layout) => layout.id === id);
}
