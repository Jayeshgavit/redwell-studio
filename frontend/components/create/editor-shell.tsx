"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "./top-bar";
import { Toolbar } from "./toolbar";
import { PhotoToolbar, type PhotoToolbarHandle } from "./photo-toolbar";
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
import { CarouselNavigation, CarouselTimeline } from "./carousel-workspace";
import { CarouselTemplatePicker } from "./carousel-template-picker";
import { CarouselPreviewDialog } from "./carousel-preview-dialog";
import { CarouselStoryCopy } from "./carousel-story-copy";
import { CAROUSEL_STORY_LAYOUTS } from "./carousel-story-templates";
import { PhotoProvider, usePhotos, type HistoryBehavior } from "./photo-context";
import { CANVAS_FORMATS, COLLAGE_LAYOUTS, EDITOR_TOOLS, type DocumentMode, type EditorTool } from "@/types/editor";
import type { CanvasElement, CarouselStoryTextItem } from "@/types/editor";
import { getArtworkLayerStack, type ArtworkLayerEntry } from "./artwork-composition";
import { getCatalogElement } from "./elements/catalog";
import type { ArtworkLayerItem } from "./artwork-layers-panel";
import { useViewport } from "./use-viewport";
import { CanvasViewport } from "./canvas-viewport";
import { CanvasViewportControls } from "./canvas-viewport-controls";
import { MAX_CANVAS_WIDTH } from "./fabric-canvas";
import {
  parseLivePreviewMessage,
  type LivePreviewMessage,
  type LivePreviewState,
} from "./live-preview-protocol";

const WORKSPACE_STORAGE_KEY = "redwell-studio:workspace:v1";

