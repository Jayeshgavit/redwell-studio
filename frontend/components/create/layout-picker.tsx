"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import {
  CANVAS_FORMATS,
  COLLAGE_LAYOUTS,
  DEFAULT_COLLAGE_STYLE,
  type CarouselSlide,
  type CarouselStoryLayoutCategory,
  type CarouselStoryLayoutDefinition,
  type CollageStyle,
  type LayoutDefinition,
  type Photo,
} from "@/types/editor";
import { CarouselSlideArtwork } from "./carousel-slide-artwork";
import { getPhotoCssFilter } from "./photo-filters";
import { constrainCarouselTextPlacement } from "./carousel-story-templates";

interface LayoutPickerProps {
  availableLayouts: LayoutDefinition[];
  carouselStoryLayouts?: CarouselStoryLayoutDefinition[];
  carouselStyle?: CollageStyle;
  previewPhotos: Photo[];
  photoCount: number;
  selectedLayoutId: string | null;
  selectedStoryLayoutId?: string | null;
  isCollage?: boolean;
  isCarousel?: boolean;
  onSelect: (layoutId: string) => void;
  onSelectStoryLayout?: (layoutId: CarouselStoryLayoutDefinition["id"]) => void;
  embedded?: boolean;
}

const CAROUSEL_LAYOUT_CATEGORIES: CarouselStoryLayoutCategory[] = [
  "Featured",
  "Editorial",
  "Photo Dump",
  "Scrapbook",
  "Cinematic",
  "Minimal",
  "Seamless",
  "Travel",
];

