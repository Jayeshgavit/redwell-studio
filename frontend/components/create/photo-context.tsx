"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import {
  CANVAS_FORMATS,
  COLLAGE_LAYOUTS,
  DEFAULT_STORY_TEXT_BY_ROLE,
  DEFAULT_COLLAGE_STYLE,
  type CarouselSlide,
  type CarouselState,
  type CarouselStoryLayoutId,
  type CarouselStorySlideDefinition,
  type CarouselStorySlideType,
  type CarouselStoryTextPlacement,
  type CarouselStoryTextRole,
  type CarouselStoryTextItem,
  type CollageStyle,
  type CanvasElement,
  type DocumentMode,
  type Photo,
  type PhotoDisplayMode,
  type PhotoRotation,
} from "@/types/editor";
import {
  getArtworkLayerStack,
  type ArtworkComposition,
  type ArtworkLayerKind,
  type LayerDirection,
} from "./artwork-composition";
import {
  CAROUSEL_STORY_LAYOUTS,
  constrainCarouselTextPlacement,
  getCarouselStoryTemplate,
} from "./carousel-story-templates";

export type { Photo, PhotoDisplayMode, PhotoRotation } from "@/types/editor";

interface PhotoEditorState {
  photos: Photo[];
  slotAssignments: Record<number, string>;
  selectedLayoutId: string | null;
  canvasFormatId: string;
  collageStyle: CollageStyle;
  elements: CanvasElement[];
  storyLayoutId: CarouselStoryLayoutId | null;
  storySlideType: CarouselStorySlideType | null;
  storyText: CarouselStoryTextItem[];
}

interface PhotoProviderProps {
  children: ReactNode;
  presentation?: {
    documentMode: DocumentMode;
    composition: ArtworkComposition;
  };
}

interface HistoryState extends HistoryTimeline {
  documentMode: DocumentMode;
  collageTimeline: HistoryTimeline;
  carousel: CarouselState | null;
  slideTimelines: Record<string, HistoryTimeline>;
  carouselOrderPast: CarouselOrderHistoryEntry[];
  carouselOrderFuture: CarouselOrderHistoryEntry[];
  carouselTemplatePast: CarouselTemplateHistoryEntry[];
  carouselTemplateFuture: CarouselTemplateHistoryEntry[];
}

function createPresentationHistory(presentation: {
  documentMode: DocumentMode;
  composition: ArtworkComposition;
}): HistoryState {
  const present: PhotoEditorState = {
    photos: presentation.composition.photos,
    slotAssignments: presentation.composition.slotAssignments,
    selectedLayoutId: presentation.composition.layout.id,
    canvasFormatId: presentation.composition.format.id,
    collageStyle: presentation.composition.collageStyle,
    elements: presentation.composition.elements,
    storyLayoutId: null,
    storySlideType: null,
    storyText: presentation.composition.storyText ?? [],
  };
  const timeline = createTimeline(present);
  return {
    ...initialHistoryState,
    ...timeline,
    documentMode: presentation.documentMode,
    collageTimeline: timeline,
  };
}

interface CarouselOrderHistoryEntry {
  order: string[];
  pastLengths: Record<string, number>;
  futureLengths: Record<string, number>;
}

interface CarouselDocumentSnapshot {
  carousel: CarouselState;
  slideTimelines: Record<string, HistoryTimeline>;
  activeTimeline: HistoryTimeline;
  carouselOrderPast: CarouselOrderHistoryEntry[];
  carouselOrderFuture: CarouselOrderHistoryEntry[];
}

interface CarouselTemplateHistoryEntry {
  before: CarouselDocumentSnapshot;
  after: CarouselDocumentSnapshot;
  undoPastLengths: Record<string, number>;
  redoFutureLengths: Record<string, number>;
  undoOrderPastLength: number;
  redoOrderFutureLength: number;
}

interface HistoryTimeline {
  past: PhotoEditorState[];
  present: PhotoEditorState;
  future: PhotoEditorState[];
  transactionStart: PhotoEditorState | null;
}

type HistoryAction =
  | { type: "commit"; update: (state: PhotoEditorState) => PhotoEditorState }
  | { type: "transient"; update: (state: PhotoEditorState) => PhotoEditorState }
  | {
      type: "replace-presentation";
      presentation: { documentMode: DocumentMode; composition: ArtworkComposition };
    }
  | { type: "begin-transaction" }
  | { type: "finish-transaction" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "set-document-mode"; mode: DocumentMode }
  | { type: "select-carousel-slide"; slideId: string }
  | { type: "add-carousel-slide" }
  | { type: "duplicate-carousel-slide" }
  | { type: "delete-carousel-slide" }
  | { type: "clear-project" }
  | { type: "apply-carousel-template"; templateId: string }
  | {
      type: "reorder-carousel-slide";
      slideId: string;
      targetSlideId: string;
      placement: "before" | "after";
    };

export type HistoryBehavior = "commit" | "transient";

