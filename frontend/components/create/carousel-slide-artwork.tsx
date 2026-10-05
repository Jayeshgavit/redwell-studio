import type { CSSProperties } from "react";
import {
  getPhotoColorOverlay,
  getPhotoCssFilter,
  getPhotoGradientOverlay,
  resolvePhotoFilters,
} from "./photo-filters";
import {
  CANVAS_FORMATS,
  COLLAGE_LAYOUTS,
  DEFAULT_COLLAGE_STYLE,
  type CarouselSlide,
  type CanvasElement,
  type LayoutDefinition,
} from "@/types/editor";
import { ElementArtwork } from "./elements/element-artwork";
import { getArtworkLayerStack } from "./artwork-composition";

interface CarouselSlideArtworkProps {
  slide: CarouselSlide;
  maxWidth: number;
  maxHeight: number;
  className?: string;
}

export function CarouselSlideArtwork({ slide, maxWidth, maxHeight, className }: CarouselSlideArtworkProps) {
  const format = CANVAS_FORMATS.find((candidate) => candidate.id === slide.canvasFormatId) ?? CANVAS_FORMATS[0];
  const layout: LayoutDefinition = COLLAGE_LAYOUTS.find((candidate) => candidate.id === slide.selectedLayoutId) ??
    COLLAGE_LAYOUTS.find((candidate) => candidate.photoCount === Math.min(Math.max(slide.photos.length, 1), 8)) ??
    COLLAGE_LAYOUTS[0];
  const style = slide.collageStyle ?? DEFAULT_COLLAGE_STYLE;
  const photosById = new Map(slide.photos.map((photo) => [photo.id, photo]));
  const assignedPhotos = new Set(Object.values(slide.slotAssignments));
  const layerStack = getArtworkLayerStack({
    layout,
    photos: slide.photos,
    slotAssignments: slide.slotAssignments,
    elements: slide.elements,
    storyText: slide.storyText ?? [],
  });
  const layerOrderByKey = new Map(
    layerStack.map((layer) => [`${layer.kind}:${layer.id}`, layer.layerOrder])
  );
  const width = Math.max(1, Math.min(maxWidth, maxHeight * format.ratio));
  const height = width / format.ratio;
  const canvasScale = width / format.width;
  const spacing = Math.min(style.spacing * canvasScale, 5);

  return (
    <div
      className={`relative shrink-0 overflow-hidden shadow-md ${className ?? ""}`}
      style={{
        width,
        height,
        aspectRatio: `${format.width} / ${format.height}`,
        backgroundColor: style.backgroundColor,
        border: style.borderEnabled ? `${style.borderWidth * canvasScale}px solid ${style.borderColor}` : undefined,
        borderRadius: Math.min(width / 2, style.cornerRadius * canvasScale),
        containerType: "inline-size",
      }}
    >
      {layout.cells
        .map((cell, index) => ({ cell, index }))
        .sort((first, second) =>
          (first.cell.zIndex ?? first.index) - (second.cell.zIndex ?? second.index)
        )
        .map(({ cell, index }) => {
        const photo = photosById.get(slide.slotAssignments[index]);
        if (photo?.visible === false) return null;
        const cellSpacing = cell.isBackground ? 0 : spacing;
        const cellStyle: CSSProperties = {
          position: "absolute",
          left: `calc(${cell.x * 100}% + ${cellSpacing / 2}px)`,
          top: `calc(${cell.y * 100}% + ${cellSpacing / 2}px)`,
          width: `calc(${cell.width * 100}% - ${cellSpacing}px)`,
          height: `calc(${cell.height * 100}% - ${cellSpacing}px)`,
          overflow: "hidden",
          borderRadius: cell.frameStyle ? 2 * canvasScale : cell.isBackground ? 0 : style.cornerRadius * canvasScale,
          backgroundColor: cell.frameStyle ? cell.frameColor ?? "#fff" : style.backgroundColor,
          boxShadow: cell.frameStyle ? "0 3px 8px rgba(20, 18, 16, 0.24)" : undefined,
          transform: cell.rotation ? `rotate(${cell.rotation}deg)` : undefined,
          zIndex: photo
            ? layerOrderByKey.get(`photo:${photo.id}`) ?? index
            : cell.zIndex ?? index,
        };
        const imageBounds = cell.frameStyle
          ? cell.frameStyle === "polaroid"
            ? { left: "7%", top: "6%", width: "86%", height: "72%" }
            : { left: "5%", top: "5%", width: "90%", height: "90%" }
          : { inset: 0 };
        const filters = photo ? resolvePhotoFilters(photo.filters) : undefined;
        const colorOverlay = filters ? getPhotoColorOverlay(filters) : null;
        const gradientOverlay = filters ? getPhotoGradientOverlay(filters) : undefined;
        const imageCellWidth = cell.frameStyle ? cell.width * (cell.frameStyle === "polaroid" ? 0.86 : 0.9) : cell.width;
        const imageCellHeight = cell.frameStyle ? cell.height * (cell.frameStyle === "polaroid" ? 0.72 : 0.9) : cell.height;

        return (
          <div key={`${slide.id}-cell-${index}`} style={cellStyle}>
            {photo ? (
              <span className="pointer-events-none absolute overflow-hidden" style={imageBounds}>
                <img
                  alt=""
                  src={photo.src}
                  draggable={false}
                  className="h-full w-full"
                  style={{
                    objectFit: photo.displayMode === "fit" ? "contain" : photo.displayMode === "stretch" ? "fill" : "cover",
                    objectPosition: `${photo.positionX * 100}% ${photo.positionY * 100}%`,
                    transform: `rotate(${photo.rotation}deg) scale(${rotationCoverScale(imageCellWidth, imageCellHeight, format.ratio, photo.displayMode, photo.rotation)}) scale(${photo.flipX ? -1 : 1}, ${photo.flipY ? -1 : 1}) scale(${photo.zoom})`,
                    transformOrigin: "center",
                    filter: getPhotoCssFilter(photo.filters, canvasScale),
                    opacity: (filters?.opacity ?? 100) / 100,
                  }}
                />
                {colorOverlay && <span className="absolute mix-blend-soft-light" style={{ inset: 0, backgroundColor: colorOverlay.color, opacity: colorOverlay.opacity }} />}
                {gradientOverlay && <span className="absolute" style={{ inset: 0, backgroundImage: gradientOverlay }} />}
                {(filters?.vignette ?? 0) > 0 && (
                  <span
                    className="absolute"
                    style={{
                      inset: 0,
                      background: `radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,${(filters?.vignette ?? 0) / 100 * 0.65}) 100%)`,
                    }}
                  />
                )}
                {(filters?.grain ?? 0) > 0 && (
                  <span
                    className="absolute"
                    style={{
                      inset: 0,
                      opacity: (filters?.grain ?? 0) / 100 * 0.3,
                      backgroundImage: "repeating-radial-gradient(circle at 20% 30%, rgba(0,0,0,.65) 0 0.45px, transparent .8px 2px), repeating-radial-gradient(circle at 70% 65%, rgba(255,255,255,.65) 0 0.45px, transparent .8px 2px)",
                      backgroundSize: "4px 4px, 5px 5px",
                    }}
                  />
                )}
              </span>
            ) : (
              <div className="h-full w-full border border-dashed border-gray-300/80 bg-gray-50/50" />
            )}
          </div>
        );
      })}
      {(slide.storyText ?? []).filter((item) => item.visible !== false).map((item) => (
        <span
          key={item.id}
          className="pointer-events-none absolute overflow-hidden whitespace-pre-wrap"
          style={{
            left: `${item.x * 100}%`,
            top: `${item.y * 100}%`,
            width: "max-content",
            maxWidth: `${item.width * 100}%`,
            zIndex: layerOrderByKey.get(`storyText:${item.id}`) ?? 0,
            color: item.color,
            textAlign: item.textAlign,
            fontFamily: item.fontFamily === "serif" ? "Georgia, 'Times New Roman', serif" : "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize: `${item.fontSize * 100 / format.width}cqw`,
            fontWeight: item.fontWeight,
            lineHeight: item.lineHeight,
            letterSpacing: `${item.letterSpacing * 100 / format.width}cqw`,
            backgroundColor: item.backgroundColor,
            padding: item.padding ? `${item.padding * 100 / format.width}cqw` : undefined,
            textShadow: item.textShadow,
            boxSizing: "border-box",
          }}
        >
          {item.text}
        </span>
      ))}
      {slide.elements.filter((element) => element.visible !== false).map((element) => (
        <PreviewElement
          key={element.id}
          element={element}
          layerOrder={layerOrderByKey.get(`element:${element.id}`) ?? 0}
        />
      ))}
      {slide.photos.some((photo) => !assignedPhotos.has(photo.id)) && (
        <span className="absolute bottom-1 right-1 rounded bg-white/90 px-1.5 py-0.5 text-[8px] font-medium text-gray-600">
          +{slide.photos.length - assignedPhotos.size}
        </span>
      )}
    </div>
  );
}

function rotationCoverScale(
  cellWidth: number,
  cellHeight: number,
  canvasRatio: number,
  displayMode: "fill" | "fit" | "stretch",
  rotation: 0 | 90 | 180 | 270
) {
  if (displayMode !== "fill" || rotation % 180 === 0) return 1;
  const cellAspectRatio = (cellWidth / cellHeight) * canvasRatio;
  return Math.max(cellAspectRatio, 1 / cellAspectRatio);
}

function PreviewElement({ element, layerOrder }: { element: CanvasElement; layerOrder: number }) {
  return (
    <span
      className="pointer-events-none absolute"
      style={{
        left: `${element.x * 100}%`,
        top: `${element.y * 100}%`,
        width: `${element.width * 100}%`,
        height: `${element.height * 100}%`,
        zIndex: layerOrder,
        opacity: element.opacity,
        transform: `translate(-50%, -50%) rotate(${element.rotation}deg) scale(${element.scaleX * (element.flipX ? -1 : 1)}, ${element.scaleY * (element.flipY ? -1 : 1)})`,
        transformOrigin: "center",
      }}
    >
      <ElementArtwork assetId={element.assetId} color={element.color} className="h-full w-full object-contain" />
    </span>
  );
}
