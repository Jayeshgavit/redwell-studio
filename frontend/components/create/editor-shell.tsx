"use client";

import { resolveCreativeLayout } from "./carousel-composition";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { IconPalette, IconChevronDown, IconLayoutCollage } from "@tabler/icons-react";
import { TopBar } from "./top-bar";
import { Toolbar } from "./toolbar";
import { PhotoToolbar, type PhotoToolbarHandle } from "./photo-toolbar";
import { CollagePhotoLibrary } from "./collage-photo-library";
import { FabricCanvasComponent } from "./fabric-canvas";
import { LayoutPicker } from "./layout-picker";
import { ImageAdjustmentToolbar } from "./image-adjustment-toolbar";
import { CollageStyleToolbar } from "./collage-style-toolbar";
import { ElementsPanel } from "./elements-panel";
import { ElementToolbar } from "./element-toolbar";
import { ArtworkLayersPanel } from "./artwork-layers-panel";
import { ResizableDock, type DockPanelContent } from "./resizable-dock";
import { ExportDialog } from "./export-dialog";
import { ClearProjectDialog } from "./clear-project-dialog";
import { CarouselTimeline } from "./carousel-workspace";
import { CarouselAddSlideDialog } from "./carousel-add-slide-dialog";
import { CarouselDesignPanel } from "./carousel-design-panel";
import { getCarouselTheme } from "./carousel-themes";
import { CarouselTemplatePicker } from "./carousel-template-picker";
import { CarouselPreviewDialog } from "./carousel-preview-dialog";
import { CarouselStoryCopy } from "./carousel-story-copy";
import { CAROUSEL_STORY_LAYOUTS } from "./carousel-story-templates";
import { PhotoProvider, usePhotos, type HistoryBehavior } from "./photo-context";
import { CANVAS_FORMATS, COLLAGE_LAYOUTS, DEFAULT_COLLAGE_STYLE, EDITOR_TOOLS, type CarouselSlide, type CollageStyle, type DocumentMode, type EditorTool } from "@/types/editor";
import type { CanvasElement, CarouselStoryTextItem } from "@/types/editor";
import { getArtworkImageSources, getArtworkLayerStack, type ArtworkLayerEntry } from "./artwork-composition";
import { getCatalogElement } from "./elements/catalog";
import type { ArtworkLayerItem } from "./artwork-layers-panel";
import { useViewport } from "./use-viewport";
import { CanvasViewport } from "./canvas-viewport";
import { CanvasViewportControls } from "./canvas-viewport-controls";
import {
  parseLivePreviewMessage,
  type LivePreviewMessage,
  type LivePreviewState,
} from "./live-preview-protocol";

const WORKSPACE_STORAGE_KEY = "redwell-studio:workspace:v1";

function hasProjectArtwork(
  project: Pick<CarouselSlide, "photos" | "elements" | "storyText" | "collageStyle">,
  defaults: CollageStyle = DEFAULT_COLLAGE_STYLE
) {
  return project.photos.length > 0 || project.elements.length > 0 ||
    (project.storyText ?? []).some((item) => item.text.trim().length > 0) ||
    Boolean(project.collageStyle.backgroundImage) ||
    (Object.keys(DEFAULT_COLLAGE_STYLE) as Array<keyof typeof DEFAULT_COLLAGE_STYLE>)
      .some((key) => project.collageStyle[key] !== defaults[key]);
}
const COLLAGE_PANEL_HELP: Record<EditorTool, string> = {
  photos: "Upload, select, and adjust your images.",
  layouts: "Find a composition that gives each photo room.",
  elements: "Add a finishing touch. Select an element to transform it.",
  layers: "Control what sits in front, stays visible, or remains locked.",
  design: "Give your collage a headline, caption, or small detail.",
  style: "Set the space, edges, and background around your photos.",
};

