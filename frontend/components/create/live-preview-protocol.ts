import type { DocumentMode } from "@/types/editor";
import type { ArtworkComposition } from "./artwork-composition";

export interface LivePreviewSlideReference {
  id: string;
  order: number;
}

export interface LivePreviewState {
  documentMode: DocumentMode;
  composition: ArtworkComposition;
  slides: LivePreviewSlideReference[];
  activeSlideId: string | null;
}

export type LivePreviewMessage =
  | { type: "ready" }
  | { type: "state"; state: LivePreviewState }
  | { type: "photo-asset"; source: string; blob: Blob }
  | { type: "select-slide"; slideId: string }
  | { type: "editor-disconnected" };

export function parseLivePreviewMessage(value: unknown): LivePreviewMessage | null {
  if (!isRecord(value) || typeof value.type !== "string") return null;

  if (value.type === "ready") return { type: "ready" };
  if (value.type === "editor-disconnected") return { type: "editor-disconnected" };
  if (value.type === "select-slide" && typeof value.slideId === "string") {
    return { type: "select-slide", slideId: value.slideId };
  }
  if (
    value.type === "photo-asset" &&
    typeof value.source === "string" &&
    typeof Blob !== "undefined" &&
    value.blob instanceof Blob
  ) {
    return { type: "photo-asset", source: value.source, blob: value.blob };
  }
  if (value.type !== "state" || !isLivePreviewState(value.state)) return null;
  return { type: "state", state: value.state };
}

function isLivePreviewState(value: unknown): value is LivePreviewState {
  if (!isRecord(value) || (value.documentMode !== "collage" && value.documentMode !== "carousel")) {
    return false;
  }
  if (!isRecord(value.composition) || !isRecord(value.composition.format) || !isRecord(value.composition.layout)) {
    return false;
  }
  if (
    !isNumber(value.composition.format.width) ||
    !isNumber(value.composition.format.height) ||
    !isNumber(value.composition.format.ratio) ||
    !Array.isArray(value.composition.layout.cells) ||
    !Array.isArray(value.composition.photos) ||
    !Array.isArray(value.composition.elements) ||
    !(value.composition.storyText === undefined || Array.isArray(value.composition.storyText)) ||
    !isRecord(value.composition.slotAssignments) ||
    !isRecord(value.composition.collageStyle) ||
    !isBackgroundStyle(value.composition.collageStyle) ||
    !Array.isArray(value.slides) ||
    !(value.activeSlideId === null || typeof value.activeSlideId === "string")
  ) {
    return false;
  }
  return value.slides.every(
    (slide) => isRecord(slide) && typeof slide.id === "string" && isNumber(slide.order)
  );
}

function isBackgroundStyle(style: Record<string, unknown>) {
  if (style.backgroundType !== undefined && style.backgroundType !== "color" && style.backgroundType !== "image") return false;
  const image = style.backgroundImage;
  if (image === undefined || image === null) return true;
  if (!isRecord(image) || typeof image.src !== "string" || typeof image.name !== "string" ||
    (image.fit !== "cover" && image.fit !== "contain")) return false;
  return isNumber(image.width) && image.width > 0 && isNumber(image.height) && image.height > 0 &&
    isNumber(image.positionX) && image.positionX >= 0 && image.positionX <= 1 &&
    isNumber(image.positionY) && image.positionY >= 0 && image.positionY <= 1 &&
    isNumber(image.zoom) && image.zoom >= 1 && image.zoom <= 3 &&
    isNumber(image.opacity) && image.opacity >= 0 && image.opacity <= 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