interface PhotoContextType {
  documentMode: DocumentMode;
  carousel: CarouselState | null;
  photos: Photo[];
  slotAssignments: Record<number, string>;
  selectedLayoutId: string | null;
  canvasFormatId: string;
  collageStyle: CollageStyle;
  elements: CanvasElement[];
  storyLayoutId: CarouselStoryLayoutId | null;
  storySlideType: CarouselStorySlideType | null;
  storyText: CarouselStoryTextItem[];
  canUndo: boolean;
  canRedo: boolean;
  setDocumentMode: (mode: DocumentMode) => void;
  selectCarouselSlide: (slideId: string) => void;
  addCarouselSlide: () => void;
  duplicateCarouselSlide: () => void;
  deleteCarouselSlide: () => void;
  applyCarouselTemplate: (templateId: string) => void;
  applyCarouselStoryLayout: (layoutId: CarouselStoryLayoutId) => void;
  reorderCarouselSlide: (
    slideId: string,
    targetSlideId: string,
    placement: "before" | "after"
  ) => void;
  selectLayout: (layoutId: string) => void;
  selectCanvasFormat: (formatId: string) => void;
  addPhotos: (files: File[], targetSlotIndex?: number) => Promise<void>;
  replacePhoto: (id: string, file: File) => Promise<void>;
  removePhoto: (id: string) => void;
  swapSlots: (fromSlotIndex: number, toSlotIndex: number) => void;
  updatePhoto: (
    id: string,
    updates: Partial<Photo>,
    historyBehavior?: HistoryBehavior
  ) => void;
  updateCollageStyle: (
    updates: Partial<CollageStyle>,
    historyBehavior?: HistoryBehavior
  ) => void;
  updateStoryText: (
    id: string,
    updates: Partial<Omit<CarouselStoryTextItem, "id">>,
    historyBehavior?: HistoryBehavior
  ) => void;
  addStoryText: (role?: CarouselStoryTextRole) => void;
  removeStoryText: (id: string) => void;
  addElement: (element: CanvasElement) => void;
  updateElement: (
    id: string,
    updates: Partial<CanvasElement>,
    historyBehavior?: HistoryBehavior
  ) => void;
  removeElement: (id: string) => void;
  reorderLayer: (kind: ArtworkLayerKind, id: string, direction: LayerDirection) => void;
  beginHistoryTransaction: () => void;
  finishHistoryTransaction: () => void;
  clearPhotos: () => void;
  clearProject: () => void;
  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY_ENTRIES = 100;

const initialEditorState: PhotoEditorState = {
  photos: [],
  slotAssignments: {},
  selectedLayoutId: null,
  canvasFormatId: "square",
  collageStyle: DEFAULT_COLLAGE_STYLE,
  elements: [],
  storyLayoutId: null,
  storySlideType: null,
  storyText: [],
};

const initialTimeline: HistoryTimeline = {
  past: [],
  present: initialEditorState,
  future: [],
  transactionStart: null,
};

const initialHistoryState: HistoryState = {
  ...initialTimeline,
  documentMode: "collage",
  collageTimeline: initialTimeline,
  carousel: null,
  slideTimelines: {},
  carouselOrderPast: [],
  carouselOrderFuture: [],
  carouselTemplatePast: [],
  carouselTemplateFuture: [],
};

const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

export function PhotoProvider({ children, presentation }: PhotoProviderProps) {
  const [history, dispatch] = useReducer(
    historyReducer,
    presentation,
    (initialPresentation) =>
      initialPresentation ? createPresentationHistory(initialPresentation) : initialHistoryState
  );
  const objectUrlsRef = useRef(new Set<string>());
  const { present } = history;

  useEffect(() => {
    if (presentation) dispatch({ type: "replace-presentation", presentation });
  }, [presentation]);

  useEffect(() => {
    const objectUrls = objectUrlsRef.current;
    return () => objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const commit = useCallback((update: (state: PhotoEditorState) => PhotoEditorState) => {
    dispatch({ type: "commit", update });
  }, []);

  const selectLayout = useCallback(
    (layoutId: string) => {
      const layout = COLLAGE_LAYOUTS.find((candidate) => candidate.id === layoutId);
      if (!layout) return;

      commit((currentState) => {
        if (currentState.selectedLayoutId === layoutId) return currentState;

        const slotAssignments: Record<number, string> = {};
        currentState.photos.slice(0, layout.cells.length).forEach((photo, slotIndex) => {
          slotAssignments[slotIndex] = photo.id;
        });

        return { ...currentState, selectedLayoutId: layoutId, slotAssignments };
      });
    },
    [commit]
  );

  const selectCanvasFormat = useCallback(
    (formatId: string) => {
      if (!CANVAS_FORMATS.some((format) => format.id === formatId)) return;
      commit((currentState) =>
        currentState.canvasFormatId === formatId
          ? currentState
          : { ...currentState, canvasFormatId: formatId }
      );
    },
    [commit]
  );

  const addPhotos = useCallback(
    async (files: File[], targetSlotIndex?: number) => {
      const newPhotos: Photo[] = [];
      const filesToLoad = targetSlotIndex === undefined ? files : files.slice(0, 1);

      for (const file of filesToLoad) {
        if (!file.type.startsWith("image/")) continue;

        const src = URL.createObjectURL(file);
        objectUrlsRef.current.add(src);
        try {
          await loadImage(src);
          newPhotos.push({
            id: crypto.randomUUID(),
            src,
            displayMode: "fill",
            positionX: 0.5,
            positionY: 0.5,
            zoom: 1,
            rotation: 0,
            flipX: false,
            flipY: false,
          });
        } catch {
          objectUrlsRef.current.delete(src);
          URL.revokeObjectURL(src);
        }
      }

      if (newPhotos.length === 0) return;

      commit((currentState) => {
        const existingLayers = getStateLayerStack(currentState);
        let nextLayerOrder = existingLayers.reduce(
          (maximum, layer) => Math.max(maximum, layer.layerOrder),
          -1
        ) + 1;
        const photos = [
          ...currentState.photos,
          ...newPhotos.map((photo) => ({ ...photo, layerOrder: nextLayerOrder++ })),
        ];
        const hasSelectedLayout = currentState.selectedLayoutId !== null;
        const layout = hasSelectedLayout
          ? COLLAGE_LAYOUTS.find((candidate) => candidate.id === currentState.selectedLayoutId)
          : getDefaultLayout(photos.length);

        if (!layout) return { ...currentState, photos };

        const slotAssignments = hasSelectedLayout
          ? { ...currentState.slotAssignments }
          : {};

        if (!hasSelectedLayout) {
          photos.slice(0, layout.cells.length).forEach((photo, slotIndex) => {
            slotAssignments[slotIndex] = photo.id;
          });
        } else if (targetSlotIndex !== undefined) {
          const isSlotAvailable =
            targetSlotIndex >= 0 &&
            targetSlotIndex < layout.cells.length &&
            slotAssignments[targetSlotIndex] === undefined;
          if (isSlotAvailable) slotAssignments[targetSlotIndex] = newPhotos[0].id;
        } else {
          for (const photo of newPhotos) {
            const firstEmptySlot = layout.cells.findIndex(
              (_, slotIndex) => slotAssignments[slotIndex] === undefined
            );
            if (firstEmptySlot === -1) break;
            slotAssignments[firstEmptySlot] = photo.id;
          }
        }

        return {
          ...currentState,
          photos,
          slotAssignments,
          selectedLayoutId: currentState.selectedLayoutId ?? layout.id,
        };
      });
    },
    [commit]
  );

  const replacePhoto = useCallback(
    async (id: string, file: File) => {
      if (!file.type.startsWith("image/")) return;
      const src = URL.createObjectURL(file);
      objectUrlsRef.current.add(src);
      try {
        await loadImage(src);
      } catch {
        objectUrlsRef.current.delete(src);
        URL.revokeObjectURL(src);
        return;
      }

      commit((state) => {
        let changed = false;
        const photos = state.photos.map((photo) => {
          if (photo.id !== id) return photo;
          changed = true;
          return {
            ...photo,
            src,
            displayMode: "fill" as const,
            positionX: 0.5,
            positionY: 0.5,
            zoom: 1,
            rotation: 0 as const,
            flipX: false,
            flipY: false,
          };
        });
        return changed ? { ...state, photos } : state;
      });
    },
    [commit]
  );

  const removePhoto = useCallback(
    (id: string) => {
      commit((currentState) => {
        const slotAssignments = Object.fromEntries(
          Object.entries(currentState.slotAssignments).filter(([, photoId]) => photoId !== id)
        );
        const photos = currentState.photos.filter((photo) => photo.id !== id);
        if (photos.length === currentState.photos.length) return currentState;
        return { ...currentState, photos, slotAssignments };
      });
    },
    [commit]
  );

  const swapSlots = useCallback(
    (fromSlotIndex: number, toSlotIndex: number) => {
      if (fromSlotIndex === toSlotIndex) return;
      commit((currentState) => {
        const layout = COLLAGE_LAYOUTS.find(
          (candidate) => candidate.id === currentState.selectedLayoutId
        );
        if (
          !layout ||
          fromSlotIndex < 0 ||
          toSlotIndex < 0 ||
          fromSlotIndex >= layout.cells.length ||
          toSlotIndex >= layout.cells.length
        ) {
          return currentState;
        }

        const sourcePhotoId = currentState.slotAssignments[fromSlotIndex];
        if (!sourcePhotoId) return currentState;

        const targetPhotoId = currentState.slotAssignments[toSlotIndex];
        const slotAssignments = { ...currentState.slotAssignments };
        if (targetPhotoId) slotAssignments[fromSlotIndex] = targetPhotoId;
        else delete slotAssignments[fromSlotIndex];
        slotAssignments[toSlotIndex] = sourcePhotoId;

        return { ...currentState, slotAssignments };
      });
    },
    [commit]
  );

  const updatePhoto = useCallback(
    (id: string, updates: Partial<Photo>, historyBehavior: HistoryBehavior = "commit") => {
      const update = (currentState: PhotoEditorState): PhotoEditorState => {
        let hasChanged = false;
        const photos = currentState.photos.map((photo) => {
          if (photo.id !== id) return photo;
          const updatedPhoto = { ...photo, ...updates };
          hasChanged = Object.keys(updates).some(
            (key) => photo[key as keyof Photo] !== updatedPhoto[key as keyof Photo]
          );
          return hasChanged ? updatedPhoto : photo;
        });
        return hasChanged ? { ...currentState, photos } : currentState;
      };

      if (historyBehavior === "transient") dispatch({ type: "transient", update });
      else commit(update);
    },
    [commit]
  );

  const updateCollageStyle = useCallback(
    (updates: Partial<CollageStyle>, historyBehavior: HistoryBehavior = "commit") => {
      const update = (currentState: PhotoEditorState): PhotoEditorState => {
        const collageStyle = { ...currentState.collageStyle, ...updates };
        const hasStyleChange = Object.keys(updates).some(
          (key) =>
            currentState.collageStyle[key as keyof CollageStyle] !==
            collageStyle[key as keyof CollageStyle]
        );
        return hasStyleChange ? { ...currentState, collageStyle } : currentState;
      };

      if (historyBehavior === "transient") dispatch({ type: "transient", update });
      else commit(update);
    },
    [commit]
  );

  const updateStoryText = useCallback(
    (
      id: string,
      updates: Partial<Omit<CarouselStoryTextItem, "id">>,
      historyBehavior: HistoryBehavior = "commit"
    ) => {
      const update = (state: PhotoEditorState): PhotoEditorState => {
        let changed = false;
        const storyText = state.storyText.map((item) => {
          if (item.id !== id) return item;
          const next = constrainCarouselTextPlacement({ ...item, ...updates });
          const hasItemChange = (Object.keys(updates) as (keyof CarouselStoryTextItem)[])
            .some((key) => item[key] !== next[key]);
          if (!hasItemChange) return item;
          changed = true;
          return next;
        });
        return changed ? { ...state, storyText } : state;
      };

      if (historyBehavior === "transient") dispatch({ type: "transient", update });
      else commit(update);
    },
    [commit]
  );

  const removeStoryText = useCallback(
    (id: string) => commit((state) => {
      const storyText = state.storyText.filter((item) => item.id !== id);
      return storyText.length === state.storyText.length ? state : { ...state, storyText };
    }),
    [commit]
  );

  const addStoryText = useCallback(
    (requestedRole?: CarouselStoryTextRole) => commit((state) => {
      const storyLayout = state.storyLayoutId
        ? CAROUSEL_STORY_LAYOUTS.find((layout) => layout.id === state.storyLayoutId)
        : undefined;
      const roleOrder: CarouselStoryTextRole[] = [
        "title",
        "subtitle",
        "body",
        "eyebrow",
        "metadata",
        "location",
        "cta",
        "quote",
      ];
      const role = requestedRole ??
        roleOrder.find((candidate) => !state.storyText.some((item) => item.role === candidate));
      if (!role) return state;
      if (state.storyText.some((item) => item.role === role)) return state;
      const placement = constrainCarouselTextPlacement(
        storyLayout?.textPlacements.find((candidate) => candidate.role === role) ??
          fallbackStoryTextPlacement(role, state.storyText.length)
      );
      return {
        ...state,
        storyText: [
          ...state.storyText,
          {
            ...placement,
            id: crypto.randomUUID(),
            text: DEFAULT_STORY_TEXT_BY_ROLE[role],
            layerOrder: getNextLayerOrder(state),
          },
        ],
      };
    }),
    [commit]
  );

  const addElement = useCallback((element: CanvasElement) => {
    commit((state) => ({
      ...state,
      elements: [
        ...state.elements,
        {
          ...element,
          zIndex: Math.max(-1, ...state.elements.map((item) => item.zIndex)) + 1,
          layerOrder: getNextLayerOrder(state),
        },
      ],
    }));
  }, [commit]);

  const updateElement = useCallback(
    (id: string, updates: Partial<CanvasElement>, historyBehavior: HistoryBehavior = "commit") => {
      const update = (state: PhotoEditorState): PhotoEditorState => {
        let changed = false;
        const elements = state.elements.map((element) => {
          if (element.id !== id) return element;
          const next = { ...element, ...updates };
          changed = (Object.keys(updates) as (keyof CanvasElement)[]).some(
            (key) => element[key] !== next[key]
          );
          return changed ? next : element;
        });
        return changed ? { ...state, elements } : state;
      };
      if (historyBehavior === "transient") dispatch({ type: "transient", update });
      else commit(update);
    },
    [commit]
  );

  const removeElement = useCallback((id: string) => {
    commit((state) => {
      const elements = state.elements.filter((element) => element.id !== id);
      return elements.length === state.elements.length ? state : { ...state, elements };
    });
  }, [commit]);

  const reorderLayer = useCallback(
    (kind: ArtworkLayerKind, id: string, direction: LayerDirection) => {
      commit((state) => {
        const layers = getStateLayerStack(state);
        const index = layers.findIndex((layer) => layer.kind === kind && layer.id === id);
        if (index === -1 || (direction === "forward" && index === layers.length - 1) ||
          (direction === "backward" && index === 0)) return state;
        const [layer] = layers.splice(index, 1);
        if (direction === "front") layers.push(layer);
        else if (direction === "back") layers.unshift(layer);
        else layers.splice(index + (direction === "forward" ? 1 : -1), 0, layer);

        const orderByKey = new Map(
          layers.map((item, layerOrder) => [`${item.kind}:${item.id}`, layerOrder])
        );
        return {
          ...state,
          photos: state.photos.map((photo) => ({
            ...photo,
            layerOrder: orderByKey.get(`photo:${photo.id}`) ?? photo.layerOrder,
          })),
          storyText: state.storyText.map((item) => ({
            ...item,
            layerOrder: orderByKey.get(`storyText:${item.id}`) ?? item.layerOrder,
          })),
          elements: state.elements.map((element) => ({
            ...element,
            layerOrder: orderByKey.get(`element:${element.id}`) ?? element.layerOrder,
          })),
        };
      });
    },
    [commit]
  );

  const beginHistoryTransaction = useCallback(() => {
    dispatch({ type: "begin-transaction" });
  }, []);

  const finishHistoryTransaction = useCallback(() => {
    dispatch({ type: "finish-transaction" });
  }, []);

  const clearPhotos = useCallback(() => {
    commit((currentState) =>
      currentState.photos.length === 0
        ? currentState
        : { ...currentState, photos: [], slotAssignments: {} }
    );
  }, [commit]);
  const clearProject = useCallback(() => dispatch({ type: "clear-project" }), []);

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);
  const setDocumentMode = useCallback(
    (mode: DocumentMode) => dispatch({ type: "set-document-mode", mode }),
    []
  );
  const selectCarouselSlide = useCallback(
    (slideId: string) => dispatch({ type: "select-carousel-slide", slideId }),
    []
  );
  const addCarouselSlide = useCallback(() => dispatch({ type: "add-carousel-slide" }), []);
  const duplicateCarouselSlide = useCallback(() => dispatch({ type: "duplicate-carousel-slide" }), []);
  const deleteCarouselSlide = useCallback(() => dispatch({ type: "delete-carousel-slide" }), []);
  const applyCarouselTemplate = useCallback(
    (templateId: string) => dispatch({ type: "apply-carousel-template", templateId }),
    []
  );
  const applyCarouselStoryLayout = useCallback(
    (layoutId: CarouselStoryLayoutId) => {
      const storyLayout = CAROUSEL_STORY_LAYOUTS.find((candidate) => candidate.id === layoutId);
      const photoLayout = storyLayout
        ? COLLAGE_LAYOUTS.find((candidate) => candidate.id === storyLayout.photoLayoutId)
        : undefined;
      if (!storyLayout || !photoLayout) return;

      commit((currentState) => {
        const slotAssignments: Record<number, string> = {};
        currentState.photos.slice(0, photoLayout.cells.length).forEach((photo, slotIndex) => {
          slotAssignments[slotIndex] = photo.id;
        });
        const storyText = currentState.storyText.map((item) => {
          const placement = storyLayout.textPlacements.find((candidate) => candidate.role === item.role);
          return placement
            ? { ...item, ...constrainCarouselTextPlacement(placement), id: item.id, text: item.text }
            : item;
        });

        return {
          ...currentState,
          selectedLayoutId: storyLayout.photoLayoutId,
          canvasFormatId: storyLayout.formatId,
          collageStyle: { ...currentState.collageStyle, backgroundColor: storyLayout.backgroundColor },
          storyLayoutId: storyLayout.id,
          slotAssignments,
          storyText,
        };
      });
    },
    [commit]
  );
  const reorderCarouselSlide = useCallback(
    (slideId: string, targetSlideId: string, placement: "before" | "after") =>
      dispatch({ type: "reorder-carousel-slide", slideId, targetSlideId, placement }),
    []
  );

  return (
    <PhotoContext.Provider
      value={{
        documentMode: history.documentMode,
        carousel: history.carousel,
        photos: present.photos,
        slotAssignments: present.slotAssignments,
        selectedLayoutId: present.selectedLayoutId,
        canvasFormatId: present.canvasFormatId,
        collageStyle: present.collageStyle,
        elements: present.elements,
        storyLayoutId: present.storyLayoutId,
        storySlideType: present.storySlideType,
        storyText: present.storyText,
        canUndo:
          history.past.length > 0 ||
          hasChanged(history.transactionStart, present) ||
          (history.documentMode === "carousel" &&
            (history.carouselOrderPast.length > 0 || history.carouselTemplatePast.length > 0)),
        canRedo:
          history.future.length > 0 ||
          (history.documentMode === "carousel" &&
            (history.carouselOrderFuture.length > 0 || history.carouselTemplateFuture.length > 0)),
        setDocumentMode,
        selectCarouselSlide,
        addCarouselSlide,
        duplicateCarouselSlide,
        deleteCarouselSlide,
        applyCarouselTemplate,
        applyCarouselStoryLayout,
        reorderCarouselSlide,
        selectLayout,
        selectCanvasFormat,
        addPhotos,
        replacePhoto,
        removePhoto,
        swapSlots,
        updatePhoto,
        updateCollageStyle,
        updateStoryText,
        addStoryText,
        removeStoryText,
        addElement,
        updateElement,
        removeElement,
        reorderLayer,
        beginHistoryTransaction,
        finishHistoryTransaction,
        clearPhotos,
        clearProject,
        undo,
        redo,
      }}
    >
      {children}
    </PhotoContext.Provider>
  );
}

function historyReducer(history: HistoryState, action: HistoryAction): HistoryState {
  if (action.type === "replace-presentation") {
    return createPresentationHistory(action.presentation);
  }
  if (action.type === "set-document-mode") return setHistoryDocumentMode(history, action.mode);
  if (action.type === "select-carousel-slide") {
    return selectHistoryCarouselSlide(history, action.slideId);
  }
  if (action.type === "add-carousel-slide") return addHistoryCarouselSlide(history, false);
  if (action.type === "duplicate-carousel-slide") return addHistoryCarouselSlide(history, true);
  if (action.type === "delete-carousel-slide") return deleteHistoryCarouselSlide(history);
  if (action.type === "clear-project") return clearHistoryProject(history);
  if (action.type === "apply-carousel-template") {
    return applyCarouselTemplateHistory(history, action.templateId);
  }
  if (action.type === "reorder-carousel-slide") {
    return reorderHistoryCarouselSlide(history, action.slideId, action.targetSlideId, action.placement);
  }

  if (
    action.type === "undo" &&
    history.documentMode === "carousel" &&
    history.carouselOrderPast.length > 0 &&
    !hasNewerSlideEdits(history, history.carouselOrderPast[history.carouselOrderPast.length - 1])
  ) {
    return undoCarouselSlideOrder(history);
  }
  if (
    action.type === "undo" &&
    history.documentMode === "carousel" &&
    history.carouselTemplatePast.length > 0 &&
    !hasNewerCarouselTemplateChanges(
      history,
      history.carouselTemplatePast[history.carouselTemplatePast.length - 1]
    )
  ) {
    return undoCarouselTemplate(history);
  }
  if (
    action.type === "redo" &&
    history.documentMode === "carousel" &&
    history.carouselOrderFuture.length > 0 &&
    !hasUndoneSlideEdits(history, history.carouselOrderFuture[0])
  ) {
    return redoCarouselSlideOrder(history);
  }
  if (
    action.type === "redo" &&
    history.documentMode === "carousel" &&
    history.carouselTemplateFuture.length > 0 &&
    !hasUndoneCarouselTemplateChanges(history, history.carouselTemplateFuture[0])
  ) {
    return redoCarouselTemplate(history);
  }

  switch (action.type) {
    case "commit": {
      const next = action.update(history.present);
      if (next === history.present) return history;

      let past = history.past;
      if (history.transactionStart && hasChanged(history.transactionStart, history.present)) {
        past = appendSnapshot(past, history.transactionStart);
      }
      past = appendSnapshot(past, history.present);
      const committed = persistActiveDocument({
        ...history,
        past,
        present: next,
        future: [],
        transactionStart: null,
      });
      return committed.documentMode === "carousel"
        ? { ...committed, carouselOrderFuture: [], carouselTemplateFuture: [] }
        : committed;
    }
    case "transient": {
      const next = action.update(history.present);
      if (next === history.present) return history;
      return persistActiveDocument({ ...history, present: next });
    }
    case "begin-transaction":
      return history.transactionStart
        ? history
        : persistActiveDocument({ ...history, transactionStart: history.present });
    case "finish-transaction":
      return history.transactionStart && hasChanged(history.transactionStart, history.present)
        ? clearCarouselOrderFuture(persistActiveDocument({
            ...history,
            past: appendSnapshot(history.past, history.transactionStart),
            present: history.present,
            future: [],
            transactionStart: null,
          }))
        : persistActiveDocument({ ...history, transactionStart: null });
    case "undo": {
      const past = history.transactionStart && hasChanged(history.transactionStart, history.present)
        ? appendSnapshot(history.past, history.transactionStart)
        : [...history.past];
      const snapshot = past.pop();
      if (!snapshot) return persistActiveDocument({ ...history, transactionStart: null });
      const future = [history.present, ...history.future].slice(0, MAX_HISTORY_ENTRIES);
      return persistActiveDocument({
        ...history,
        past,
        present: snapshot,
        future,
        transactionStart: null,
      });
    }
    case "redo": {
      const [snapshot, ...future] = history.future;
      if (!snapshot) return history;
      return persistActiveDocument({
        ...history,
        past: appendSnapshot(history.past, history.present),
        present: snapshot,
        future,
        transactionStart: null,
      });
    }
  }
}

function clearHistoryProject(history: HistoryState): HistoryState {
  const emptyState: PhotoEditorState = {
    ...initialEditorState,
    collageStyle: { ...DEFAULT_COLLAGE_STYLE },
    elements: [],
    photos: [],
    slotAssignments: {},
    storyText: [],
  };

  if (history.documentMode === "collage") {
    if (!hasChanged(history.present, emptyState)) return history;
    return persistActiveDocument({
      ...history,
      past: appendSnapshot(history.past, history.present),
      present: emptyState,
      future: [],
      transactionStart: null,
    });
  }

  // Carousel state requires an active slide for the workspace to remain immediately usable.
  // A single empty slide represents a cleared carousel and keeps the collage timeline untouched.
  const emptySlide = createEmptyCarouselSlide(emptyState, 0);
  const timeline = createTimeline(editorStateFromSlide(emptySlide));
  return {
    ...history,
    ...timeline,
    carousel: {
      id: crypto.randomUUID(),
      slides: [emptySlide],
      activeSlideId: emptySlide.id,
      templateId: null,
    },
    slideTimelines: { [emptySlide.id]: timeline },
    carouselOrderPast: [],
    carouselOrderFuture: [],
    carouselTemplatePast: [],
    carouselTemplateFuture: [],
  };
}

function setHistoryDocumentMode(history: HistoryState, mode: DocumentMode): HistoryState {
  if (history.documentMode === mode) return history;
  const current = persistActiveDocument(history);

  if (mode === "collage") {
    return { ...current, ...current.collageTimeline, documentMode: "collage" };
  }

  if (!current.carousel) {
    const slide = cloneEditorStateToSlide(current.present, 0);
    const timeline = createTimeline(editorStateFromSlide(slide));
    const carousel: CarouselState = {
      id: crypto.randomUUID(),
      slides: [slide],
      activeSlideId: slide.id,
    };
    return {
      ...current,
      ...timeline,
      documentMode: "carousel",
      carousel,
      slideTimelines: { ...current.slideTimelines, [slide.id]: timeline },
    };
  }

  const activeSlide = current.carousel.slides.find(
    (slide) => slide.id === current.carousel?.activeSlideId
  );
  if (!activeSlide) return current;
  const timeline = current.slideTimelines[activeSlide.id] ??
    createTimeline(editorStateFromSlide(activeSlide));
  return {
    ...current,
    ...timeline,
    documentMode: "carousel",
    slideTimelines: { ...current.slideTimelines, [activeSlide.id]: timeline },
  };
}

function selectHistoryCarouselSlide(history: HistoryState, slideId: string): HistoryState {
  if (history.documentMode !== "carousel" || history.carousel?.activeSlideId === slideId) return history;
  const current = persistActiveDocument(history);
  const nextSlide = current.carousel?.slides.find((slide) => slide.id === slideId);
  if (!current.carousel || !nextSlide) return history;

  const timeline = current.slideTimelines[slideId] ??
    createTimeline(editorStateFromSlide(nextSlide));
  return {
    ...current,
    ...timeline,
    carousel: { ...current.carousel, activeSlideId: slideId },
    slideTimelines: { ...current.slideTimelines, [slideId]: timeline },
  };
}

function addHistoryCarouselSlide(history: HistoryState, shouldDuplicate: boolean): HistoryState {
  if (history.documentMode !== "carousel" || !history.carousel) return history;
  const current = persistActiveDocument(history);
  const slides = [...current.carousel!.slides].sort((first, second) => first.order - second.order);
  const activeIndex = slides.findIndex((slide) => slide.id === current.carousel?.activeSlideId);
  const storyTemplate = current.carousel?.templateId
    ? getCarouselStoryTemplate(current.carousel.templateId)
    : undefined;
  const closingIndex = storyTemplate
    ? slides.findIndex((candidate) => candidate.storySlideType === "ending" || candidate.storySlideType === "cta")
    : -1;
  const insertionIndex = shouldDuplicate
    ? activeIndex + 1
    : closingIndex >= 0 ? closingIndex : slides.length;
  const slide = shouldDuplicate
    ? cloneEditorStateToSlide(current.present, insertionIndex)
    : storyTemplate
      ? createStoryCarouselSlide(storyTemplate.overflowSlide, insertionIndex, [], [], current.present.collageStyle)
      : createEmptyCarouselSlide(current.present, insertionIndex);
  slides.splice(insertionIndex, 0, slide);
  const orderedSlides = slides.map((item, order) => ({ ...item, order }));
  const nextSlide = orderedSlides[insertionIndex];
  const timeline = createTimeline(editorStateFromSlide(nextSlide));

  return {
    ...current,
    ...timeline,
    carousel: {
      ...current.carousel!,
      slides: orderedSlides,
      activeSlideId: nextSlide.id,
    },
    slideTimelines: { ...current.slideTimelines, [nextSlide.id]: timeline },
    carouselOrderFuture: [],
    carouselTemplateFuture: [],
  };
}

function deleteHistoryCarouselSlide(history: HistoryState): HistoryState {
  if (history.documentMode !== "carousel" || !history.carousel || history.carousel.slides.length <= 1) {
    return history;
  }

  const current = persistActiveDocument(history);
  const slides = [...current.carousel!.slides].sort((first, second) => first.order - second.order);
  const activeIndex = slides.findIndex((slide) => slide.id === current.carousel?.activeSlideId);
  if (activeIndex < 0) return history;

  const [deletedSlide] = slides.splice(activeIndex, 1);
  const orderedSlides = slides.map((slide, order) => ({ ...slide, order }));
  const nextSlide = orderedSlides[Math.max(0, activeIndex - 1)];
  const timeline = current.slideTimelines[nextSlide.id] ??
    createTimeline(editorStateFromSlide(nextSlide));
  const slideTimelines = Object.fromEntries(
    Object.entries(current.slideTimelines).filter(([slideId]) => slideId !== deletedSlide.id)
  );

  return {
    ...current,
    ...timeline,
    carousel: {
      ...current.carousel!,
      slides: orderedSlides,
      activeSlideId: nextSlide.id,
    },
    slideTimelines: { ...slideTimelines, [nextSlide.id]: timeline },
    carouselOrderFuture: [],
    carouselTemplateFuture: [],
  };
}

function applyCarouselTemplateHistory(history: HistoryState, templateId: string): HistoryState {
  if (history.documentMode !== "carousel" || !history.carousel) return history;
  const template = getCarouselStoryTemplate(templateId);
  if (!template) return history;

  const current = clearCarouselHistoryFuture(persistActiveDocument(history));
  const before = captureCarouselDocument(current);
  const sourceSlides = [...current.carousel!.slides].sort((first, second) => first.order - second.order);
  const photoIds = new Set<string>();
  const photos = sourceSlides.flatMap((slide) => slide.photos).filter((photo) => {
    if (photoIds.has(photo.id)) return false;
    photoIds.add(photo.id);
    return true;
  });
  const elementIds = new Set<string>();
  const elements = sourceSlides.flatMap((slide) => slide.elements).filter((element) => {
    if (elementIds.has(element.id)) return false;
    elementIds.add(element.id);
    return true;
  });
  const definitions = [...template.slides];
  const layoutCellCount = (layoutId: CarouselStoryLayoutId) => {
    const storyLayout = CAROUSEL_STORY_LAYOUTS.find((candidate) => candidate.id === layoutId);
    return COLLAGE_LAYOUTS.find((candidate) => candidate.id === storyLayout?.photoLayoutId)?.cells.length ?? 1;
  };
  const initialCapacity = definitions.reduce((count, definition) => count + layoutCellCount(definition.layoutId), 0);
  let additionalCapacity = initialCapacity;
  let overflowIndex = 0;
  while (additionalCapacity < photos.length) {
    const endingIndex = definitions.findIndex((definition) => definition.type === "ending" || definition.type === "cta");
    const insertionIndex = endingIndex < 0 ? definitions.length : endingIndex;
    definitions.splice(insertionIndex, 0, { ...template.overflowSlide, id: `overflow-${overflowIndex++}` });
    additionalCapacity += layoutCellCount(template.overflowSlide.layoutId);
  }

  const elementAssignments = definitions.map(() => [] as CanvasElement[]);
  elements.forEach((element, index) => {
    elementAssignments[index % definitions.length].push(element);
  });

  let photoOffset = 0;
  const slides: CarouselSlide[] = definitions.map((definition, order) => {
    const storyLayout = CAROUSEL_STORY_LAYOUTS.find((candidate) => candidate.id === definition.layoutId)!;
    const collageLayout = COLLAGE_LAYOUTS.find((candidate) => candidate.id === storyLayout.photoLayoutId)!;
    const slidePhotos = photos.slice(photoOffset, photoOffset + collageLayout.cells.length);
    photoOffset += slidePhotos.length;
    const originalStyle = sourceSlides[order]?.collageStyle ?? current.present.collageStyle;
    return createStoryCarouselSlide(
      definition,
      order,
      slidePhotos,
      elementAssignments[order],
      originalStyle
    );
  });

  const activeSlide = slides[0];
  const timeline = createTimeline(editorStateFromSlide(activeSlide));
  const applied: HistoryState = {
    ...current,
    ...timeline,
    carousel: {
      ...current.carousel!,
      templateId: template.id,
      slides,
      activeSlideId: activeSlide.id,
    },
    slideTimelines: { [activeSlide.id]: timeline },
    carouselOrderPast: [],
    carouselOrderFuture: [],
    carouselTemplateFuture: [],
  };
  const entry: CarouselTemplateHistoryEntry = {
    before,
    after: captureCarouselDocument(applied),
    undoPastLengths: getSlideHistoryLengths(applied, "past"),
    redoFutureLengths: getSlideHistoryLengths(current, "future"),
    undoOrderPastLength: applied.carouselOrderPast.length,
    redoOrderFutureLength: before.carouselOrderFuture.length,
  };

  return {
    ...applied,
    carouselTemplatePast: [...current.carouselTemplatePast, entry].slice(-MAX_HISTORY_ENTRIES),
  };
}

function reorderHistoryCarouselSlide(
  history: HistoryState,
  slideId: string,
  targetSlideId: string,
  placement: "before" | "after"
): HistoryState {
  if (history.documentMode !== "carousel" || !history.carousel || slideId === targetSlideId) return history;

  const current = persistActiveDocument(history);
  const slides = [...current.carousel!.slides].sort((first, second) => first.order - second.order);
  const sourceIndex = slides.findIndex((slide) => slide.id === slideId);
  if (sourceIndex < 0 || !slides.some((slide) => slide.id === targetSlideId)) return history;

  const previousOrder = slides.map((slide) => slide.id);
  const [movingSlide] = slides.splice(sourceIndex, 1);
  const targetIndex = slides.findIndex((slide) => slide.id === targetSlideId);
  const insertionIndex = targetIndex + (placement === "after" ? 1 : 0);
  slides.splice(insertionIndex, 0, movingSlide);
  if (slides.every((slide, index) => slide.id === previousOrder[index])) return history;

  const slideTimelines = Object.fromEntries(
    Object.entries(current.slideTimelines).map(([id, timeline]) => [id, { ...timeline, future: [] }])
  );
  const currentOrderHistoryEntry: CarouselOrderHistoryEntry = {
    order: previousOrder,
    pastLengths: getSlideHistoryLengths(current, "past"),
    futureLengths: getSlideHistoryLengths(current, "future", true),
  };

  return {
    ...current,
    future: [],
    carousel: { ...current.carousel!, slides: reindexCarouselSlides(slides) },
    slideTimelines,
    carouselOrderPast: [...current.carouselOrderPast, currentOrderHistoryEntry].slice(-MAX_HISTORY_ENTRIES),
    carouselOrderFuture: [],
    carouselTemplateFuture: [],
  };
}

function undoCarouselSlideOrder(history: HistoryState): HistoryState {
  if (!history.carousel || history.carouselOrderPast.length === 0) return history;
  const current = persistActiveDocument(history);
  const [entry, ...remaining] = [...current.carouselOrderPast].reverse();
  const carouselOrderPast = remaining.reverse();
  const currentOrder = [...current.carousel!.slides]
    .sort((first, second) => first.order - second.order)
    .map((slide) => slide.id);
  const slides = applyCarouselSlideOrder(current.carousel!.slides, entry.order);

  return {
    ...current,
    carousel: { ...current.carousel!, slides },
    carouselOrderPast,
    carouselOrderFuture: [{ ...entry, order: currentOrder }, ...current.carouselOrderFuture],
  };
}

function redoCarouselSlideOrder(history: HistoryState): HistoryState {
  if (!history.carousel || history.carouselOrderFuture.length === 0) return history;
  const current = persistActiveDocument(history);
  const [entry, ...carouselOrderFuture] = current.carouselOrderFuture;
  const currentOrder = [...current.carousel!.slides]
    .sort((first, second) => first.order - second.order)
    .map((slide) => slide.id);
  const slides = applyCarouselSlideOrder(current.carousel!.slides, entry.order);

  return {
    ...current,
    carousel: { ...current.carousel!, slides },
    carouselOrderPast: [...current.carouselOrderPast, { ...entry, order: currentOrder }].slice(-MAX_HISTORY_ENTRIES),
    carouselOrderFuture,
  };
}

function getSlideHistoryLengths(
  history: HistoryState,
  field: "past" | "future",
  clearActive = false
): Record<string, number> {
  if (!history.carousel) return {};
  return Object.fromEntries(
    history.carousel.slides.map((slide) => {
      const timeline = slide.id === history.carousel?.activeSlideId
        ? getTimeline(history)
        : history.slideTimelines[slide.id];
      return [slide.id, clearActive && (field === "future" || slide.id === history.carousel?.activeSlideId)
        ? 0
        : timeline?.[field].length ?? 0];
    })
  );
}

function hasNewerSlideEdits(history: HistoryState, entry: CarouselOrderHistoryEntry): boolean {
  if (history.transactionStart && hasChanged(history.transactionStart, history.present)) return true;
  return Object.entries(getSlideHistoryLengths(history, "past")).some(
    ([slideId, length]) => length > (entry.pastLengths[slideId] ?? 0)
  );
}

function hasUndoneSlideEdits(history: HistoryState, entry: CarouselOrderHistoryEntry): boolean {
  return Object.entries(getSlideHistoryLengths(history, "future")).some(
    ([slideId, length]) => length > (entry.futureLengths[slideId] ?? 0)
  );
}

function clearCarouselOrderFuture(history: HistoryState): HistoryState {
  return history.documentMode === "carousel"
    ? { ...history, carouselOrderFuture: [], carouselTemplateFuture: [] }
    : history;
}

function clearCarouselHistoryFuture(history: HistoryState): HistoryState {
  return {
    ...history,
    future: [],
    slideTimelines: Object.fromEntries(
      Object.entries(history.slideTimelines).map(([slideId, timeline]) => [slideId, { ...timeline, future: [] }])
    ),
    carouselOrderFuture: [],
    carouselTemplateFuture: [],
  };
}

function captureCarouselDocument(history: HistoryState): CarouselDocumentSnapshot {
  if (!history.carousel) throw new Error("Cannot capture a missing carousel document.");
  return {
    carousel: history.carousel,
    slideTimelines: history.slideTimelines,
    activeTimeline: getTimeline(history),
    carouselOrderPast: history.carouselOrderPast,
    carouselOrderFuture: history.carouselOrderFuture,
  };
}

function restoreCarouselDocument(
  history: HistoryState,
  snapshot: CarouselDocumentSnapshot
): HistoryState {
  return {
    ...history,
    ...snapshot.activeTimeline,
    carousel: snapshot.carousel,
    slideTimelines: snapshot.slideTimelines,
    carouselOrderPast: snapshot.carouselOrderPast,
    carouselOrderFuture: snapshot.carouselOrderFuture,
  };
}

function hasNewerCarouselTemplateChanges(
  history: HistoryState,
  entry: CarouselTemplateHistoryEntry
): boolean {
  if (!history.carousel) return false;
  if (history.transactionStart && hasChanged(history.transactionStart, history.present)) return true;
  if (history.carouselOrderPast.length > entry.undoOrderPastLength) return true;
  const currentSlideIds = history.carousel.slides.map((slide) => slide.id).sort();
  const expectedSlideIds = entry.after.carousel.slides.map((slide) => slide.id).sort();
  if (
    currentSlideIds.length !== expectedSlideIds.length ||
    currentSlideIds.some((slideId, index) => slideId !== expectedSlideIds[index])
  ) return true;
  return Object.entries(getSlideHistoryLengths(history, "past")).some(
    ([slideId, length]) => length > (entry.undoPastLengths[slideId] ?? 0)
  );
}

function hasUndoneCarouselTemplateChanges(
  history: HistoryState,
  entry: CarouselTemplateHistoryEntry
): boolean {
  if (!history.carousel) return false;
  if (history.carouselOrderFuture.length > entry.redoOrderFutureLength) return true;
  const currentSlideIds = history.carousel.slides.map((slide) => slide.id).sort();
  const expectedSlideIds = entry.before.carousel.slides.map((slide) => slide.id).sort();
  if (
    currentSlideIds.length !== expectedSlideIds.length ||
    currentSlideIds.some((slideId, index) => slideId !== expectedSlideIds[index])
  ) return true;
  return Object.entries(getSlideHistoryLengths(history, "future")).some(
    ([slideId, length]) => length > (entry.redoFutureLengths[slideId] ?? 0)
  );
}

function undoCarouselTemplate(history: HistoryState): HistoryState {
  if (history.carouselTemplatePast.length === 0) return history;
  const current = persistActiveDocument(history);
  const [entry, ...remaining] = [...current.carouselTemplatePast].reverse();
  const carouselTemplatePast = remaining.reverse();
  const after = captureCarouselDocument(current);
  const restored = restoreCarouselDocument(current, entry.before);
  return {
    ...restored,
    carouselTemplatePast,
    carouselTemplateFuture: [{ ...entry, after }, ...current.carouselTemplateFuture],
  };
}

function redoCarouselTemplate(history: HistoryState): HistoryState {
  if (history.carouselTemplateFuture.length === 0) return history;
  const [entry, ...carouselTemplateFuture] = history.carouselTemplateFuture;
  const restored = restoreCarouselDocument(history, entry.after);
  return {
    ...restored,
    carouselTemplatePast: [...history.carouselTemplatePast, entry],
    carouselTemplateFuture,
  };
}

function applyCarouselSlideOrder(slides: CarouselSlide[], order: string[]): CarouselSlide[] {
  const slidesById = new Map(slides.map((slide) => [slide.id, slide]));
  const orderedSlides = order.flatMap((slideId) => {
    const slide = slidesById.get(slideId);
    if (!slide) return [];
    slidesById.delete(slideId);
    return [slide];
  });
  orderedSlides.push(...slidesById.values());
  return reindexCarouselSlides(orderedSlides);
}

function reindexCarouselSlides(slides: CarouselSlide[]): CarouselSlide[] {
  return slides.map((slide, order) => slide.order === order ? slide : { ...slide, order });
}

function persistActiveDocument(history: HistoryState): HistoryState {
  const timeline = getTimeline(history);
  if (history.documentMode === "collage") {
    return { ...history, collageTimeline: timeline };
  }
  if (!history.carousel) return history;

  const slideId = history.carousel.activeSlideId;
  const slides = history.carousel.slides.map((slide) =>
    slide.id === slideId ? { ...history.present, id: slide.id, order: slide.order } : slide
  );
  return {
    ...history,
    carousel: { ...history.carousel, slides },
    slideTimelines: { ...history.slideTimelines, [slideId]: timeline },
  };
}

function getTimeline(history: HistoryState): HistoryTimeline {
  return {
    past: history.past,
    present: history.present,
    future: history.future,
    transactionStart: history.transactionStart,
  };
}

function createTimeline(present: PhotoEditorState): HistoryTimeline {
  return { past: [], present, future: [], transactionStart: null };
}

function createEmptyCarouselSlide(state: PhotoEditorState, order: number): CarouselSlide {
  return {
    id: crypto.randomUUID(),
    order,
    photos: [],
    slotAssignments: {},
    selectedLayoutId: state.selectedLayoutId,
    canvasFormatId: state.canvasFormatId,
    collageStyle: { ...state.collageStyle },
    elements: [],
    storyLayoutId: state.storyLayoutId,
    storySlideType: null,
    storyText: [],
  };
}

function createStoryCarouselSlide(
  definition: CarouselStorySlideDefinition,
  order: number,
  photos: Photo[],
  elements: CanvasElement[],
  collageStyle: CollageStyle
): CarouselSlide {
  const storyLayout = CAROUSEL_STORY_LAYOUTS.find((candidate) => candidate.id === definition.layoutId);
  if (!storyLayout) return createEmptyCarouselSlide({ ...initialEditorState, collageStyle }, order);

  return {
    id: crypto.randomUUID(),
    order,
    photos,
    slotAssignments: Object.fromEntries(photos.map((photo, index) => [index, photo.id])),
    canvasFormatId: storyLayout.formatId,
    selectedLayoutId: storyLayout.photoLayoutId,
    collageStyle: { ...collageStyle, backgroundColor: storyLayout.backgroundColor },
    elements,
    storyLayoutId: storyLayout.id,
    storySlideType: definition.type,
    storyText: createStoryText(definition, storyLayout.textPlacements),
  };
}

function createStoryText(
  definition: CarouselStorySlideDefinition,
  placements: CarouselStoryTextPlacement[]
): CarouselStoryTextItem[] {
  const roles: CarouselStoryTextRole[] = [
    "eyebrow",
    "title",
    "subtitle",
    "body",
    "metadata",
    "location",
    "quote",
    "cta",
  ];

  return roles.flatMap((role, index) => {
    const value = definition[role];
    if (!value) return [];
    const placement = constrainCarouselTextPlacement(
      placements.find((candidate) => candidate.role === role) ?? fallbackStoryTextPlacement(role, index)
    );
    return [{ ...placement, id: crypto.randomUUID(), text: value }];
  });
}

function editorStateFromSlide(slide: CarouselSlide): PhotoEditorState {
  return {
    photos: slide.photos,
    slotAssignments: slide.slotAssignments,
    selectedLayoutId: slide.selectedLayoutId,
    canvasFormatId: slide.canvasFormatId,
    collageStyle: slide.collageStyle,
    elements: slide.elements,
    storyLayoutId: slide.storyLayoutId ?? null,
    storySlideType: slide.storySlideType ?? null,
    storyText: slide.storyText ?? [],
  };
}

function cloneEditorStateToSlide(state: PhotoEditorState, order: number): CarouselSlide {
  const photoIds = new Map(state.photos.map((photo) => [photo.id, crypto.randomUUID()]));
  const photos = state.photos.map((photo) => ({ ...photo, id: photoIds.get(photo.id)! }));
  const slotAssignments = Object.fromEntries(
    Object.entries(state.slotAssignments).map(([slotIndex, photoId]) => [
      slotIndex,
      photoIds.get(photoId) ?? photoId,
    ])
  );
  const elements = state.elements.map((element) => ({ ...element, id: crypto.randomUUID() }));
  const storyText = state.storyText.map((item) => ({ ...item, id: crypto.randomUUID() }));

  return {
    id: crypto.randomUUID(),
    order,
    photos,
    slotAssignments,
    selectedLayoutId: state.selectedLayoutId,
    canvasFormatId: state.canvasFormatId,
    collageStyle: { ...state.collageStyle },
    elements,
    storyLayoutId: state.storyLayoutId,
    storySlideType: state.storySlideType,
    storyText,
  };
}

function appendSnapshot(snapshots: PhotoEditorState[], snapshot: PhotoEditorState) {
  return [...snapshots, snapshot].slice(-MAX_HISTORY_ENTRIES);
}

function hasChanged(previous: PhotoEditorState | null, current: PhotoEditorState) {
  if (!previous) return false;
  if (
    previous.selectedLayoutId !== current.selectedLayoutId ||
    previous.canvasFormatId !== current.canvasFormatId ||
    previous.storyLayoutId !== current.storyLayoutId ||
    previous.storySlideType !== current.storySlideType ||
    previous.collageStyle.spacing !== current.collageStyle.spacing ||
    previous.collageStyle.cornerRadius !== current.collageStyle.cornerRadius ||
    previous.collageStyle.backgroundColor !== current.collageStyle.backgroundColor ||
    previous.collageStyle.borderEnabled !== current.collageStyle.borderEnabled ||
    previous.collageStyle.borderWidth !== current.collageStyle.borderWidth ||
    previous.collageStyle.borderColor !== current.collageStyle.borderColor ||
    previous.photos.length !== current.photos.length ||
    previous.elements.length !== current.elements.length ||
    JSON.stringify(previous.storyText) !== JSON.stringify(current.storyText)
  ) {
    return true;
  }

  const previousSlots = Object.entries(previous.slotAssignments);
  const currentSlots = Object.entries(current.slotAssignments);
  if (
    previousSlots.length !== currentSlots.length ||
    previousSlots.some(([slot, photoId]) => current.slotAssignments[Number(slot)] !== photoId)
  ) {
    return true;
  }

  const photoChanged = previous.photos.some((previousPhoto, index) => {
    const currentPhoto = current.photos[index];
    return (
      !currentPhoto ||
      previousPhoto.id !== currentPhoto.id ||
      previousPhoto.displayMode !== currentPhoto.displayMode ||
      previousPhoto.positionX !== currentPhoto.positionX ||
      previousPhoto.positionY !== currentPhoto.positionY ||
      previousPhoto.zoom !== currentPhoto.zoom ||
      previousPhoto.rotation !== currentPhoto.rotation ||
      previousPhoto.flipX !== currentPhoto.flipX ||
      previousPhoto.flipY !== currentPhoto.flipY ||
      JSON.stringify(previousPhoto.filters) !== JSON.stringify(currentPhoto.filters)
    );
  });

  if (photoChanged) return true;
  return previous.elements.some((previousElement, index) => {
    const currentElement = current.elements[index];
    return !currentElement || Object.keys(previousElement).some((key) =>
      previousElement[key as keyof CanvasElement] !== currentElement[key as keyof CanvasElement]
    );
  });
}

function getDefaultLayout(photoCount: number) {
  const layoutCount = Math.max(1, Math.min(photoCount, 8));
  return COLLAGE_LAYOUTS.find((layout) => layout.photoCount === layoutCount);
}

function getStateLayerStack(state: PhotoEditorState) {
  const layout = state.selectedLayoutId
    ? COLLAGE_LAYOUTS.find((candidate) => candidate.id === state.selectedLayoutId)
    : getDefaultLayout(state.photos.length);
  return getArtworkLayerStack({
    layout,
    photos: state.photos,
    slotAssignments: state.slotAssignments,
    elements: state.elements,
    storyText: state.storyText,
  });
}

function getNextLayerOrder(state: PhotoEditorState) {
  return getStateLayerStack(state).reduce(
    (maximum, layer) => Math.max(maximum, layer.layerOrder),
    -1
  ) + 1;
}

function fallbackStoryTextPlacement(
  role: CarouselStoryTextRole,
  itemIndex: number
): CarouselStoryTextPlacement {
  const isEditorial = role === "eyebrow" || role === "metadata" || role === "location";
  return {
    role,
    x: 0.08,
    y: isEditorial ? 0.06 + itemIndex * 0.04 : 0.2 + itemIndex * 0.09,
    width: 0.84,
    height: role === "title" ? 0.18 : 0.1,
    fontSize: role === "title" || role === "quote" ? 56 : role === "eyebrow" || role === "metadata" || role === "location" ? 18 : 26,
    fontFamily: role === "title" || role === "quote" ? "serif" : "sans",
    fontWeight: role === "eyebrow" || role === "metadata" || role === "location" || role === "cta" ? 600 : 400,
    color: "#29251f",
    textAlign: "left",
    lineHeight: 1.2,
    letterSpacing: 0,
  };
}

export function usePhotos() {
  const context = useContext(PhotoContext);
  if (!context) throw new Error("usePhotos must be used within a PhotoProvider");
  return context;
}

function loadImage(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.width, height: image.height });
    image.onerror = reject;
    image.src = src;
  });
}