function EditorContent() {
  const [activeTool, setActiveTool] = useState<EditorTool>("photos");
  const [openPanelIds, setOpenPanelIds] = useState<EditorTool[]>(["photos"]);
  const [dockWidth, setDockWidth] = useState(304);
  const [carouselDockWidth, setCarouselDockWidth] = useState<number | null>(null);
  const [workspaceRestored, setWorkspaceRestored] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isClearProjectOpen, setIsClearProjectOpen] = useState(false);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [isAddSlideOpen, setIsAddSlideOpen] = useState(false);
  const [isCarouselPreviewOpen, setIsCarouselPreviewOpen] = useState(false);
  const [previewChannelId, setPreviewChannelId] = useState<string | null>(null);
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);
  const photoToolbarRef = useRef<PhotoToolbarHandle>(null);
  const previewChannelRef = useRef<BroadcastChannel | null>(null);
  const publishedPreviewSourcesRef = useRef(new Set<string>());
  const previewSendGenerationRef = useRef(0);
  // Viewport zoom/pan — completely isolated from document state
  const viewport = useViewport();
  // Track the raw size of the canvas container area (without zoom applied)
  const [canvasContainerSize, setCanvasContainerSize] = useState<{ width: number; height: number } | null>(null);
  const {
    photos,
    slotAssignments,
    selectedLayoutId,
    canvasFormatId,
    collageStyle,
    documentMode,
    carousel,
    canUndo,
    canRedo,
    undo,
    redo,
    updatePhoto,
    replacePhoto,
    removePhoto,
    swapSlots,
    beginHistoryTransaction,
    finishHistoryTransaction,
    selectLayout,
    selectCanvasFormat,
    selectCarouselSlide,
    addCarouselSlide,
    duplicateCarouselSlide,
    deleteCarouselSlide,
    reorderCarouselSlide,
    applyCarouselTemplate,
    applyCarouselTheme,
    distributeCarouselPhotos,
    applyCarouselStoryLayout,
    setDocumentMode,
    elements,
    storyText,
    storyLayoutId,
    updateStoryText,
    addStoryText,
    removeStoryText,
    addElement,
    updateElement,
    removeElement,
    reorderLayer,
    clearProject,
  } = usePhotos();
  const [selectedLayer, setSelectedLayer] = useState<Pick<ArtworkLayerEntry, "kind" | "id"> | null>(null);
  const selectedPhotoId = selectedLayer?.kind === "photo" ? selectedLayer.id : null;
  const selectedElementId = selectedLayer?.kind === "element" ? selectedLayer.id : null;
  const selectedStoryTextId = selectedLayer?.kind === "storyText" ? selectedLayer.id : null;
  const selectedPhoto = photos.find((photo) => photo.id === selectedPhotoId) ?? null;
  const selectedElement = elements.find((element) => element.id === selectedElementId) ?? null;
  const selectedStoryText = storyText.find((item) => item.id === selectedStoryTextId) ?? null;
  const activeCarouselSlideId = carousel?.activeSlideId ?? null;
  const previousCarouselSlideIdRef = useRef(activeCarouselSlideId);

  useEffect(() => {
    if (previousCarouselSlideIdRef.current === activeCarouselSlideId) return;
    previousCarouselSlideIdRef.current = activeCarouselSlideId;
    setSelectedLayer(null);
  }, [activeCarouselSlideId]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (stored) {
        const value: unknown = JSON.parse(stored);
        if (isRecord(value)) {
          const restoredPanels: EditorTool[] = Array.isArray(value.openPanelIds)
            ? [...new Set(value.openPanelIds.filter(isEditorTool))]
            : ["photos"];
          const restoredActiveTool = isEditorTool(value.activeTool) && restoredPanels.includes(value.activeTool)
            ? value.activeTool
            : restoredPanels[0] ?? "photos";

          setOpenPanelIds(restoredPanels);
          setActiveTool(restoredActiveTool);
          if (typeof value.dockWidth === "number" && Number.isFinite(value.dockWidth)) {
            setDockWidth(Math.max(260, Math.min(520, value.dockWidth)));
          }
          if (typeof value.carouselDockWidth === "number" && Number.isFinite(value.carouselDockWidth)) {
            setCarouselDockWidth(Math.max(320, Math.min(520, value.carouselDockWidth)));
          }
        }
      }
    } catch {
      // Invalid or unavailable local preferences should not block the editor.
    }

    setWorkspaceRestored(true);
  }, []);

  useEffect(() => {
    if (!workspaceRestored) return;
    try {
      window.localStorage.setItem(
        WORKSPACE_STORAGE_KEY,
        JSON.stringify({ activeTool, openPanelIds, dockWidth, carouselDockWidth })
      );
    } catch {
      // The editor remains usable when browser storage is unavailable.
    }
  }, [activeTool, dockWidth, carouselDockWidth, openPanelIds, workspaceRestored]);

  useEffect(() => {
    if (!selectedLayer) return;
    const exists = selectedLayer.kind === "photo"
      ? photos.some((photo) => photo.id === selectedLayer.id)
      : selectedLayer.kind === "element"
        ? elements.some((element) => element.id === selectedLayer.id)
        : storyText.some((item) => item.id === selectedLayer.id);
    if (!exists) setSelectedLayer(null);
  }, [elements, photos, selectedLayer, storyText]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || isTypingTarget(event.target)) return;
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;

      const key = event.key.toLowerCase();
      if (key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (key === "y") {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [redo, undo]);
  const layoutPhotoCount = Math.max(1, Math.min(photos.length, 8));
  const defaultLayout =
    COLLAGE_LAYOUTS.find((layout) => layout.photoCount === layoutPhotoCount) ??
    COLLAGE_LAYOUTS[0];
  const currentLayout =
    resolveCreativeLayout(selectedLayoutId) ?? defaultLayout;
  const currentFormat =
    CANVAS_FORMATS.find((format) => format.id === canvasFormatId) ?? CANVAS_FORMATS[0];
  const isCollage = documentMode === "collage";
  const assignedPhotoCount = currentLayout.cells.filter((_, index) => photos.some((photo) => photo.id === slotAssignments[index])).length;
  const emptySlotCount = currentLayout.cells.length - assignedPhotoCount;
  const isEmptyCollage = isCollage && photos.length === 0 && elements.length === 0 && storyText.length === 0;
  const artworkLayers = useMemo(
    () => getArtworkLayerStack({ layout: currentLayout, photos, slotAssignments, elements, storyText }),
    [currentLayout, elements, photos, slotAssignments, storyText]
  );
  const artworkLayerItems = useMemo<ArtworkLayerItem[]>(
    () => artworkLayers
      .filter((layer) =>
        layer.kind !== "photo" || Object.values(slotAssignments).includes(layer.id)
      )
      .map((layer) => {
      if (layer.kind === "photo") {
        const photo = photos.find((item) => item.id === layer.id);
        const slot = Object.entries(slotAssignments).find(([, photoId]) => photoId === layer.id)?.[0];
        return {
          ...layer,
          typeLabel: "IMAGE",
          label: slot === undefined ? "Photo" : `Photo ${Number(slot) + 1}`,
          detail: isCollage ? "Select in Photos to crop or replace" : "",
          visible: photo?.visible !== false,
          locked: photo?.locked === true,
        };
      }
      if (layer.kind === "storyText") {
        const item = storyText.find((text) => text.id === layer.id);
        return {
          ...layer,
          typeLabel: "TEXT",
          label: item ? layerTextName(item.role) : "Text",
          detail: isCollage ? item?.text ?? "" : "",
          visible: item?.visible !== false,
          locked: item?.locked === true,
        };
      }
      const element = elements.find((item) => item.id === layer.id);
      return {
        ...layer,
        typeLabel: "ELEMENT",
        label: getLayerElementName(getCatalogElement(element?.assetId ?? "")?.name),
        detail: "",
        visible: element?.visible !== false,
        locked: element?.locked === true,
      };
      }),
    [artworkLayers, elements, isCollage, photos, slotAssignments, storyText]
  );
  const livePreviewState = useMemo<LivePreviewState>(
    () => ({
      documentMode,
      composition: {
        format: currentFormat,
        layout: currentLayout,
        photos,
        slotAssignments,
        collageStyle,
        elements,
        storyText,
      },
      slides: (carousel?.slides ?? []).map(({ id, order }) => ({ id, order })),
      activeSlideId: carousel?.activeSlideId ?? null,
    }),
    [
      carousel,
      collageStyle,
      currentFormat,
      currentLayout,
      documentMode,
      elements,
      photos,
      slotAssignments,
      storyText,
    ]
  );
  const livePreviewStateRef = useRef(livePreviewState);
  const carouselRef = useRef(carousel);
  livePreviewStateRef.current = livePreviewState;
  carouselRef.current = carousel;
  const sendLivePreviewState = useCallback(async (
    channel: BroadcastChannel,
    state: LivePreviewState,
    forcePhotoAssets = false
  ) => {
    const generation = ++previewSendGenerationRef.current;
    try {
      const pendingAssets = await Promise.all(
        getArtworkImageSources(state.composition)
          .filter((source) => forcePhotoAssets || !publishedPreviewSourcesRef.current.has(source))
          .filter((source) => source.startsWith("blob:"))
          .map(async (source) => {
            const response = await fetch(source);
            if (!response.ok) {
              throw new Error(`A preview photo could not be read (${response.status}).`);
            }
            return { source, blob: await response.blob() };
          })
      );
      if (generation !== previewSendGenerationRef.current) return;

      pendingAssets.forEach(({ source, blob }) => {
        channel.postMessage({
          type: "photo-asset",
          source,
          blob,
        } satisfies LivePreviewMessage);
        publishedPreviewSourcesRef.current.add(source);
      });
      getArtworkImageSources(state.composition).forEach((source) => {
        if (!source.startsWith("blob:")) {
          publishedPreviewSourcesRef.current.add(source);
        }
      });
      channel.postMessage({ type: "state", state } satisfies LivePreviewMessage);
      setPreviewNotice(null);
    } catch (sendError) {
      setPreviewNotice(
        sendError instanceof Error
          ? `Live Preview could not sync: ${sendError.message}`
          : "Live Preview could not sync the current photos."
      );
    }
  }, []);
  const sendLivePreviewStateRef = useRef(sendLivePreviewState);
  sendLivePreviewStateRef.current = sendLivePreviewState;

  useEffect(() => {
    const activeSources = new Set(getArtworkImageSources(livePreviewState.composition));
    publishedPreviewSourcesRef.current.forEach((source) => {
      if (!activeSources.has(source)) publishedPreviewSourcesRef.current.delete(source);
    });
  }, [livePreviewState]);

  useEffect(() => {
    if (!previewChannelId || typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(`redwell-studio-preview:${previewChannelId}`);
    previewChannelRef.current = channel;
    channel.onmessage = (event: MessageEvent<unknown>) => {
      const message = parseLivePreviewMessage(event.data);
      if (!message) return;
      if (message.type === "ready") {
        void sendLivePreviewStateRef.current(
          channel,
          livePreviewStateRef.current,
          true
        );
      } else if (
        message.type === "select-slide" &&
        carouselRef.current?.slides.some((slide) => slide.id === message.slideId)
      ) {
        selectCarouselSlide(message.slideId);
      }
    };

    const handlePageHide = () => {
      channel.postMessage({ type: "editor-disconnected" } satisfies LivePreviewMessage);
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      channel.close();
      if (previewChannelRef.current === channel) previewChannelRef.current = null;
    };
  }, [previewChannelId, selectCarouselSlide]);

  useEffect(() => {
    if (!previewChannelId) return;
    const timeout = window.setTimeout(() => {
      const channel = previewChannelRef.current;
      if (channel) void sendLivePreviewStateRef.current(channel, livePreviewState);
    }, 80);
    return () => window.clearTimeout(timeout);
  }, [livePreviewState, previewChannelId]);
  const availableLayouts = COLLAGE_LAYOUTS;
  const templatePreviewPhotos = carousel
    ? [...new Map(carousel.slides.flatMap((slide) => slide.photos).map((photo) => [photo.id, photo])).values()]
    : [];
  const isUnstartedCarousel = documentMode === "carousel" && carousel !== null && !carousel.templateId &&
    carousel.slides.every((slide) =>
      slide.photos.length === 0 && slide.elements.length === 0 && !(slide.storyText ?? []).some((item) => item.text.trim())
    );

  // Both modes render at document dimensions: 100% remains stable on resize.
  const { fitToContainer } = viewport;
  const { width: canvasWidth, height: canvasHeight } = currentFormat;
  const previousCanvasRef = useRef("");
  const canvasKey = `${documentMode}:${canvasWidth}:${canvasHeight}`;

  const handleFitToCanvas = useCallback(() => {
    if (!canvasContainerSize) return;
    fitToContainer(
      canvasContainerSize.width,
      canvasContainerSize.height,
      canvasWidth,
      canvasHeight
    );
  }, [canvasContainerSize, canvasWidth, canvasHeight, fitToContainer]);

  useLayoutEffect(() => {
    if (!canvasContainerSize || canvasContainerSize.width <= 0 || canvasContainerSize.height <= 0) return;
    // ResizeObserver measures the stage after chrome, dock and filmstrip layout.
    // Keep Fit live, but leave manual zoom/pan alone until Fit or a format/mode change.
    if (viewport.state.isFitted || previousCanvasRef.current !== canvasKey) handleFitToCanvas();
    previousCanvasRef.current = canvasKey;
  }, [canvasContainerSize, canvasKey, handleFitToCanvas, viewport.state.isFitted]);

  const handleContainerResize = useCallback((width: number, height: number) => {
    setCanvasContainerSize((previous) => previous?.width === width && previous.height === height
      ? previous
      : { width, height });
  }, []);

  const handleOpenPanel = (tool: EditorTool) => {
    setActiveTool(tool);
    setOpenPanelIds((current) => current.includes(tool) ? current : [...current, tool]);
  };

  const handleClosePanel = (panelId: EditorTool) => {
    const remainingPanels = openPanelIds.filter((id) => id !== panelId);
    setOpenPanelIds(remainingPanels);
    if (activeTool === panelId && remainingPanels.length > 0) {
      setActiveTool(remainingPanels[remainingPanels.length - 1]);
    }
  };

  const handlePhotoSelect = (photoId: string | null) => {
    if (photoId) {
      setSelectedLayer({ kind: "photo", id: photoId });
      handleOpenPanel("photos");
    } else {
      setSelectedLayer((current) => current?.kind === "photo" ? null : current);
    }
  };

  const handleElementSelect = (elementId: string | null) => {
    if (elementId) {
      setSelectedLayer({ kind: "element", id: elementId });
      handleOpenPanel("elements");
    } else {
      setSelectedLayer((current) => current?.kind === "element" ? null : current);
    }
  };

  const handleStoryTextSelect = (textId: string | null) => {
    if (textId) {
      setSelectedLayer({ kind: "storyText", id: textId });
      handleOpenPanel("design");
    } else {
      setSelectedLayer((current) => current?.kind === "storyText" ? null : current);
    }
  };

  const handleDocumentModeChange = (mode: DocumentMode) => {
    setSelectedLayer(null);
    setDocumentMode(mode);
  };

  const handleCarouselSlideChange = (slideId: string) => {
    setSelectedLayer(null);
    selectCarouselSlide(slideId);
  };

  const handleAddCarouselSlide = (presetId?: string) => {
    setSelectedLayer(null);
    addCarouselSlide(presetId);
    setIsAddSlideOpen(false);
    handleOpenPanel(presetId === "photo" || presetId === "comparison" ? "photos" : "design");
  };

  const handleDuplicateCarouselSlide = () => {
    setSelectedLayer(null);
    duplicateCarouselSlide();
  };

  const handleDeleteCarouselSlide = () => {
    setSelectedLayer(null);
    deleteCarouselSlide();
  };

  const handleDeleteElement = (elementId: string) => {
    removeElement(elementId);
    setSelectedLayer((current) =>
      current?.kind === "element" && current.id === elementId ? null : current
    );
  };

  const handleDeleteStoryText = (textId: string) => {
    removeStoryText(textId);
    setSelectedLayer((current) =>
      current?.kind === "storyText" && current.id === textId ? null : current
    );
  };

  const handleToggleLayerVisibility = (kind: ArtworkLayerEntry["kind"], id: string) => {
    if (kind === "photo") {
      const photo = photos.find((item) => item.id === id);
      if (photo) updatePhoto(id, { visible: photo.visible === false });
    } else if (kind === "storyText") {
      const item = storyText.find((text) => text.id === id);
      if (item) updateStoryText(id, { visible: item.visible === false });
    } else {
      const element = elements.find((item) => item.id === id);
      if (element) updateElement(id, { visible: element.visible === false });
    }
  };

  const handleToggleLayerLock = (kind: ArtworkLayerEntry["kind"], id: string) => {
    if (kind === "photo") {
      const photo = photos.find((item) => item.id === id);
      if (photo) updatePhoto(id, { locked: photo.locked !== true });
    } else if (kind === "storyText") {
      const item = storyText.find((text) => text.id === id);
      if (item) updateStoryText(id, { locked: item.locked !== true });
    } else {
      const element = elements.find((item) => item.id === id);
      if (element) updateElement(id, { locked: element.locked !== true });
    }
  };

  const handleApplyCarouselTemplate = (templateId: string) => {
    applyCarouselTemplate(templateId);
    setSelectedLayer(null);
    setIsTemplatePickerOpen(false);
    handleOpenPanel("design");
  };

  const handleDuplicateElement = (element: CanvasElement) => {
    const duplicate: CanvasElement = {
      ...element,
      id: crypto.randomUUID(),
      x: clampNormalized(element.x + 0.025, element.width),
      y: clampNormalized(element.y + 0.025, element.height),
      zIndex: Math.max(0, ...elements.map((item) => item.zIndex)) + 1,
    };
    addElement(duplicate);
    handleElementSelect(duplicate.id);
  };

  const panels: DockPanelContent[] = [
    {
      id: "photos",
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => photoToolbarRef.current?.openPicker()}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-redwell-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-redwell-700 active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500 focus-visible:ring-offset-2"
            >
              <span aria-hidden="true">{"+"}</span>
              <span className="whitespace-nowrap">Add Photos</span>
            </button>
            {!isCollage && <p className="text-xs leading-relaxed text-brand-muted">
              {photos.length > 0
                ? `${photos.length} ${photos.length === 1 ? "photo" : "photos"} on this ${documentMode === "carousel" ? "slide" : "collage"}. Empty slots stay in place when you add or remove photos.`
                : `Add photos to start your ${documentMode === "carousel" ? "slide" : "collage"}. Photos stay in their assigned slots.`}
            </p>}
          </div>
          {<CollagePhotoLibrary
            photos={photos}
            slotAssignments={slotAssignments}
            slotCount={currentLayout.cells.length}
            selectedPhotoId={selectedPhotoId}
            onSelect={handlePhotoSelect}
            onBrowseLayouts={() => handleOpenPanel("layouts")}
          />}
          {!isCollage && photos.some((photo) => !Object.values(slotAssignments).includes(photo.id)) && <button type="button" onClick={() => { distributeCarouselPhotos(); setSelectedLayer(null); }} className="min-h-10 w-full rounded border border-brand-border px-3 py-2 text-xs font-semibold text-brand-ink hover:bg-brand-neutral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">Turn unplaced photos into slides</button>}
          {selectedPhoto && (
            selectedPhoto.locked ? (
              <p className="border-l-2 border-brand-accent pl-3 py-2 text-xs leading-relaxed text-brand-muted">
                This photo is locked. Unlock it in Layers to adjust or move it.
              </p>
            ) : (
              <ImageAdjustmentToolbar
                photo={selectedPhoto}
                onReplacePhoto={selectedPhoto
                  ? () => photoToolbarRef.current?.openPickerForPhoto(selectedPhoto.id)
                  : undefined}
                onRemovePhoto={selectedPhoto
                  ? () => {
                      removePhoto(selectedPhoto.id);
                      setSelectedLayer((current) =>
                        current?.kind === "photo" && current.id === selectedPhoto.id ? null : current
                      );
                    }
                  : undefined}
                onUpdate={updatePhoto}
                onBeginTransaction={beginHistoryTransaction}
                onFinishTransaction={finishHistoryTransaction}
              />
            )
          )}
        </div>
      ),
    },
    {
      id: "layouts",
      content: (
        <LayoutPicker
          embedded
          previewFormat={currentFormat}
          availableLayouts={availableLayouts}
          carouselStoryLayouts={CAROUSEL_STORY_LAYOUTS}
          previewPhotos={photos}
          carouselStyle={collageStyle}
          isCollage={documentMode === "collage"}
          isCarousel={documentMode === "carousel"}
          photoCount={layoutPhotoCount}
          selectedLayoutId={selectedLayoutId}
          onSelect={selectLayout}
          selectedStoryLayoutId={storyLayoutId}
          onSelectStoryLayout={applyCarouselStoryLayout}
        />
      ),
    },
    {
      id: "elements",
      content: (
        <div className="space-y-4">
          <div>
            {selectedElement && !selectedStoryText && !selectedElement.locked && (
              <ElementToolbar
                element={selectedElement}
                formatRatio={currentFormat.ratio}
                onUpdate={(id, updates, historyBehavior = "commit") => updateElement(id, updates, historyBehavior)}
                onDelete={handleDeleteElement}
                onDuplicate={handleDuplicateElement}
                onBeginTransaction={beginHistoryTransaction}
                onFinishTransaction={finishHistoryTransaction}
              />
            )}
            {selectedElement?.locked && (
              <p className="border-l-2 border-brand-accent pl-3 py-2 text-xs leading-relaxed text-brand-muted">
                This element is locked. Unlock it in Layers to edit or move it.
              </p>
            )}
          </div>
          {!selectedStoryText && (
            <ElementsPanel
              isCollage={isCollage}
              format={currentFormat}
              selectedAssetId={selectedElement?.assetId ?? null}
              onAdd={(element) => {
                addElement(element);
                handleElementSelect(element.id);
              }}
            />
          )}
        </div>
      ),
    },
    {
      id: "design",
      content: (
        <div className="space-y-4">
          <CarouselStoryCopy
            isCollage={isCollage}
            items={storyText}
            selectedItemId={selectedStoryText?.id ?? null}
            canAdd={storyText.length < (isCollage ? 8 : 32)}
            onSelect={handleStoryTextSelect}
            onBrowseElements={() => {
              setSelectedLayer((current) => current?.kind === "storyText" ? null : current);
              handleOpenPanel("elements");
            }}
            onUpdate={updateStoryText}
            onAdd={(role) => { const id = addStoryText(role); if (!isCollage) handleStoryTextSelect(id); }}
            onRemove={handleDeleteStoryText}
            onBeginTransaction={beginHistoryTransaction}
            onFinishTransaction={finishHistoryTransaction}
          />
        </div>
      ),
    },
    {
      id: "layers",
      content: (
        <div className="space-y-4">
        {isCollage && selectedLayer && <button type="button" onClick={() => {
          if (selectedLayer.kind === "photo") handlePhotoSelect(selectedLayer.id);
          else if (selectedLayer.kind === "element") handleElementSelect(selectedLayer.id);
          else handleStoryTextSelect(selectedLayer.id);
        }} className="w-full rounded-md border border-brand-border px-3 py-2 text-xs font-semibold text-brand-ink hover:bg-brand-neutral focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">Edit selected {selectedLayer.kind === "storyText" ? "text" : selectedLayer.kind} →</button>}
        <ArtworkLayersPanel
          items={artworkLayerItems}
          selectedLayer={selectedLayer}
          onSelect={(kind, id) => setSelectedLayer({ kind, id })}
          onToggleVisibility={handleToggleLayerVisibility}
          onToggleLock={handleToggleLayerLock}
          onReorder={(direction) => {
            if (selectedLayer) reorderLayer(selectedLayer.kind, selectedLayer.id, direction);
          }}
        />
        </div>
      ),
    },
    { id: "style", content: <>{!isCollage && carousel && <CarouselDesignPanel carousel={carousel} onTheme={applyCarouselTheme} />}<CollageStyleToolbar /></> },
  ];
  const dockPanels = panels.map((panel) => ({ ...panel, content: <>
    <div className="mb-3 border-b border-brand-border pb-3">
      <h2 className="sr-only">{EDITOR_TOOLS.find((tool) => tool.id === panel.id)?.label}</h2>
      <p className="text-xs leading-relaxed text-brand-muted">{isCollage ? COLLAGE_PANEL_HELP[panel.id] : COLLAGE_PANEL_HELP[panel.id].replace("collage", "slide")}</p>
    </div>
    {panel.content}
  </> }));

  const handleExport = () => setIsExportOpen(true);
  const handleOpenLivePreview = () => {
    if (typeof BroadcastChannel === "undefined") {
      setPreviewNotice("Live Preview is unavailable because this browser does not support BroadcastChannel.");
      return;
    }

    const id = previewChannelId ?? crypto.randomUUID();
    if (!previewChannelId) {
      publishedPreviewSourcesRef.current.clear();
      setPreviewChannelId(id);
    }
    try {
      const previewWindow = window.open(
        `/preview?channel=${encodeURIComponent(id)}`,
        "redwell-studio-live-preview"
      );
      setPreviewNotice(
        previewWindow
          ? null
          : "Allow pop-ups for Redwell Studio to open Live Preview in a new tab."
      );
    } catch {
      setPreviewNotice("The Live Preview tab could not be opened.");
    }
  };
  const handleClearProject = () => {
    clearProject();
    setSelectedLayer(null);
    setIsClearProjectOpen(false);
    handleFitToCanvas();
  };
  const handleNewProject = () => {
    const hasWork = isCollage
      ? hasProjectArtwork({ photos, elements, storyText, collageStyle })
      : Boolean(carousel && (
        carousel.slides.length > 1 || carousel.templateId ||
        (carousel.themeId && carousel.themeId !== "redwell") ||
        carousel.slides.some((slide) => hasProjectArtwork(slide, { ...DEFAULT_COLLAGE_STYLE, ...slide.themeDefaults }))
      ));
    if (hasWork) setIsClearProjectOpen(true);
    else handleClearProject();
  };

  return (
    <div data-mode={documentMode} className="editor-workspace flex h-[100dvh] flex-col overflow-hidden bg-brand-paper text-brand-ink">
      <TopBar
        isCollage={isCollage}
        documentMode={documentMode}
        onPreview={isCollage ? handleOpenLivePreview : () => setIsCarouselPreviewOpen(true)}
        onExport={handleExport}
        onNew={handleNewProject}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />
      {previewNotice && (
        <p
          role="status"
          className="fixed right-3 top-16 z-[60] max-w-sm rounded-md border border-redwell-200 bg-brand-accent-soft px-3 py-2 text-xs text-redwell-700"
        >
          {previewNotice}
        </p>
      )}
      <div className="editor-workspace-body flex min-h-0 flex-1 pb-16 pt-14 md:pb-0">
        <Toolbar
          focusedChrome
          activeTool={openPanelIds.includes(activeTool) ? activeTool : null}
          onToolSelect={handleOpenPanel}
        />
        <PhotoToolbar ref={photoToolbarRef} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col md:ml-16 md:flex-row">
          <main className="editor-main flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="editor-controls flex shrink-0 border-b border-brand-border bg-brand-paper px-3 py-1.5">
              {isCollage ? <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <select aria-label="Editor mode" value={documentMode} onChange={(event) => handleDocumentModeChange(event.target.value as DocumentMode)} className="h-9 max-w-full rounded-md border border-brand-border bg-brand-paper px-2 text-xs font-semibold text-brand-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"><option value="collage">Collage</option><option value="carousel">Carousel</option></select>
                  <label className="flex min-w-0 items-center gap-2 text-[11px] font-medium text-brand-muted">
                    <span className="hidden lg:inline">Format</span>
                    <select aria-label="Canvas format" value={canvasFormatId} onChange={(event) => selectCanvasFormat(event.target.value)} className="h-9 min-w-0 max-w-full rounded-md border border-brand-border bg-brand-surface px-2 text-xs font-medium text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">
                      {CANVAS_FORMATS.map((format) => <option key={format.id} value={format.id}>{format.name} · {format.id === "square" ? "1:1" : format.id === "portrait" ? "4:5" : format.id === "story" ? "9:16" : "16:9"}</option>)}
                    </select>
                  </label>
                </div>
                <CanvasViewportControls viewport={viewport} onFit={handleFitToCanvas} />
              </div> :
              <div className="carousel-controls-row flex w-full min-w-0 items-center justify-between gap-2">
                <div className="carousel-controls-actions flex min-w-0 items-center gap-1">
                  <select aria-label="Editor mode" value={documentMode} onChange={(event) => handleDocumentModeChange(event.target.value as DocumentMode)} className="h-9 rounded border border-brand-border bg-brand-paper px-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"><option value="collage">Collage</option><option value="carousel">Carousel</option></select>
                  <select aria-label="Format for all carousel slides" value={canvasFormatId} onChange={(event) => selectCanvasFormat(event.target.value)} className="h-9 min-w-0 rounded border border-brand-border bg-brand-surface px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">
                    {CANVAS_FORMATS.map((format) => <option key={format.id} value={format.id}>{format.name} · All slides</option>)}
                  </select>
                  <button type="button" onClick={() => handleOpenPanel("style")} aria-expanded={activeTool === "style" && openPanelIds.includes("style")} aria-controls="dock-panel-style" data-active={activeTool === "style" && openPanelIds.includes("style")} title="Open theme and style controls" className="carousel-action carousel-action-secondary"><IconPalette size={15} aria-hidden="true" />Theme<span className="hidden xl:inline"> · {getCarouselTheme(carousel?.themeId)?.name ?? "Custom"}</span><IconChevronDown size={13} aria-hidden="true" /></button>
                  <button type="button" onClick={() => setIsTemplatePickerOpen(true)} aria-haspopup="dialog" aria-expanded={isTemplatePickerOpen} data-active={isTemplatePickerOpen} title={isUnstartedCarousel ? "Start with a story arc, then make it yours." : "Story templates"} className="carousel-action carousel-action-creative"><IconLayoutCollage size={15} aria-hidden="true" />{isUnstartedCarousel ? "Choose a story" : "Templates"}</button>
                  {isUnstartedCarousel && <button type="button" onClick={() => photoToolbarRef.current?.openPicker()} className="h-9 whitespace-nowrap rounded px-2 text-xs font-medium text-brand-muted hover:bg-brand-neutral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">Add photos first</button>}
                </div>
                <CanvasViewportControls viewport={viewport} onFit={handleFitToCanvas} />
              </div>
              }
            </div>
            {isEmptyCollage && <div className="editor-onboarding hidden shrink-0 flex-wrap items-center justify-between gap-3 border-b border-brand-border bg-brand-surface px-3 py-2 sm:flex">
              <div className="min-w-0"><h1 className="text-lg font-semibold leading-tight tracking-[-0.04em] sm:text-2xl">Make room for your photos.</h1><p className="mt-1 hidden text-xs leading-relaxed text-brand-muted sm:block">Set your format above. Choose a layout or upload photos to start.</p></div>
              <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => handleOpenPanel("layouts")} className="h-9 rounded-md border border-brand-border px-3 text-xs font-semibold text-brand-ink hover:bg-brand-neutral focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">Choose layout</button><button type="button" onClick={() => photoToolbarRef.current?.openPicker()} className="h-9 rounded-md bg-brand-ink px-3 text-xs font-semibold text-brand-surface hover:bg-brand-ink/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">Add photos</button></div>
            </div>}
            <div className="relative min-h-0 flex-1">
              {/* CanvasViewport applies CSS zoom+pan only — never modifies document data */}
              <CanvasViewport viewport={viewport} onContainerResize={handleContainerResize}>
                <FabricCanvasComponent
                  format={currentFormat}
                  layout={currentLayout}
                  selectedPhotoId={selectedPhotoId}
                  onSelectPhoto={handlePhotoSelect}
                  selectedElementId={selectedElementId}
                  onSelectElement={handleElementSelect}
                  selectedStoryTextId={selectedStoryTextId}
                  onSelectStoryText={handleStoryTextSelect}
                  onSwapSlots={swapSlots}
                  onAddPhotoToSlot={(slotIndex) =>
                    photoToolbarRef.current?.openPickerForSlot(slotIndex)
                  }
                  naturalSize
                />
              </CanvasViewport>
            </div>
            {isCollage && <div className="editor-status flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-brand-border bg-brand-paper px-3 py-1 text-[10px] text-brand-muted">
              <p className="min-w-0"><span className="font-medium text-brand-ink">{currentFormat.width} × {currentFormat.height}</span> px · {assignedPhotoCount}/{currentLayout.cells.length} slots filled{emptySlotCount > 0 ? ` · ${emptySlotCount} empty` : ""}</p>
              <p className="hidden lg:block">Scroll to zoom · Space + drag to pan · Fit to recenter</p>
            </div>}
            {documentMode === "carousel" && carousel && (
              <CarouselTimeline
                carousel={carousel}
                onSelect={handleCarouselSlideChange}
                onAdd={() => setIsAddSlideOpen(true)}
                onDuplicate={handleDuplicateCarouselSlide}
                onDelete={handleDeleteCarouselSlide}
                onReorder={reorderCarouselSlide}
                templatesOpen={isTemplatePickerOpen}
                addSlideOpen={isAddSlideOpen}
                onTemplates={() => setIsTemplatePickerOpen(true)}
              />
            )}
          </main>
          <ResizableDock
            compact={documentMode === "carousel"}
            focusedChrome
            panels={dockPanels}
            openPanelIds={openPanelIds}
            activePanelId={activeTool}
            width={documentMode === "carousel" ? carouselDockWidth : dockWidth}
            onWidthChange={documentMode === "carousel" ? setCarouselDockWidth : setDockWidth}
            onSelectPanel={setActiveTool}
            onClosePanel={handleClosePanel}
            onCollapse={() => setOpenPanelIds([])}
            onDockPanel={handleOpenPanel}
          />
        </div>
      </div>
      {isExportOpen && (
        <ExportDialog
          documentMode={documentMode}
          carousel={carousel}
          format={currentFormat}
          layout={currentLayout}
          photos={photos}
          slotAssignments={slotAssignments}
          collageStyle={collageStyle}
          elements={elements}
          storyText={storyText}
          onClose={() => setIsExportOpen(false)}
        />
      )}
      <ClearProjectDialog
        open={isClearProjectOpen}
        onCancel={() => setIsClearProjectOpen(false)}
        onConfirm={handleClearProject}
        onExport={() => {
          setIsClearProjectOpen(false);
          handleExport();
        }}
      />
      {isAddSlideOpen && !isCollage && <CarouselAddSlideDialog onClose={() => setIsAddSlideOpen(false)} onAdd={handleAddCarouselSlide} />}
      <CarouselTemplatePicker
        open={isTemplatePickerOpen && documentMode === "carousel"}
        previewPhotos={templatePreviewPhotos}
        previewStyle={collageStyle}
        hasExistingStory={!isUnstartedCarousel}
        onClose={() => setIsTemplatePickerOpen(false)}
        onApply={handleApplyCarouselTemplate}
      />
      {isCarouselPreviewOpen && documentMode === "carousel" && carousel && (
        <CarouselPreviewDialog
          carousel={carousel}
          onClose={() => setIsCarouselPreviewOpen(false)}
          onEdit={(slideId) => { handleCarouselSlideChange(slideId); setIsCarouselPreviewOpen(false); }}
        />
      )}
    </div>
  );
}

function clampNormalized(position: number, size: number) {
  return Math.max(size / 2, Math.min(1 - size / 2, position));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEditorTool(value: unknown): value is EditorTool {
  return typeof value === "string" && EDITOR_TOOLS.some((tool) => tool.id === value);
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

function layerTextName(role: CarouselStoryTextItem["role"]) {
  const names: Record<CarouselStoryTextItem["role"], string> = {
    eyebrow: "Small label",
    title: "Headline",
    subtitle: "Subtitle",
    body: "Caption",
    metadata: "Date",
    location: "Location",
    quote: "Quote",
    cta: "Badge",
  };
  return names[role];
}

function getLayerElementName(name?: string) {
  if (!name) return "Element";
  const readableName = name.replace(/^hand-drawn\s+/i, "").replace(/\s+icon$/i, "");
  return readableName[0].toUpperCase() + readableName.slice(1);
}

export function EditorShell() {
  return (
    <PhotoProvider>
      <EditorContent />
    </PhotoProvider>
  );
}