export function LayoutPicker({
  availableLayouts,
  carouselStoryLayouts = [],
  carouselStyle,
  previewPhotos,
  photoCount,
  selectedLayoutId,
  selectedStoryLayoutId,
  onSelect,
  isCollage = false,
  isCarousel = false,
  embedded = false,
  onSelectStoryLayout,
}: LayoutPickerProps) {
  const [filter, setFilter] = useState("Featured");
  const [carouselCategory, setCarouselCategory] = useState<CarouselStoryLayoutCategory>("Featured");
  const filters = ["Featured", "2–3 Photos", "4 Photos", "5–6 Photos", "7–8 Photos", "Hero", "Grid", "Editorial", "Creative"];
  const carouselLayouts = useMemo(
    () => carouselStoryLayouts.filter((layout) => layout.category === carouselCategory),
    [carouselCategory, carouselStoryLayouts]
  );
  const layouts = useMemo(() => {
    const compatibleLayouts = isCollage
      ? availableLayouts
      : availableLayouts.filter((layout) => layout.photoCount === photoCount || layout.id === selectedLayoutId);
    if (!isCollage) return compatibleLayouts;

    const inFilter = compatibleLayouts.filter((layout) =>
      layout.id === selectedLayoutId || matchesFilter(layout, filter, photoCount)
    );
    return inFilter;
  }, [availableLayouts, filter, isCollage, photoCount, selectedLayoutId]);

  if (isCarousel) {
    return (
      <section
        aria-label="Choose carousel composition"
        className={embedded ? "w-full min-w-0" : "absolute bottom-20 right-3 z-30 w-[calc(100%-1.5rem)] rounded-lg border border-brand-border bg-brand-surface p-3 shadow-md md:bottom-4 md:right-4 md:w-auto md:max-w-[min(560px,calc(100%-2rem))]"}
      >
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-ink">Story compositions</h2>
            <p className="mt-0.5 text-[10px] text-brand-muted">Choose a visual direction for this slide</p>
          </div>
          <p className="shrink-0 text-[11px] text-brand-muted">
            {photoCount} {photoCount === 1 ? "photo" : "photos"}
          </p>
        </div>

        <nav aria-label="Carousel composition families" className="mb-2 flex gap-1 overflow-x-auto pb-1">
          {CAROUSEL_LAYOUT_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={carouselCategory === category}
              onClick={() => setCarouselCategory(category)}
              className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${
                carouselCategory === category
                  ? "bg-brand-accent text-white"
                  : "bg-brand-neutral text-brand-muted hover:bg-brand-border"
              }`}
            >
              {category}
            </button>
          ))}
        </nav>

        <div
          className="grid min-w-0 gap-2"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}
        >
          {carouselLayouts.map((layout) => {
            const selected = layout.id === selectedStoryLayoutId;
            const previewSlide = createCarouselLayoutPreview(layout, previewPhotos, carouselStyle);
            if (!previewSlide) return null;

            return (
              <button
                key={layout.id}
                type="button"
                onClick={() => onSelectStoryLayout?.(layout.id)}
                aria-pressed={selected}
                aria-label={`Use ${layout.name} carousel layout`}
                className={`group min-w-0 rounded-lg border p-1.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${
                  selected
                    ? "border-brand-accent bg-brand-accent-soft ring-1 ring-brand-accent"
                    : "border-brand-border bg-brand-surface hover:border-brand-muted/50"
                }`}
              >
                <span className="flex aspect-[4/5] items-center justify-center overflow-hidden bg-brand-neutral">
                  <CarouselSlideArtwork
                    slide={previewSlide}
                    maxWidth={100}
                    maxHeight={125}
                    className="rounded-none shadow-none"
                  />
                </span>
                <span className="mt-1 block truncate text-[10px] font-semibold text-brand-ink" title={layout.name}>
                  {layout.name}
                </span>
                <span className="block text-[9px] text-brand-muted">
                  {COLLAGE_LAYOUTS.find((photoLayout) => photoLayout.id === layout.photoLayoutId)?.photoCount ?? 1} frames
                </span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  if (layouts.length === 0) return null;

  return (
    <section
      aria-label="Choose collage layout"
      className={embedded
        ? "w-full min-w-0"
        : "absolute bottom-20 right-3 z-30 w-[calc(100%-1.5rem)] rounded-lg border border-brand-border bg-brand-surface p-3 shadow-md md:bottom-4 md:right-4 md:w-auto md:max-w-[min(560px,calc(100%-2rem))]"}
    >
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-ink">Layouts</h2>
          {isCollage && <span className="truncate text-[10px] text-brand-muted/70">{filter}</span>}
        </div>
        <p className="text-[11px] text-brand-muted">
          {photoCount} {photoCount === 1 ? "photo" : "photos"}
        </p>
      </div>

      {isCollage && (
        <nav aria-label="Filter collage layouts" className="mb-2 flex gap-1 overflow-x-auto pb-1">
          {filters.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={filter === option}
              onClick={() => setFilter(option)}
              className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${filter === option ? "bg-brand-accent text-white" : "bg-brand-neutral text-brand-muted hover:bg-brand-border"}`}
            >
              {option}
            </button>
          ))}
        </nav>
      )}

      <div
        className={embedded ? "grid min-w-0 gap-2" : "flex snap-x gap-2 overflow-x-auto pb-1"}
        style={embedded ? { gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))" } : undefined}
      >
        {layouts.map((layout) => {
          const isSelected = layout.id === selectedLayoutId;
          const heroIndex = layout.cells.reduce((largest, cell, index, cells) => {
            const area = cell.width * cell.height;
            const largestArea = cells[largest].width * cells[largest].height;
            return area > largestArea ? index : largest;
          }, 0);

          return (
            <button
              key={layout.id}
              type="button"
              onClick={() => onSelect(layout.id)}
              aria-pressed={isSelected}
              aria-label={`Use ${layout.name} layout`}
              className={`${embedded ? "min-w-0" : "w-[88px] shrink-0 snap-start"} rounded-lg border p-1.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${
                isSelected
                  ? "border-brand-accent bg-brand-accent-soft ring-1 ring-brand-accent"
                  : "border-brand-border bg-brand-surface hover:border-brand-muted/50"
              }`}
            >
              <span className="relative block aspect-[4/3] min-w-0 overflow-hidden rounded border border-brand-border bg-brand-surface">
                {layout.cells
                  .map((cell, index) => ({ cell, index }))
                  .sort((first, second) =>
                    (first.cell.zIndex ?? first.index) - (second.cell.zIndex ?? second.index)
                  )
                  .map(({ cell, index }) => {
                  const cellStyle: CSSProperties = {
                    left: `calc(${cell.x * 100}% + 2px)`,
                    top: `calc(${cell.y * 100}% + 2px)`,
                    width: `calc(${cell.width * 100}% - 4px)`,
                    height: `calc(${cell.height * 100}% - 4px)`,
                  };
                  const photo = previewPhotos[index];

                  return (
                    <span
                      key={`${layout.id}-thumbnail-${index}`}
                      className={`absolute overflow-hidden border ${cell.frameStyle ? "border-white shadow-sm" : "rounded-[2px] border-white/80"}`}
                      style={{
                        ...cellStyle,
                        zIndex: cell.zIndex ?? index,
                        transform: cell.rotation ? `rotate(${cell.rotation}deg)` : undefined,
                        background: cell.frameStyle ? cell.frameColor ?? "#fff" : !photo && index === heroIndex
                          ? "var(--rw-accent-soft)"
                          : !photo && index % 2 === 0
                            ? "var(--rw-paper)"
                            : !photo ? "var(--rw-neutral)" : undefined,
                      }}
                    >
                      {photo && (
                        <img
                          src={photo.src}
                          alt=""
                          draggable={false}
                          loading="lazy"
                          className="absolute h-full w-full object-cover"
                          style={{
                            left: cell.frameStyle === "polaroid" ? "7%" : cell.frameStyle ? "5%" : 0,
                            top: cell.frameStyle === "polaroid" ? "6%" : cell.frameStyle ? "5%" : 0,
                            width: cell.frameStyle === "polaroid" ? "86%" : cell.frameStyle ? "90%" : "100%",
                            height: cell.frameStyle === "polaroid" ? "72%" : cell.frameStyle ? "90%" : "100%",
                            objectFit: photo.displayMode === "fit" ? "contain" : photo.displayMode === "stretch" ? "fill" : "cover",
                            objectPosition: `${photo.positionX * 100}% ${photo.positionY * 100}%`,
                            filter: getPhotoCssFilter(photo.filters, 68 / 1080),
                            transform: `rotate(${photo.rotation}deg) scale(${photo.zoom}) scale(${photo.flipX ? -1 : 1}, ${photo.flipY ? -1 : 1})`,
                          }}
                        />
                      )}
                      {cell.frameStyle && !photo && (
                        <span
                          className="absolute bg-brand-neutral"
                          style={cell.frameStyle === "polaroid"
                            ? { left: "7%", top: "6%", width: "86%", height: "72%" }
                            : { left: "5%", top: "5%", width: "90%", height: "90%" }}
                        />
                      )}
                    </span>
                  );
                })}
              </span>
              <span className="mt-1 block truncate text-[10px] font-semibold text-brand-ink" title={layout.name}>
                {shortLayoutName(layout.name)}
              </span>
              <span className="block text-[9px] text-brand-muted">
                {layout.photoCount} {layout.photoCount === 1 ? "photo" : "photos"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function createCarouselLayoutPreview(
  layout: CarouselStoryLayoutDefinition,
  previewPhotos: Photo[],
  carouselStyle?: CollageStyle
): CarouselSlide | null {
  const photoLayout = COLLAGE_LAYOUTS.find((candidate) => candidate.id === layout.photoLayoutId);
  if (!photoLayout || !CANVAS_FORMATS.some((format) => format.id === layout.formatId)) return null;

  const sampleText: Record<CarouselStoryLayoutDefinition["textPlacements"][number]["role"], string> = {
    eyebrow: "FIELD NOTES",
    title: layout.name,
    subtitle: "A story in frames",
    body: "Room to look a little closer.",
    metadata: "01 / 08",
    location: "Somewhere worth remembering",
    quote: "Stay a little longer.",
    cta: "Save this story",
  };
  const storyText = layout.textPlacements.map((placement, index) => ({
    ...constrainCarouselTextPlacement(placement),
    id: `preview-${layout.id}-${index}`,
    text: sampleText[placement.role],
  }));

  return {
    id: `preview-${layout.id}`,
    order: 0,
    photos: previewPhotos,
    slotAssignments: Object.fromEntries(
      previewPhotos.slice(0, photoLayout.cells.length).map((photo, index) => [index, photo.id])
    ),
    canvasFormatId: layout.formatId,
    selectedLayoutId: layout.photoLayoutId,
    elements: [],
    collageStyle: { ...DEFAULT_COLLAGE_STYLE, ...carouselStyle, backgroundColor: layout.backgroundColor },
    storyLayoutId: layout.id,
    storySlideType: "gallery",
    storyText,
  };
}

function matchesFilter(layout: LayoutDefinition, filter: string, currentPhotoCount: number) {
  const id = layout.id.toLowerCase();
  const name = layout.name.toLowerCase();
  if (filter === "Featured") {
    const featuredIds = new Set([
      "1-full", "1-gallery-card",
      "2-large-left", "2-large-right", "3-large-left", "3-large-right", "3-top-and-pair",
      "4-large-left", "4-large-right", "4-large-top", "5-feature-left", "5-feature-top",
      "6-grid", "6-feature-left", "6-feature-top", "7-editorial-mosaic", "8-hero-mosaic",
      "8-hero-supporting-grid",
    ]);
    return layout.photoCount === currentPhotoCount && featuredIds.has(layout.id) ||
      layout.photoCount === currentPhotoCount && /hero|feature|magazine/i.test(name);
  }
  if (filter === "2–3 Photos") return layout.photoCount >= 2 && layout.photoCount <= 3;
  if (filter === "4 Photos") return layout.photoCount === 4;
  if (filter === "5–6 Photos") return layout.photoCount >= 5 && layout.photoCount <= 6;
  if (filter === "7–8 Photos") return layout.photoCount >= 7 && layout.photoCount <= 8;
  if (filter === "Hero") return /hero|feature|large|cinema/i.test(`${id} ${name}`);
  if (filter === "Grid") return /grid|balanced|corner|split/i.test(`${id} ${name}`);
  if (filter === "Editorial") return /editorial|mosaic|magazine|columns|ledger|cinema|story|cross/i.test(`${id} ${name}`);
  if (filter === "Creative") return /scrapbook|film|polaroid|overlap|layered|full-bleed|strip|cards/i.test(`${id} ${name}`);
  return true;
}

function shortLayoutName(name: string) {
  return name
    .replace(/^(One|Two|Three|Four|Five|Six|Seven|Eight)\s*[·-]\s*/i, "")
    .replace(/Feature left \+ three/i, "Hero + Stack")
    .replace(/Three \+ feature right/i, "Stack + Hero")
    .replace(/Feature top \+ three/i, "Top Hero + Strip");
}
