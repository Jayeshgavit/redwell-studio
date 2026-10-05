"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { CAROUSEL_TEXT_SAFE_AREA, type CanvasFormat, type LayoutDefinition } from "@/types/editor";
import { usePhotos, type PhotoDisplayMode, type PhotoRotation } from "./photo-context";
import type { CanvasElement } from "@/types/editor";
import { ElementArtwork } from "./elements/element-artwork";
import { getCatalogElement } from "./elements/catalog";
import {
  getPhotoColorOverlay,
  getPhotoCssFilter,
  getPhotoGradientOverlay,
  resolvePhotoFilters,
} from "./photo-filters";
import { getArtworkLayerStack } from "./artwork-composition";

export const MAX_CANVAS_WIDTH = 1600;

interface FabricCanvasComponentProps {
  format: CanvasFormat;
  layout: LayoutDefinition;
  onAddPhotoToSlot: (slotIndex: number) => void;
  selectedPhotoId: string | null;
  onSelectPhoto: (photoId: string | null) => void;
  selectedElementId: string | null;
  onSelectElement: (elementId: string | null) => void;
  selectedStoryTextId: string | null;
  onSelectStoryText: (textId: string | null) => void;
  onSwapSlots: (fromSlotIndex: number, toSlotIndex: number) => void;
  readOnly?: boolean;
  /** When provided, the component uses these dimensions instead of measuring
   * its own container. Used by the viewport zoom system so the canvas renders
   * at a fixed natural size. */
  containerSize?: { width: number; height: number };
}

interface ViewportSize {
  width: number;
  height: number;
}

interface StoryTextBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface ActiveDrag {
  photoId: string;
  pointerId: number;
  startX: number;
  startY: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
}

interface ActiveSlotDrag {
  sourceSlotIndex: number;
  targetSlotIndex: number;
  pointerId: number;
}

interface ActiveElementDrag {
  elementId: string;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  canvasWidth: number;
  canvasHeight: number;
  mode: "move" | "resize";
}

interface ActiveStoryTextDrag {
  textId: string;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  canvasWidth: number;
  canvasHeight: number;
}