function EditorContent() {
  const [activeTool, setActiveTool] = useState<EditorTool>("photos");
  const [openPanelIds, setOpenPanelIds] = useState<EditorTool[]>(["photos"]);
  const [dockWidth, setDockWidth] = useState(352);
  const [workspaceRestored, setWorkspaceRestored] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isClearProjectOpen, setIsClearProjectOpen] = useState(false);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
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
        JSON.stringify({ activeTool, openPanelIds, dockWidth })
      );
    } catch {
      // The editor remains usable when browser storage is unavailable.
    }
  }, [activeTool, dockWidth, openPanelIds, workspaceRestored]);

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
    COLLAGE_LAYOUTS.find((layout) => layout.id === selectedLayoutId) ?? defaultLayout;
  const currentFormat =
    CANVAS_FORMATS.find((format) => format.id === canvasFormatId) ?? CANVAS_FORMATS[0];
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
          detail: "",
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
          detail: "",
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
    [artworkLayers, elements, photos, slotAssignments, storyText]
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
        [...new Set(state.composition.photos.map((photo) => photo.src))]
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
      state.composition.photos.forEach((photo) => {
        if (!photo.src.startsWith("blob:")) {
          publishedPreviewSourcesRef.current.add(photo.src);
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
    const activeSources = new Set(livePreviewState.composition.photos.map((photo) => photo.src));
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
  const availableLayouts = documentMode === "collage"
    ? COLLAGE_LAYOUTS
    : COLLAGE_LAYOUTS.filter(
        (layout) => layout.photoCount === layoutPhotoCount || layout.id === selectedLayoutId
      );
  const templatePreviewPhotos = carousel
    ? [...new Map(carousel.slides.flatMap((slide) => slide.photos).map((photo) => [photo.id, photo])).values()]
    : [];
  const isUnstartedCarousel = documentMode === "carousel" && carousel !== null && !carousel.templateId &&
    carousel.slides.every((slide) =>
      slide.photos.length === 0 && slide.elements.length === 0 && !(slide.storyText ?? []).some((item) => item.text.trim())
    );

  // Compute the natural (unzoomed) canvas pixel dimensions for fit-to-canvas
  const naturalCanvasWidth = canvasContainerSize
    ? Math.max(1, Math.min(MAX_CANVAS_WIDTH, canvasContainerSize.width - 32, (canvasContainerSize.height - 32) * currentFormat.ratio))
    : MAX_CANVAS_WIDTH;
  const naturalCanvasHeight = naturalCanvasWidth / currentFormat.ratio;

  const handleFitToCanvas = useCallback(() => {
    if (!canvasContainerSize) return;
    viewport.fitToContainer(
      canvasContainerSize.width,
      canvasContainerSize.height,
      naturalCanvasWidth,
      naturalCanvasHeight
    );
  }, [canvasContainerSize, naturalCanvasWidth, naturalCanvasHeight, viewport]);

  const handleContainerResize = useCallback((width: number, height: number) => {
    setCanvasContainerSize({ width, height });
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

  const handleAddCarouselSlide = () => {
    setSelectedLayer(null);
    addCarouselSlide();
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
    handleOpenPanel("elements");
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
              <span aria-hidden="true">📷</span>
              <span className="whitespace-nowrap">Add Photos</span>
            </button>
            <p className="text-xs leading-relaxed text-brand-muted">
              {photos.length > 0
                ? `${photos.length} ${photos.length === 1 ? "photo" : "photos"} on this ${documentMode === "carousel" ? "slide" : "collage"}. Empty slots stay in place when you add or remove photos.`
                : `Add photos to start your ${documentMode === "carousel" ? "slide" : "collage"}. Photos stay in their assigned slots.`}
            </p>
          </div>
          {selectedPhoto && (
            selectedPhoto.locked ? (
              <p className="border-l-2 border-brand-accent pl-3 py-2 text-xs leading-relaxed text-brand-muted">
                This photo is locked. Unlock it in Layers to adjust or move it.
              </p>
            ) : (
              <ImageAdjustmentToolbar
                photo={selectedPhoto}
                onReplacePhoto={documentMode === "carousel" && selectedPhoto
                  ? () => photoToolbarRef.current?.openPickerForPhoto(selectedPhoto.id)
                  : undefined}
                onRemovePhoto={documentMode === "carousel" && selectedPhoto
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
          {documentMode === "carousel" && storyLayoutId && !selectedElement && (
            <CarouselStoryCopy
              items={storyText}
              selectedItemId={selectedStoryText?.id ?? null}
              canAdd={storyText.length < 8}
              onSelect={handleStoryTextSelect}
              onBrowseElements={() => {
                setSelectedLayer((current) => current?.kind === "storyText" ? null : current);
                handleOpenPanel("elements");
              }}
              onUpdate={updateStoryText}
              onAdd={() => addStoryText()}
              onRemove={handleDeleteStoryText}
              onBeginTransaction={beginHistoryTransaction}
              onFinishTransaction={finishHistoryTransaction}
            />
          )}
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
          <div className="rounded-md border border-brand-border bg-brand-paper p-3">
            <h2 className="text-xs font-semibold text-brand-ink">Editorial text</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-brand-muted">
              Add a headline, subtitle, caption, date or location, small label, or badge. Drag text on the canvas to place it.
            </p>
          </div>
          <CarouselStoryCopy
            items={storyText}
            selectedItemId={selectedStoryText?.id ?? null}
            canAdd={storyText.length < 8}
            onSelect={handleStoryTextSelect}
            onBrowseElements={() => {
              setSelectedLayer((current) => current?.kind === "storyText" ? null : current);
              handleOpenPanel("elements");
            }}
            onUpdate={updateStoryText}
            onAdd={() => addStoryText()}
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
      ),
    },
    { id: "style", content: <CollageStyleToolbar /> },
  ];

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
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-brand-paper text-brand-ink">
      <TopBar
        onPreview={handleOpenLivePreview}
        onExport={handleExport}
        onClear={() => setIsClearProjectOpen(true)}
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
      <div className="flex min-h-0 flex-1 pb-16 pt-14 md:pb-0">
        <Toolbar
          activeTool={openPanelIds.includes(activeTool) ? activeTool : null}
          onToolSelect={handleOpenPanel}
        />
        <PhotoToolbar ref={photoToolbarRef} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col md:ml-16 md:flex-row">
          <main className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex shrink-0 justify-center px-3 py-2">
              <div className="flex max-w-full flex-wrap items-center justify-center gap-2">
                {/* Design opens the existing editorial text tools without changing document mode. */}
                <div role="group" aria-label="Workspace mode and design" className="flex h-9 shrink-0 items-center rounded-md border border-brand-border bg-brand-paper p-0.5">
                  {(["collage", "carousel"] as const).map((mode) => (
                    <button
                      key={mode}
                      id={`workspace-mode-${mode}`}
                      type="button"
                      aria-pressed={documentMode === mode}
                      onClick={() => handleDocumentModeChange(mode)}
                      className={`h-8 rounded-sm px-3 text-xs font-semibold capitalize transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500 ${documentMode === mode ? "bg-redwell-600 text-white" : "text-brand-muted hover:bg-brand-neutral hover:text-brand-ink"}`}
                    >
                      {mode}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-pressed={activeTool === "design"}
                    onClick={() => handleOpenPanel("design")}
                    className={`h-8 rounded-sm px-3 text-xs font-semibold capitalize transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500 ${activeTool === "design" ? "bg-redwell-600 text-white" : "text-brand-muted hover:bg-brand-neutral hover:text-brand-ink"}`}
                  >
                    Design
                  </button>
                </div>
                {documentMode === "carousel" && carousel && (
                  <CarouselNavigation
                    carousel={carousel}
                    onSelect={handleCarouselSlideChange}
                    onAdd={handleAddCarouselSlide}
                    onDuplicate={handleDuplicateCarouselSlide}
                    onDelete={handleDeleteCarouselSlide}
                    onPreview={() => setIsCarouselPreviewOpen(true)}
                  />
                )}
                <div
                  role="group"
                  aria-label="Canvas format"
                  className="flex min-w-0 max-w-full shrink items-center gap-1 overflow-x-auto rounded-md border border-brand-border bg-brand-paper px-2 py-1.5"
                >
                  <span className="mr-1 shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-muted">
                    Format
                  </span>
                  {CANVAS_FORMATS.map((format) => (
                    <button
                      key={format.id}
                      type="button"
                      onClick={() => selectCanvasFormat(format.id)}
                      aria-pressed={canvasFormatId === format.id}
                      className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-redwell-500 ${
                        canvasFormatId === format.id
                          ? "bg-redwell-600 text-white"
                            : "text-brand-muted hover:bg-brand-neutral hover:text-brand-ink"
                      }`}
                    >
                      {format.name}
                    </button>
                  ))}
                </div>
                {/* Viewport zoom controls — purely visual, no document mutation */}
                <CanvasViewportControls viewport={viewport} onFit={handleFitToCanvas} />
              </div>
            </div>
            {isUnstartedCarousel && (
              <div className="mx-3 mb-1.5 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-md border border-brand-border bg-brand-surface px-3 py-2 sm:mx-5 sm:px-4 max-[820px]:gap-1 max-[820px]:py-1.5">
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-redwell-700 max-[820px]:hidden">Your carousel, with a point of view</p>
                  <p className="mt-1 text-base font-medium leading-tight tracking-[-0.02em] text-brand-ink sm:text-lg max-[820px]:mt-0 max-[820px]:text-sm">Start with a story arc, then make it yours.</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTemplatePickerOpen(true)}
                    className="h-8 rounded-md bg-redwell-600 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-redwell-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500 focus-visible:ring-offset-2 max-[820px]:h-7 max-[820px]:px-2.5 max-[820px]:text-[10px]"
                  >
                    Choose a story
                  </button>
                  <button
                    type="button"
                    onClick={() => photoToolbarRef.current?.openPicker()}
                    className="h-8 rounded-md px-2.5 text-xs font-medium text-brand-muted transition-colors hover:bg-brand-neutral hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500 max-[820px]:h-7 max-[820px]:px-1.5 max-[820px]:text-[10px]"
                  >
                    Add photos first
                  </button>
                </div>
              </div>
            )}
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
                  containerSize={canvasContainerSize ?? undefined}
                />
              </CanvasViewport>
            </div>
            {documentMode === "carousel" && carousel && (
              <CarouselTimeline
                carousel={carousel}
                onSelect={handleCarouselSlideChange}
                onAdd={handleAddCarouselSlide}
                onReorder={reorderCarouselSlide}
                onTemplates={() => setIsTemplatePickerOpen(true)}
              />
            )}
          </main>
          <ResizableDock
            panels={panels}
            openPanelIds={openPanelIds}
            activePanelId={activeTool}
            width={dockWidth}
            onWidthChange={setDockWidth}
            onSelectPanel={setActiveTool}
            onClosePanel={handleClosePanel}
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
      />
      <CarouselTemplatePicker
        open={isTemplatePickerOpen && documentMode === "carousel"}
        previewPhotos={templatePreviewPhotos}
        previewStyle={collageStyle}
        onClose={() => setIsTemplatePickerOpen(false)}
        onApply={handleApplyCarouselTemplate}
      />
      {isCarouselPreviewOpen && documentMode === "carousel" && carousel && (
        <CarouselPreviewDialog
          carousel={carousel}
          onClose={() => setIsCarouselPreviewOpen(false)}
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
