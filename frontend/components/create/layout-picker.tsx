"use client";

import { resolveCreativeLayout } from "./carousel-composition";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import {
  CANVAS_FORMATS,
  COLLAGE_LAYOUTS,
  DEFAULT_COLLAGE_STYLE,
  type CanvasFormat,
  type CarouselSlide,
  type CarouselStoryLayoutCategory,
  type CarouselStoryLayoutDefinition,
  type CollageStyle,
  type LayoutDefinition,
  type Photo,
} from "@/types/editor";
import { CarouselSlideArtwork } from "./carousel-slide-artwork";
import { CanvasBackground } from "./canvas-background";
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
  previewFormat?: CanvasFormat;
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

const FEATURED_LAYOUT_IDS = new Set([
  "1-full", "1-gallery-card",
  "2-large-left", "2-large-right", "3-large-left", "3-large-right", "3-top-and-pair",
  "4-large-left", "4-large-right", "4-large-top", "5-feature-left", "5-feature-top",
  "6-grid", "6-feature-left", "6-feature-top", "7-editorial-mosaic", "8-hero-mosaic",
  "8-hero-supporting-grid",
]);

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
  previewFormat = CANVAS_FORMATS[0],
}: LayoutPickerProps) {
  const [filter, setFilter] = useState("Featured");
  const [countFilter, setCountFilter] = useState("all");
  const [carouselCategory, setCarouselCategory] = useState<CarouselStoryLayoutCategory>("Featured");
  const [carouselView, setCarouselView] = useState<"story" | "photos">("story");
  const carouselTabs = isCarousel && <div className="mb-4 flex gap-1 border-b border-brand-border pb-2" role="group" aria-label="Composition type">{(["story", "photos"] as const).map((view) => <button key={view} type="button" aria-pressed={carouselView === view} onClick={() => setCarouselView(view)} className={`h-9 whitespace-nowrap rounded px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${carouselView === view ? "bg-brand-ink text-brand-surface" : "text-brand-muted hover:bg-brand-neutral"}`}>{view === "story" ? "Story compositions" : "Photo layouts"}</button>)}</div>;
  const isPhotoComposition = isCollage || isCarousel;
  const filters = ["Featured", "All", "Hero", "Grid", "Editorial", "Creative"];
  const carouselLayouts = useMemo(
    () => carouselStoryLayouts.filter((layout) => layout.category === carouselCategory),
    [carouselCategory, carouselStoryLayouts]
  );
  const layouts = useMemo(() => {
    const compatibleLayouts = isCollage || isCarousel
      ? availableLayouts
      : availableLayouts.filter((layout) => layout.photoCount === photoCount || layout.id === selectedLayoutId);
    if (!isCollage && !isCarousel) return compatibleLayouts;

    return compatibleLayouts.filter((layout) =>
      (countFilter === "all" || layout.photoCount === Number(countFilter)) && matchesFilter(layout, filter)
    );
  }, [availableLayouts, countFilter, filter, isCollage, isCarousel, photoCount, selectedLayoutId]);

  if (isCarousel && carouselView === "story") {
    return (
      <section
        aria-label="Choose carousel composition"
        className={embedded ? "w-full min-w-0" : "absolute bottom-20 right-3 z-30 w-[calc(100%-1.5rem)] rounded-lg border border-brand-border bg-brand-surface p-3 shadow-md md:bottom-4 md:right-4 md:w-auto md:max-w-[min(560px,calc(100%-2rem))]"}
      >
        {carouselTabs}
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
                  {resolveCreativeLayout(layout.photoLayoutId)?.photoCount ?? 1} frames
                </span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Choose collage layout"
      className={embedded
        ? "w-full min-w-0"
        : "absolute bottom-20 right-3 z-30 w-[calc(100%-1.5rem)] rounded-lg border border-brand-border bg-brand-surface p-3 shadow-md md:bottom-4 md:right-4 md:w-auto md:max-w-[min(560px,calc(100%-2rem))]"}
    >
      {carouselTabs}
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          {!isPhotoComposition && <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-ink">Layouts</h2>}
        </div>
        <p className="text-[11px] text-brand-muted">
          {isPhotoComposition ? `${layouts.length} compositions` : `${photoCount} ${photoCount === 1 ? "photo" : "photos"}`}
        </p>
      </div>

      {isPhotoComposition && (
        <>
        <p className="mb-4 text-xs leading-relaxed text-brand-muted">Choose a composition, then fill its slots. Switching layouts keeps your uploaded photos.</p>
        <label className="mb-3 flex items-center justify-between gap-3 text-xs font-medium text-brand-ink">
          Photo slots
          <select value={countFilter} onChange={(event) => setCountFilter(event.target.value)} className="h-9 min-w-0 rounded-md border border-brand-border bg-brand-surface px-2 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">
            <option value="all">Any number</option>
            {[...new Set(availableLayouts.map((layout) => layout.photoCount))].sort((a, b) => a - b).map((count) => (
              <option key={count} value={count}>{count} {count === 1 ? "photo" : "photos"}</option>
            ))}
          </select>
        </label>
        <nav aria-label={isCollage ? "Filter collage layouts" : "Filter photo layouts"} className="mb-4 flex flex-wrap gap-1.5">
          {filters.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={filter === option}
              onClick={() => setFilter(option)}
              className={`min-h-8 shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${filter === option ? "bg-brand-ink text-brand-surface" : "bg-brand-neutral text-brand-muted hover:bg-brand-border"}`}
            >
              {option}
            </button>
          ))}
        </nav>
        {selectedLayoutId && <p className="mb-3 border-l-2 border-brand-accent pl-2 text-[11px] leading-relaxed text-brand-muted">Current: {availableLayouts.find((layout) => layout.id === selectedLayoutId)?.name ?? "Custom layout"}</p>}
        {previewPhotos.length === 0 && <p className="mb-3 text-[11px] text-brand-muted">Numbers mark photo slots. Upload photos to see them in these layouts.</p>}
        </>
      )}

      <div
        className={embedded ? "grid min-w-0 gap-2" : "flex snap-x gap-2 overflow-x-auto pb-1"}
        style={embedded ? { gridTemplateColumns: `repeat(auto-fill, minmax(${isPhotoComposition ? 120 : 76}px, 1fr))` } : undefined}
      >
        {layouts.map((layout) => {
          const isSelected = layout.id === selectedLayoutId;
          const tightestCell = Math.min(...layout.cells.map((cell) => Math.min(cell.width * previewFormat.width, cell.height * previewFormat.height)));
          const renderedSpacing = Math.min(carouselStyle?.spacing ?? DEFAULT_COLLAGE_STYLE.spacing, Math.max(0, tightestCell - 2));
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
              aria-label={`Use ${layout.name} layout, ${layout.photoCount} photo ${layout.photoCount === 1 ? "slot" : "slots"}`}
              className={`${embedded ? "min-w-0" : isPhotoComposition ? "w-36 shrink-0 snap-start" : "w-[88px] shrink-0 snap-start"} rounded-md border p-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${
                isSelected
                  ? "border-brand-accent bg-brand-accent-soft ring-1 ring-brand-accent"
                  : "border-brand-border bg-brand-surface hover:border-brand-muted/50"
              }`}
            >
              <span className={isPhotoComposition ? "flex h-36 items-center justify-center overflow-hidden rounded-sm bg-brand-neutral p-2" : "block"}>
              <span className={`relative block min-w-0 overflow-hidden border border-brand-border ${isPhotoComposition ? "shadow-sm" : "aspect-[4/3] rounded bg-brand-surface"}`} style={isPhotoComposition ? { width: `min(100%, ${128 * previewFormat.ratio}px)`, aspectRatio: previewFormat.ratio, backgroundColor: carouselStyle?.backgroundColor ?? "var(--rw-surface)" } : undefined}>
                {isPhotoComposition && carouselStyle && <CanvasBackground style={carouselStyle} width={previewFormat.width} height={previewFormat.height} />}
                {layout.cells
                  .map((cell, index) => ({ cell, index }))
                  .sort((first, second) =>
                    (first.cell.zIndex ?? first.index) - (second.cell.zIndex ?? second.index)
                  )
                  .map(({ cell, index }) => {
                  const spacing = cell.isBackground ? 0 : renderedSpacing;
                  const gapX = spacing / previewFormat.width * 100;
                  const gapY = spacing / previewFormat.height * 100;
                  const cellStyle: CSSProperties = {
                    left: `calc(${cell.x * 100}% + ${isPhotoComposition ? `${gapX / 2}%` : "2px"})`,
                    top: `calc(${cell.y * 100}% + ${isPhotoComposition ? `${gapY / 2}%` : "2px"})`,
                    width: `calc(${cell.width * 100}% - ${isPhotoComposition ? `${gapX}%` : "4px"})`,
                    height: `calc(${cell.height * 100}% - ${isPhotoComposition ? `${gapY}%` : "4px"})`,
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
                        background: cell.frameStyle ? cell.frameColor ?? "var(--rw-surface)" : !photo && index === heroIndex
                          ? "var(--rw-ink)"
                          : !photo && index % 2 === 0
                            ? "var(--rw-muted)"
                            : !photo ? "var(--rw-border)" : undefined,
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
                            filter: getPhotoCssFilter(photo.filters, isPhotoComposition ? 128 / previewFormat.height : 68 / 1080),
                            transform: `rotate(${photo.rotation}deg) scale(${photo.zoom}) scale(${photo.flipX ? -1 : 1}, ${photo.flipY ? -1 : 1})`,
                          }}
                        />
                      )}
                      {!photo && (
                        <span
                          className={`absolute flex items-center justify-center text-[10px] font-medium ${cell.frameStyle ? "bg-brand-muted text-brand-surface" : index === heroIndex || index % 2 === 0 ? "text-brand-surface" : "text-brand-ink"}`}
                          style={cell.frameStyle === "polaroid"
                            ? { left: "7%", top: "6%", width: "86%", height: "72%" }
                            : cell.frameStyle ? { left: "5%", top: "5%", width: "90%", height: "90%" } : { inset: 0 }}
                        >{index + 1}</span>
                      )}
                    </span>
                  );
                })}
              </span>
              </span>
              <span className="mt-2 block truncate text-xs font-semibold capitalize text-brand-ink" title={layout.name}>
                {shortLayoutName(layout.name)}
              </span>
              <span className="mt-1 flex items-center justify-between gap-1 text-[10px] text-brand-muted">
                <span>{layout.photoCount} {layout.photoCount === 1 ? "slot" : "slots"}</span>
                {isSelected && <span className="font-semibold text-brand-accent-hover">Selected</span>}
              </span>
            </button>
          );
        })}
      </div>
      {layouts.length === 0 && <div className="rounded-md border border-brand-border bg-brand-surface p-4 text-xs leading-relaxed text-brand-muted"><p>No layouts match these filters.</p><button type="button" onClick={() => { setFilter("All"); setCountFilter("all"); }} className="mt-2 rounded px-1 py-1 font-semibold text-brand-ink underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">Show all layouts</button></div>}
    </section>
  );
}