export function FabricCanvasComponent({
  format,
  layout,
  onAddPhotoToSlot,
  selectedPhotoId,
  onSelectPhoto,
  selectedElementId,
  onSelectElement,
  selectedStoryTextId,
  onSelectStoryText,
  onSwapSlots,
  readOnly = false,
  containerSize,
}: FabricCanvasComponentProps) {
  const {
    photos,
    slotAssignments,
    collageStyle,
    removePhoto,
    updatePhoto,
    beginHistoryTransaction,
    finishHistoryTransaction,
    elements,
    documentMode,
    storyText,
    updateElement,
    updateStoryText,
  } = usePhotos();
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const activeSlotDragRef = useRef<ActiveSlotDrag | null>(null);
  // Internal viewport size — only used when containerSize prop is not provided
  const [internalViewportSize, setInternalViewportSize] = useState<ViewportSize | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [editingStoryTextId, setEditingStoryTextId] = useState<string | null>(null);
  const [selectedStoryTextBounds, setSelectedStoryTextBounds] = useState<StoryTextBounds | null>(null);
  const activeDragRef = useRef<ActiveDrag | null>(null);
  const activeElementDragRef = useRef<ActiveElementDrag | null>(null);
  const activeStoryTextDragRef = useRef<ActiveStoryTextDrag | null>(null);
  const storyTextEditRef = useRef<HTMLDivElement | null>(null);
  const storyTextEditValueRef = useRef("");
  const photosById = new Map(photos.map((photo) => [photo.id, photo]));
  const selectedPhoto = photos.find((photo) => photo.id === selectedPhotoId);
  const selectedPhotoSlotIndex = selectedPhotoId
    ? Number(Object.entries(slotAssignments).find(([, id]) => id === selectedPhotoId)?.[0])
    : Number.NaN;
  const selectedPhotoCell = Number.isInteger(selectedPhotoSlotIndex)
    ? layout.cells[selectedPhotoSlotIndex]
    : undefined;
  const selectedElement = elements.find((element) => element.id === selectedElementId);

  useEffect(() => {
    if (!editingStoryTextId || !storyTextEditRef.current) return;
    const editable = storyTextEditRef.current;
    editable.textContent = storyTextEditValueRef.current;
    editable.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editable);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [editingStoryTextId]);
  const assignedPhotoCount = new Set(
    Object.values(slotAssignments).filter((photoId) => photosById.has(photoId))
  ).size;
  const hiddenPhotoCount = photos.length - assignedPhotoCount;
  const layerStack = getArtworkLayerStack({
    layout,
    photos,
    slotAssignments,
    elements,
    storyText,
  });
  const layerOrderByKey = new Map(
    layerStack.map((layer) => [`${layer.kind}:${layer.id}`, layer.layerOrder])
  );
  const slotOrder = new Map(
    layout.cells
      .map((cell, index) => ({ cell, index }))
      .sort((first, second) =>
        (first.cell.zIndex ?? first.index) - (second.cell.zIndex ?? second.index)
      )
      .map(({ index }, order) => [index, order])
  );

  // Internal resize observer — only active when no external containerSize is provided
  useEffect(() => {
    if (containerSize) return; // parent is supplying dimensions
    const viewport = viewportRef.current;
    if (!viewport) return;

    const resizeObserver = new ResizeObserver(() => {
      setInternalViewportSize({
        width: Math.max(1, viewport.clientWidth - 32),
        height: Math.max(1, viewport.clientHeight - 32),
      });
    });

    resizeObserver.observe(viewport);
    return () => resizeObserver.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!containerSize]);

  // Effective viewport dimensions: prefer the externally-supplied value
  const viewportSize = containerSize
    ? {
        width: Math.max(1, containerSize.width - 32),
        height: Math.max(1, containerSize.height - 32),
      }
    : internalViewportSize;

  const canvasWidth = viewportSize
    ? Math.max(1, Math.min(MAX_CANVAS_WIDTH, viewportSize.width, viewportSize.height * format.ratio))
    : `min(${MAX_CANVAS_WIDTH}px, calc(100vw - 2rem))`;
  const measuredCanvasWidth =
    typeof canvasWidth === "number" ? canvasWidth : MAX_CANVAS_WIDTH;
  const measuredCanvasHeight = measuredCanvasWidth / format.ratio;
  const canvasScale = measuredCanvasWidth / format.width;
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const selectedId = selectedStoryTextId;
    const textElement = selectedId && canvas
      ? [...canvas.querySelectorAll<HTMLElement>("[data-story-text-id]")]
          .find((element) => element.dataset.storyTextId === selectedId)
      : undefined;
    if (!canvas || !textElement) {
      setSelectedStoryTextBounds(null);
      return;
    }

    const canvasRect = canvas.getBoundingClientRect();
    const textRect = textElement.getBoundingClientRect();
    setSelectedStoryTextBounds({
      left: textRect.left - canvasRect.left - canvas.clientLeft,
      top: textRect.top - canvasRect.top - canvas.clientTop,
      width: textRect.width,
      height: textRect.height,
    });
  }, [measuredCanvasWidth, selectedStoryTextId, storyText]);
  const tightestCellDimension = Math.min(
    ...layout.cells.map((cell) =>
      Math.min(cell.width * measuredCanvasWidth, cell.height * measuredCanvasHeight)
    )
  );
  const spacing = Math.min(
    collageStyle.spacing,
    Math.max(0, tightestCellDimension / canvasScale - 2)
  ) * canvasScale;
  const canvasStyle: CSSProperties = {
    width: canvasWidth,
    aspectRatio: `${format.width} / ${format.height}`,
    backgroundColor: collageStyle.backgroundColor,
    border: collageStyle.borderEnabled
      ? `${collageStyle.borderWidth * canvasScale}px solid ${collageStyle.borderColor}`
      : "0 solid transparent",
    borderRadius: `${collageStyle.cornerRadius * canvasScale}px`,
  };

  return (
    // When containerSize is provided the parent (CanvasViewport) handles the
    // outer layout; we only render the canvas + helpers.
    // When not provided (standalone / legacy use) we keep the original wrapper.
    <div ref={containerSize ? undefined : viewportRef} className={`${containerSize ? "flex flex-col items-center" : "flex h-full w-full items-center justify-center overflow-auto bg-gray-100 p-4"} ${readOnly ? "pointer-events-none select-none" : ""}`}>
      <div className="w-fit max-w-full shrink-0">
        <div
          aria-label={`${format.name} ${documentMode === "carousel" ? "carousel slide" : "collage"} canvas`}
          ref={canvasRef}
          onClick={() => {
            onSelectPhoto(null);
            onSelectElement(null);
            onSelectStoryText(null);
          }}
          className="relative mx-auto max-w-full overflow-hidden shadow-lg"
          style={canvasStyle}
        >
          {layout.cells
            .map((cell, index) => ({ cell, index }))
            .sort((first, second) =>
              (first.cell.zIndex ?? first.index) - (second.cell.zIndex ?? second.index)
            )
            .map(({ cell, index }) => {
            const photoId = slotAssignments[index];
            const photo = photoId ? photosById.get(photoId) : undefined;
            if (photo?.visible === false) return null;
            const cellSpacing = cell.isBackground ? 0 : spacing;
            const cellStyle: CSSProperties = {
              left: `calc(${cell.x * 100}% + ${cellSpacing / 2}px)`,
              top: `calc(${cell.y * 100}% + ${cellSpacing / 2}px)`,
              width: `calc(${cell.width * 100}% - ${cellSpacing}px)`,
              height: `calc(${cell.height * 100}% - ${cellSpacing}px)`,
              borderRadius: cell.frameStyle ? 2 * canvasScale : cell.isBackground ? 0 : collageStyle.cornerRadius * canvasScale,
              backgroundColor: cell.frameStyle ? cell.frameColor ?? "#fff" : collageStyle.backgroundColor,
              boxShadow: cell.frameStyle
                ? `0 ${5 * canvasScale}px ${14 * canvasScale}px rgba(20, 18, 16, 0.24)`
                : undefined,
              transform: cell.rotation ? `rotate(${cell.rotation}deg)` : undefined,
              zIndex: dropTargetIndex === index
                ? 1001
                : photo
                  ? layerOrderByKey.get(`photo:${photo.id}`) ?? slotOrder.get(index) ?? index
                  : slotOrder.get(index) ?? index,
              touchAction: photo?.displayMode === "fill" ? "none" : undefined,
            };
            const frameImageStyle: CSSProperties = cell.frameStyle
              ? cell.frameStyle === "polaroid"
                ? { left: "7%", top: "6%", width: "86%", height: "72%" }
                : { left: "5%", top: "5%", width: "90%", height: "90%" }
              : { inset: 0 };
            const photoFilters = photo ? resolvePhotoFilters(photo.filters) : undefined;
            const colorOverlay = photoFilters ? getPhotoColorOverlay(photoFilters) : null;
            const gradientOverlay = photoFilters ? getPhotoGradientOverlay(photoFilters) : undefined;
            const vignetteOpacity = (photoFilters?.vignette ?? 0) / 100 * 0.65;
            const imageCellWidth = cell.frameStyle ? cell.width * (cell.frameStyle === "polaroid" ? 0.86 : 0.9) : cell.width;
            const imageCellHeight = cell.frameStyle ? cell.height * (cell.frameStyle === "polaroid" ? 0.72 : 0.9) : cell.height;

            return (
              <div
                key={`${layout.id}-${index}`}
                data-slot-index={index}
                role={photo ? "group" : undefined}
                tabIndex={photo ? 0 : undefined}
                onClick={(event) => {
                  if (!photo) return;
                  event.stopPropagation();
                  onSelectPhoto(photo.id);
                  onSelectElement(null);
                  onSelectStoryText(null);
                }}
                onKeyDown={(event) => {
                  if (!photo || (event.key !== "Enter" && event.key !== " ")) return;
                  event.preventDefault();
                  onSelectPhoto(photo.id);
                      onSelectStoryText(null);
                }}
                onPointerDown={(event) => {
                  if (!photo || photo.locked || photo.displayMode !== "fill" || event.button !== 0) return;
                  onSelectPhoto(photo.id);
                  beginHistoryTransaction();
                  const rect = event.currentTarget.getBoundingClientRect();
                  activeDragRef.current = {
                    photoId: photo.id,
                    pointerId: event.pointerId,
                    startX: event.clientX,
                    startY: event.clientY,
                    positionX: photo.positionX,
                    positionY: photo.positionY,
                    width: rect.width,
                    height: rect.height,
                  };
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  const drag = activeDragRef.current;
                  if (!photo || !drag || drag.photoId !== photo.id || drag.pointerId !== event.pointerId) return;
                  updatePhoto(
                    photo.id,
                    {
                      positionX: clampFocus(drag.positionX - (event.clientX - drag.startX) / Math.max(drag.width, 1)),
                      positionY: clampFocus(drag.positionY - (event.clientY - drag.startY) / Math.max(drag.height, 1)),
                    },
                    "transient"
                  );
                }}
                onPointerUp={() => {
                  activeDragRef.current = null;
                  finishHistoryTransaction();
                }}
                onPointerCancel={() => {
                  activeDragRef.current = null;
                  finishHistoryTransaction();
                }}
                aria-label={photo
                  ? `Photo ${index + 1}${selectedPhotoId === photo.id ? ", selected" : ""}, click to select and drag to reposition`
                  : `Empty slot ${index + 1}`}
                aria-current={photo && selectedPhotoId === photo.id ? "true" : undefined}
                className={`absolute overflow-hidden rounded-sm ${
                  photo
                    ? "group bg-gray-100"
                    : "pointer-events-none flex items-center justify-center border border-dashed border-gray-300 bg-transparent"
                } ${photo && selectedPhotoId === photo.id ? "z-10 ring-2 ring-inset ring-redwell-500" : ""} ${dropTargetIndex === index ? "z-20 ring-2 ring-inset ring-redwell-500 bg-redwell-50" : ""} ${photo && photo.displayMode === "fill" ? "cursor-grab active:cursor-grabbing" : ""}`}
                style={cellStyle}
              >
                {photo ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute overflow-hidden"
                      style={frameImageStyle}
                    >
                      <img
                        src={photo.src}
                        alt={`${documentMode === "carousel" ? "Carousel" : "Collage"} photo ${index + 1}`}
                        draggable={false}
                        className="h-full w-full select-none"
                        style={{
                          objectFit: photo.displayMode === "fit" ? "contain" : photo.displayMode === "stretch" ? "fill" : "cover",
                          objectPosition: `${photo.positionX * 100}% ${photo.positionY * 100}%`,
                          transform: `rotate(${photo.rotation}deg) scale(${rotationCoverScale(imageCellWidth, imageCellHeight, format.ratio, photo.displayMode, photo.rotation)}) scale(${photo.flipX ? -1 : 1}, ${photo.flipY ? -1 : 1}) scale(${photo.zoom})`,
                          transformOrigin: "center",
                          filter: getPhotoCssFilter(photo.filters, canvasScale),
                          opacity: (photoFilters?.opacity ?? 100) / 100,
                        }}
                      />
                      {colorOverlay && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute mix-blend-soft-light"
                        style={{ inset: 0, backgroundColor: colorOverlay.color, opacity: colorOverlay.opacity }}
                      />
                      )}
                      {gradientOverlay && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute"
                        style={{ inset: 0, backgroundImage: gradientOverlay }}
                      />
                      )}
                      {vignetteOpacity > 0 && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute"
                        style={{
                          inset: 0,
                          background: `radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,${vignetteOpacity}) 100%)`,
                        }}
                      />
                      )}
                      {(photoFilters?.grain ?? 0) > 0 && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute"
                        style={{
                          inset: 0,
                          opacity: (photoFilters?.grain ?? 0) / 100 * 0.3,
                          backgroundImage: "repeating-radial-gradient(circle at 20% 30%, rgba(0,0,0,.65) 0 0.45px, transparent .8px 2px), repeating-radial-gradient(circle at 70% 65%, rgba(255,255,255,.65) 0 0.45px, transparent .8px 2px)",
                          backgroundSize: "4px 4px, 5px 5px",
                        }}
                      />
                      )}
                    </span>
                    {!readOnly && !photo.locked && <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectPhoto(photo.id);
                      }}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        if (event.button !== 0) return;
                        onSelectPhoto(photo.id);
                        activeSlotDragRef.current = {
                          sourceSlotIndex: index,
                          targetSlotIndex: index,
                          pointerId: event.pointerId,
                        };
                        setDropTargetIndex(index);
                        event.currentTarget.setPointerCapture(event.pointerId);
                      }}
                      onPointerMove={(event) => {
                        const drag = activeSlotDragRef.current;
                        if (!drag || drag.pointerId !== event.pointerId) return;
                        const targetElement = document
                          .elementFromPoint(event.clientX, event.clientY)
                          ?.closest<HTMLElement>("[data-slot-index]");
                        const targetSlotIndex = Number(targetElement?.dataset.slotIndex);
                        if (Number.isInteger(targetSlotIndex)) {
                          activeSlotDragRef.current = { ...drag, targetSlotIndex };
                          setDropTargetIndex(targetSlotIndex);
                        } else {
                          activeSlotDragRef.current = {
                            ...drag,
                            targetSlotIndex: drag.sourceSlotIndex,
                          };
                          setDropTargetIndex(drag.sourceSlotIndex);
                        }
                      }}
                      onPointerUp={(event) => {
                        event.stopPropagation();
                        const drag = activeSlotDragRef.current;
                        if (drag?.pointerId === event.pointerId) {
                          if (drag.sourceSlotIndex !== drag.targetSlotIndex) {
                            onSwapSlots(drag.sourceSlotIndex, drag.targetSlotIndex);
                          }
                          activeSlotDragRef.current = null;
                          setDropTargetIndex(null);
                        }
                      }}
                      onPointerCancel={(event) => {
                        event.stopPropagation();
                        activeSlotDragRef.current = null;
                        setDropTargetIndex(null);
                      }}
                      onLostPointerCapture={() => {
                        activeSlotDragRef.current = null;
                        setDropTargetIndex(null);
                      }}
                      aria-label={`Drag photo ${index + 1} to another slot`}
                      title="Drag to move or swap this photo"
                      className="absolute left-2 top-2 flex h-8 w-8 touch-none cursor-grab items-center justify-center rounded-full bg-black/55 text-sm text-white shadow transition-opacity hover:bg-black/75 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white md:opacity-0 md:group-hover:opacity-100"
                    >
                      ⠿
                    </button>}
                    {!readOnly && !photo.locked && <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (selectedPhotoId === photo.id) onSelectPhoto(null);
                        onSelectStoryText(null);
                        removePhoto(photo.id);
                      }}
                      onPointerDown={(event) => event.stopPropagation()}
                      aria-label={`Remove photo ${index + 1}`}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-sm font-semibold text-white shadow transition-colors hover:bg-black/85 focus:outline-none focus:ring-2 focus:ring-white"
                    >
                      ×
                    </button>}
                  </>
                ) : readOnly ? (
                  <div className="h-full w-full" />
                ) : (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectPhoto(null);
                      onSelectStoryText(null);
                      onAddPhotoToSlot(index);
                    }}
                    aria-label={`Add photo to slot ${index + 1}`}
                    className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-sm bg-white text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-redwell-500"
                  >
                    <span aria-hidden="true" className="text-xl leading-none">+</span>
                  </button>
                )}
              </div>
            );
          })}

          {!readOnly && documentMode === "carousel" && storyText.length > 0 && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute z-[18] border border-dashed border-redwell-600/25"
              style={{ inset: `${CAROUSEL_TEXT_SAFE_AREA * 100}%` }}
            />
          )}

          {[...elements].filter((element) => element.visible !== false).sort((a, b) => a.zIndex - b.zIndex).map((element) => {
            const assetName = getCatalogElement(element.assetId)?.name ?? "Decorative";
            return (
            <div
              key={element.id}
              data-artwork-element-id={element.id}
              role={readOnly ? undefined : "button"}
              tabIndex={readOnly ? undefined : 0}
              aria-label={`${assetName} element${selectedElementId === element.id ? ", selected" : ""}`}
              aria-pressed={selectedElementId === element.id}
              onClick={(event) => {
                event.stopPropagation();
                onSelectPhoto(null);
                onSelectElement(element.id);
                onSelectStoryText(null);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                event.stopPropagation();
                onSelectPhoto(null);
                onSelectElement(element.id);
                onSelectStoryText(null);
              }}
              onPointerDown={(event) => {
                if (event.button !== 0 || (event.target as HTMLElement).dataset.resizeHandle === "true") return;
                event.stopPropagation();
                onSelectPhoto(null);
                onSelectElement(element.id);
                onSelectStoryText(null);
                if (element.locked) return;
                const rect = canvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                beginHistoryTransaction();
                activeElementDragRef.current = {
                  elementId: element.id,
                  pointerId: event.pointerId,
                  startX: event.clientX,
                  startY: event.clientY,
                  x: element.x,
                  y: element.y,
                  width: element.width,
                  height: element.height,
                  canvasWidth: rect.width,
                  canvasHeight: rect.height,
                  mode: "move",
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const drag = activeElementDragRef.current;
                if (!drag || drag.elementId !== element.id || drag.pointerId !== event.pointerId || drag.mode !== "move") return;
                const width = Math.min(1, Math.max(0.02, drag.width));
                const height = Math.min(1, Math.max(0.02, drag.height));
                updateElement(element.id, {
                  x: clampPosition(drag.x + (event.clientX - drag.startX) / drag.canvasWidth, width),
                  y: clampPosition(drag.y + (event.clientY - drag.startY) / drag.canvasHeight, height),
                }, "transient");
              }}
              onPointerUp={(event) => {
                const drag = activeElementDragRef.current;
                if (drag?.pointerId !== event.pointerId || drag.elementId !== element.id) return;
                activeElementDragRef.current = null;
                finishHistoryTransaction();
              }}
              onPointerCancel={(event) => {
                const drag = activeElementDragRef.current;
                if (drag?.pointerId !== event.pointerId || drag.elementId !== element.id) return;
                activeElementDragRef.current = null;
                finishHistoryTransaction();
              }}
              className={`absolute touch-none select-none ${readOnly ? "pointer-events-none" : `pointer-events-auto ${element.locked ? "cursor-default" : "cursor-move"} ${selectedElementId === element.id ? "outline outline-2 outline-offset-2 outline-redwell-500" : "hover:outline hover:outline-1 hover:outline-offset-1 hover:outline-redwell-300"}`}`}
              style={{
                left: `${element.x * 100}%`,
                top: `${element.y * 100}%`,
                width: `${element.width * 100}%`,
                height: `${element.height * 100}%`,
                zIndex: layerOrderByKey.get(`element:${element.id}`) ?? 0,
                opacity: element.opacity,
                transform: `translate(-50%, -50%) rotate(${element.rotation}deg) scale(${element.scaleX * (element.flipX ? -1 : 1)}, ${element.scaleY * (element.flipY ? -1 : 1)})`,
                transformOrigin: "center",
              }}
            >
              <ElementArtwork assetId={element.assetId} color={element.color} className="pointer-events-none h-full w-full object-contain" />
              {selectedElementId === element.id && !element.locked && (
                <button
                  type="button"
                  data-resize-handle="true"
                  aria-label="Resize element"
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    if (event.button !== 0) return;
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    beginHistoryTransaction();
                    activeElementDragRef.current = {
                      elementId: element.id,
                      pointerId: event.pointerId,
                      startX: event.clientX,
                      startY: event.clientY,
                      x: element.x,
                      y: element.y,
                      width: element.width,
                      height: element.height,
                      canvasWidth: rect.width,
                      canvasHeight: rect.height,
                      mode: "resize",
                    };
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onPointerMove={(event) => {
                    const drag = activeElementDragRef.current;
                    if (!drag || drag.elementId !== element.id || drag.pointerId !== event.pointerId || drag.mode !== "resize") return;
                    const startPixelSize = Math.min(drag.width * drag.canvasWidth, drag.height * drag.canvasHeight);
                    const deltaSize = Math.max(event.clientX - drag.startX, event.clientY - drag.startY);
                    const maxWidth = 2 * Math.min(element.x, 1 - element.x) * drag.canvasWidth;
                    const maxHeight = 2 * Math.min(element.y, 1 - element.y) * drag.canvasHeight;
                    const maxPixelSize = Math.max(28, Math.min(maxWidth, maxHeight));
                    const pixelSize = Math.min(maxPixelSize, Math.max(28, startPixelSize + deltaSize));
                    updateElement(element.id, {
                      width: Math.min(0.96, pixelSize / drag.canvasWidth),
                      height: Math.min(0.96, pixelSize / drag.canvasHeight),
                    }, "transient");
                  }}
                  onPointerUp={(event) => {
                    const drag = activeElementDragRef.current;
                    if (drag?.pointerId !== event.pointerId || drag.elementId !== element.id) return;
                    activeElementDragRef.current = null;
                    finishHistoryTransaction();
                  }}
                  onPointerCancel={(event) => {
                    const drag = activeElementDragRef.current;
                    if (drag?.pointerId !== event.pointerId || drag.elementId !== element.id) return;
                    activeElementDragRef.current = null;
                    finishHistoryTransaction();
                  }}
                  className="absolute -bottom-2 -right-2 z-50 h-6 w-6 touch-none rounded-full border-2 border-white bg-redwell-600 shadow md:h-4 md:w-4"
                />
              )}
            </div>
            );
          })}

          {storyText.filter((item) => item.visible !== false).map((item) => {
            const isEditing = editingStoryTextId === item.id;
            return (
            <div
              key={item.id}
              ref={isEditing ? storyTextEditRef : undefined}
              data-story-text-id={item.id}
              role={readOnly ? undefined : isEditing ? "textbox" : "button"}
              tabIndex={readOnly ? undefined : 0}
              contentEditable={!readOnly && isEditing && !item.locked}
              suppressContentEditableWarning
              aria-multiline={isEditing}
              aria-label={`Edit ${item.role}: ${item.text || "empty text block"}`}
              aria-pressed={!isEditing ? selectedStoryTextId === item.id : undefined}
              onDoubleClick={(event) => {
                if (readOnly || item.locked) return;
                event.preventDefault();
                event.stopPropagation();
                onSelectStoryText(item.id);
                storyTextEditValueRef.current = item.text;
                beginHistoryTransaction();
                setEditingStoryTextId(item.id);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape" && isEditing) {
                  event.preventDefault();
                  event.currentTarget.blur();
                  return;
                }
                if (isEditing) return;
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                event.stopPropagation();
                onSelectPhoto(null);
                onSelectElement(null);
                onSelectStoryText(item.id);
              }}
              onInput={(event) => {
                if (isEditing) {
                  updateStoryText(item.id, { text: event.currentTarget.innerText }, "transient");
                }
              }}
              onBlur={() => {
                if (isEditing) {
                  setEditingStoryTextId(null);
                  finishHistoryTransaction();
                }
              }}
              onClick={(event) => {
                event.stopPropagation();
                onSelectPhoto(null);
                onSelectElement(null);
                onSelectStoryText(item.id);
              }}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.stopPropagation();
                onSelectPhoto(null);
                onSelectElement(null);
                onSelectStoryText(item.id);
                if (item.locked || isEditing) return;
                const rect = canvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                beginHistoryTransaction();
                activeStoryTextDragRef.current = {
                  textId: item.id,
                  pointerId: event.pointerId,
                  startX: event.clientX,
                  startY: event.clientY,
                  x: item.x,
                  y: item.y,
                  width: event.currentTarget.offsetWidth / Math.max(rect.width, 1),
                  height: event.currentTarget.offsetHeight / Math.max(rect.height, 1),
                  canvasWidth: rect.width,
                  canvasHeight: rect.height,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const drag = activeStoryTextDragRef.current;
                if (!drag || drag.textId !== item.id || drag.pointerId !== event.pointerId) return;
                updateStoryText(item.id, {
                  x: Math.max(0, Math.min(1 - drag.width, drag.x + (event.clientX - drag.startX) / drag.canvasWidth)),
                  y: Math.max(0, Math.min(1 - drag.height, drag.y + (event.clientY - drag.startY) / drag.canvasHeight)),
                }, "transient");
              }}
              onPointerUp={(event) => {
                const drag = activeStoryTextDragRef.current;
                if (drag?.textId !== item.id || drag.pointerId !== event.pointerId) return;
                activeStoryTextDragRef.current = null;
                finishHistoryTransaction();
              }}
              onPointerCancel={(event) => {
                const drag = activeStoryTextDragRef.current;
                if (drag?.textId !== item.id || drag.pointerId !== event.pointerId) return;
                activeStoryTextDragRef.current = null;
                finishHistoryTransaction();
              }}
              className={`absolute z-10 inline-block w-max touch-none whitespace-pre-wrap ${isEditing ? "select-text" : "select-none"} ${readOnly ? "pointer-events-none" : `pointer-events-auto ${isEditing ? "cursor-text" : "cursor-move"}`}`}
              style={{
                left: `${item.x * 100}%`,
                top: `${item.y * 100}%`,
                width: "max-content",
                maxWidth: `${item.width * 100}%`,
                zIndex: layerOrderByKey.get(`storyText:${item.id}`) ?? 0,
                color: item.color,
                textAlign: item.textAlign,
                fontFamily: item.fontFamily === "serif" ? "Georgia, 'Times New Roman', serif" : "Inter, ui-sans-serif, system-ui, sans-serif",
                fontSize: `${item.fontSize * measuredCanvasWidth / format.width}px`,
                fontWeight: item.fontWeight,
                lineHeight: item.lineHeight,
                letterSpacing: `${item.letterSpacing * measuredCanvasWidth / format.width}px`,
                backgroundColor: item.backgroundColor,
                padding: item.padding ? `${item.padding * measuredCanvasWidth / format.width}px` : undefined,
                textShadow: item.textShadow,
                boxSizing: "border-box",
                overflowWrap: "anywhere",
              }}
            >
              {!isEditing && item.text}
            </div>
            );
          })}

          {!readOnly && selectedPhoto && selectedPhotoCell && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute z-[1000] rounded-sm border-2 border-redwell-500"
              style={{
                left: `${selectedPhotoCell.x * 100}%`,
                top: `${selectedPhotoCell.y * 100}%`,
                width: `${selectedPhotoCell.width * 100}%`,
                height: `${selectedPhotoCell.height * 100}%`,
                transform: selectedPhotoCell.rotation ? `rotate(${selectedPhotoCell.rotation}deg)` : undefined,
              }}
            />
          )}
          {!readOnly && selectedElement && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute z-[1000] border-2 border-redwell-500"
              style={{
                left: `${selectedElement.x * 100}%`,
                top: `${selectedElement.y * 100}%`,
                width: `${selectedElement.width * 100}%`,
                height: `${selectedElement.height * 100}%`,
                transform: `translate(-50%, -50%) rotate(${selectedElement.rotation}deg) scale(${selectedElement.scaleX * (selectedElement.flipX ? -1 : 1)}, ${selectedElement.scaleY * (selectedElement.flipY ? -1 : 1)})`,
                transformOrigin: "center",
              }}
            />
          )}
          {!readOnly && selectedStoryTextBounds && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute z-[1001] border-2 border-redwell-500"
              style={{ ...selectedStoryTextBounds, boxSizing: "border-box" }}
            />
          )}
          {!readOnly && photos.length === 0 && (
            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[1002] flex -translate-y-1/2 flex-col items-center px-4 text-center">
              <p className="text-sm font-semibold text-gray-800">Add your first photo</p>
              <p className="mt-1 text-xs text-gray-500">
                {documentMode === "carousel" ? "Start building this slide with an image." : "Your selected layout will be applied automatically."}
              </p>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onAddPhotoToSlot(0);
                }}
                className="pointer-events-auto mt-3 rounded-md bg-redwell-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-redwell-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500 focus-visible:ring-offset-2"
              >
                Add Photos
              </button>
            </div>
          )}
        </div>

        {!readOnly && hiddenPhotoCount > 0 && (
          <p className="mt-2 text-center text-xs text-gray-600">
            {hiddenPhotoCount} {hiddenPhotoCount === 1 ? "photo is" : "photos are"} kept in your
            project. Choose a layout with more cells to show them.
          </p>
        )}
      </div>
    </div>
  );
}

function clampFocus(value: number) {
  return Math.max(0, Math.min(1, value));
}

function clampPosition(value: number, size: number) {
  return Math.max(size / 2, Math.min(1 - size / 2, value));
}

function rotationCoverScale(
  cellWidth: number,
  cellHeight: number,
  canvasRatio: number,
  displayMode: PhotoDisplayMode,
  rotation: PhotoRotation
) {
  if (displayMode !== "fill" || rotation % 180 === 0) return 1;
  const cellAspectRatio = (cellWidth / cellHeight) * canvasRatio;
  return Math.max(cellAspectRatio, 1 / cellAspectRatio);
}