function createCarouselLayoutPreview(
  layout: CarouselStoryLayoutDefinition,
  previewPhotos: Photo[],
  carouselStyle?: CollageStyle
): CarouselSlide | null {
  const photoLayout = resolveCreativeLayout(layout.photoLayoutId);
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
  if (layout.id === "number-note") {
    sampleText.title = "01";
    sampleText.subtitle = "One useful measure";
    sampleText.metadata = "SOURCE / DATE";
  }
  if (layout.id === "checklist") {
    sampleText.body = "01  First idea\n02  Next step\n03  Takeaway";
  }
  const storyText = layout.textPlacements.filter((placement) =>
    placement.role !== "quote" || !layout.textPlacements.some((item) => item.role === "title")
  ).map((placement, index) => ({
    ...constrainCarouselTextPlacement(placement),
    id: `preview-${layout.id}-${index}`,
    text: sampleText[placement.role],
    textBox: true,
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

function matchesFilter(layout: LayoutDefinition, filter: string) {
  if (filter === "All") return true;
  if (layout.categories) return layout.categories.some((category) => category === filter);
  const id = layout.id.toLowerCase();
  const name = layout.name.toLowerCase();
  if (filter === "Featured") {
    return FEATURED_LAYOUT_IDS.has(layout.id);
  }
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
