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
import { resolveCreativeLayout } from "./carousel-composition";
import { CAROUSEL_SLIDE_PRESETS, CAROUSEL_DEFAULT_TEXT } from "./carousel-slide-presets";
import { getCarouselTheme, themeCarouselSlide, themeCarouselText } from "./carousel-themes";

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
  themeDefaults?: Partial<CollageStyle>;
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
  carouselDocumentPast: CarouselDocumentHistoryEntry[];
  carouselDocumentFuture: CarouselDocumentHistoryEntry[];
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

interface CarouselDocumentSnapshot {
  carousel: CarouselState;
  slideTimelines: Record<string, HistoryTimeline>;
  activeTimeline: HistoryTimeline;
}

interface CarouselDocumentHistoryEntry {
  before: CarouselDocumentSnapshot;
  after: CarouselDocumentSnapshot;
}

interface HistoryTimeline {
  past: PhotoEditorState[];
  present: PhotoEditorState;
  future: PhotoEditorState[];
  transactionStart: PhotoEditorState | null;
}

type HistoryAction =
  | { type: "commit"; update: (state: PhotoEditorState) => PhotoEditorState }
  | { type: "commit-to-document"; mode: DocumentMode; slideId?: string; update: (state: PhotoEditorState) => PhotoEditorState }
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
  | { type: "add-carousel-slide"; presetId?: string }
  | { type: "duplicate-carousel-slide" }
  | { type: "delete-carousel-slide" }
  | { type: "clear-project" }
  | { type: "apply-carousel-template"; templateId: string }
  | { type: "apply-carousel-theme"; themeId: string }
  | { type: "set-carousel-format"; formatId: string }
  | { type: "distribute-carousel-photos" }
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
  addCarouselSlide: (presetId?: string) => void;
  duplicateCarouselSlide: () => void;
  deleteCarouselSlide: () => void;
  applyCarouselTemplate: (templateId: string) => void;
  applyCarouselTheme: (themeId: string) => void;
  distributeCarouselPhotos: () => void;
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
  uploadBackgroundImage: (file: File) => Promise<void>;
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
  addStoryText: (role?: CarouselStoryTextRole) => string;
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
  carouselDocumentPast: [],
  carouselDocumentFuture: [],
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
      const layout = resolveCreativeLayout(layoutId);
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
      if (history.documentMode === "carousel") {
        dispatch({ type: "set-carousel-format", formatId });
        return;
      }
      commit((currentState) =>
        currentState.canvasFormatId === formatId
          ? currentState
          : { ...currentState, canvasFormatId: formatId }
      );
    },
    [commit, history.documentMode]
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

      dispatch({ type: "commit-to-document", mode: history.documentMode, slideId: history.carousel?.activeSlideId, update: (currentState) => {
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
          ? resolveCreativeLayout(currentState.selectedLayoutId)
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
      } });
    },
    [history.documentMode, history.carousel?.activeSlideId]
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

      dispatch({ type: "commit-to-document", mode: history.documentMode, slideId: history.carousel?.activeSlideId, update: (state) => {
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
      } });
    },
    [history.documentMode, history.carousel?.activeSlideId]
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
        const layout = resolveCreativeLayout(currentState.selectedLayoutId);
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

  const uploadBackgroundImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
    const src = URL.createObjectURL(file);
    objectUrlsRef.current.add(src);
    try {
      const { width, height } = await loadImage(src);
      if (width <= 0 || height <= 0) throw new Error("This image has no usable dimensions.");
      dispatch({ type: "commit-to-document", mode: history.documentMode, slideId: history.carousel?.activeSlideId,
        update: (state) => ({ ...state, collageStyle: { ...state.collageStyle,
          backgroundType: "image", backgroundImage: { src, name: file.name, width, height,
            fit: "cover", positionX: 0.5, positionY: 0.5, zoom: 1, opacity: 1 },
        } }),
      });
    } catch {
      objectUrlsRef.current.delete(src);
      URL.revokeObjectURL(src);
      throw new Error("This image could not be loaded. Choose another image.");
    }
  }, [history.documentMode, history.carousel?.activeSlideId]);

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
    (requestedRole?: CarouselStoryTextRole) => {
      const textId = crypto.randomUUID();
      commit((state) => {
        const storyLayout = state.storyLayoutId
          ? CAROUSEL_STORY_LAYOUTS.find((layout) => layout.id === state.storyLayoutId)
          : undefined;
        const roleOrder: CarouselStoryTextRole[] = [
          "title", "subtitle", "body", "eyebrow", "metadata", "location", "cta", "quote",
        ];
        const role = requestedRole ??
          roleOrder.find((candidate) => !state.storyText.some((item) => item.role === candidate)) ??
          (history.documentMode === "carousel" ? "body" : undefined);
        if (!role || state.storyText.length >= (history.documentMode === "carousel" ? 32 : 8)) return state;
        const roleCount = state.storyText.filter((item) => item.role === role).length;
        if (history.documentMode === "collage" && roleCount > 0) return state;
        const basePlacement = storyLayout?.textPlacements.find((candidate) => candidate.role === role) ??
          fallbackStoryTextPlacement(role, history.documentMode === "carousel" ? state.storyText.length % 6 : state.storyText.length);
        const placement = constrainCarouselTextPlacement(history.documentMode === "carousel" && roleCount > 0
          ? { ...basePlacement, x: basePlacement.x + (roleCount % 5) * 0.02, y: basePlacement.y + (roleCount % 5) * 0.03 }
          : basePlacement);
        const item: CarouselStoryTextItem = {
          ...placement, id: textId,
          text: history.documentMode === "carousel" ? CAROUSEL_DEFAULT_TEXT[role] : DEFAULT_STORY_TEXT_BY_ROLE[role],
          layerOrder: getNextLayerOrder(state),
          ...(history.documentMode === "carousel" ? { textBox: true } : {}),
        };
        const theme = history.documentMode === "carousel" ? getCarouselTheme(history.carousel?.themeId) : undefined;
        return { ...state, storyText: [...state.storyText, theme ? themeCarouselText(item, theme, storyLayout, true) : item] };
      });
      return textId;
    },
    [commit, history.carousel?.themeId, history.documentMode]
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
  const addCarouselSlide = useCallback((presetId?: string) => dispatch({ type: "add-carousel-slide", presetId }), []);
  const duplicateCarouselSlide = useCallback(() => dispatch({ type: "duplicate-carousel-slide" }), []);
  const deleteCarouselSlide = useCallback(() => dispatch({ type: "delete-carousel-slide" }), []);
  const applyCarouselTemplate = useCallback(
    (templateId: string) => dispatch({ type: "apply-carousel-template", templateId }),
    []
  );
  const applyCarouselTheme = useCallback(
    (themeId: string) => dispatch({ type: "apply-carousel-theme", themeId }), []
  );
  const distributeCarouselPhotos = useCallback(() => dispatch({ type: "distribute-carousel-photos" }), []);
  const applyCarouselStoryLayout = useCallback(
    (layoutId: CarouselStoryLayoutId) => {
      const storyLayout = CAROUSEL_STORY_LAYOUTS.find((candidate) => candidate.id === layoutId);
      const photoLayout = storyLayout
        ? resolveCreativeLayout(storyLayout.photoLayoutId)
        : undefined;
      if (!storyLayout || !photoLayout) return;

      commit((currentState) => {
        const slotAssignments: Record<number, string> = {};
        currentState.photos.slice(0, photoLayout.cells.length).forEach((photo, slotIndex) => {
          slotAssignments[slotIndex] = photo.id;
        });
        const storyText = currentState.storyText.map((item) => {
          if (item.locked) return item;
          const placement = storyLayout.textPlacements.find((candidate) => candidate.role === item.role);
          return placement
            ? { ...item, ...constrainCarouselTextPlacement(placement), id: item.id, text: item.text }
            : item;
        });

        const slide: CarouselSlide = {
          ...currentState,
          id: "active", order: 0,
          selectedLayoutId: storyLayout.photoLayoutId,
          canvasFormatId: currentState.canvasFormatId,
          collageStyle: { ...currentState.collageStyle, backgroundColor: storyLayout.backgroundColor },
          storyLayoutId: storyLayout.id,
          slotAssignments,
          storyText,
        };
        const theme = getCarouselTheme(history.carousel?.themeId);
        const themed = theme ? themeCarouselSlide(slide, theme, true) : slide;
        return { ...currentState, selectedLayoutId: themed.selectedLayoutId,
          storyLayoutId: storyLayout.id, slotAssignments, storyText: themed.storyText ?? [],
          collageStyle: themed.collageStyle, themeDefaults: themed.themeDefaults };
      });
    },
    [commit, history.carousel?.themeId]
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
            history.carouselDocumentPast.length > 0),
        canRedo:
          history.future.length > 0 ||
          (history.documentMode === "carousel" &&
            history.carouselDocumentFuture.length > 0),
        setDocumentMode,
        selectCarouselSlide,
        addCarouselSlide,
        duplicateCarouselSlide,
        deleteCarouselSlide,
        applyCarouselTemplate,
        applyCarouselTheme,
        distributeCarouselPhotos,
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
        uploadBackgroundImage,
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
  if (action.type === "commit-to-document") {
    const current = persistActiveDocument(history);
    if (action.mode === "carousel") {
      const slide = current.carousel?.slides.find((item) => item.id === action.slideId);
      if (!slide || !current.carousel) return history;
      const timeline = current.slideTimelines[slide.id] ?? createTimeline(editorStateFromSlide(slide));
      const updated = historyReducer({ ...current, ...timeline, documentMode: "carousel",
        carousel: { ...current.carousel, activeSlideId: slide.id } }, { type: "commit", update: action.update });
      const restored = selectHistoryCarouselSlide(updated, current.carousel.activeSlideId);
      return current.documentMode === "collage"
        ? { ...restored, ...current.collageTimeline, documentMode: "collage" } : restored;
    }
    const updated = historyReducer({ ...current, ...current.collageTimeline, documentMode: "collage" }, { type: "commit", update: action.update });
    return current.documentMode === "carousel" ? { ...updated, ...getTimeline(current), documentMode: "carousel" } : updated;
  }
  if (action.type === "replace-presentation") {
    return createPresentationHistory(action.presentation);
  }
  if (action.type === "set-document-mode") return setHistoryDocumentMode(history, action.mode);
  if (action.type === "select-carousel-slide") {
    return selectHistoryCarouselSlide(history, action.slideId);
  }
  if (action.type === "add-carousel-slide") return addHistoryCarouselSlide(history, false, action.presetId);
  if (action.type === "duplicate-carousel-slide") return addHistoryCarouselSlide(history, true);
  if (action.type === "delete-carousel-slide") return deleteHistoryCarouselSlide(history);
  if (action.type === "clear-project") return clearHistoryProject(history);
  if (action.type === "apply-carousel-template") {
    return applyCarouselTemplateHistory(history, action.templateId);
  }
  if (action.type === "apply-carousel-theme" || action.type === "set-carousel-format") {
    return updateCarouselDesignHistory(history, action);
  }
  if (action.type === "reorder-carousel-slide") {
    return reorderHistoryCarouselSlide(history, action.slideId, action.targetSlideId, action.placement);
  }
  if (action.type === "distribute-carousel-photos") return distributeCarouselPhotosHistory(history);

  // Slide edits stay local. If a document command is waiting and its newer edits
  // live on another slide, bring that slide into view instead of silently doing nothing.
  if (history.documentMode === "carousel" && history.carousel && (action.type === "undo" || action.type === "redo")) {
    const entry = action.type === "undo" ? history.carouselDocumentPast.at(-1) : history.carouselDocumentFuture[0];
    const checkpoint = action.type === "undo" ? entry?.after : entry?.before;
    const field = action.type === "undo" ? "past" : "future";
    if (checkpoint) {
      const activeExpected = getSnapshotSlideState(checkpoint, history.carousel.activeSlideId);
      if (activeExpected && !hasChanged(activeExpected, history.present)) {
        const edited = history.carousel.slides.find((slide) => {
          const expected = getSnapshotSlideState(checkpoint, slide.id);
          const timeline = history.slideTimelines[slide.id];
          return expected && timeline && timeline[field].length > 0 && hasChanged(expected, timeline.present);
        });
        if (edited) return historyReducer(selectHistoryCarouselSlide(history, edited.id), action);
      }
    }
  }

  if (
    action.type === "undo" &&
    history.documentMode === "carousel" &&
    history.carouselDocumentPast.length > 0 &&
    !hasNewerCarouselDocumentChanges(
      history,
      history.carouselDocumentPast[history.carouselDocumentPast.length - 1]
    )
  ) {
    return undoCarouselDocument(history);
  }
  if (
    action.type === "redo" &&
    history.documentMode === "carousel" &&
    history.carouselDocumentFuture.length > 0 &&
    !hasUndoneCarouselDocumentChanges(history, history.carouselDocumentFuture[0])
  ) {
    return redoCarouselDocument(history);
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
        ? { ...committed, carouselDocumentFuture: [] }
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
        ? clearCarouselDocumentFuture(persistActiveDocument({
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
  const emptySlide = themeCarouselSlide(createEmptyCarouselSlide({ ...emptyState, canvasFormatId: "portrait" }, 0), getCarouselTheme("redwell")!, true);
  const timeline = createTimeline(editorStateFromSlide(emptySlide));
  return {
    ...history,
    ...timeline,
    carousel: {
      id: crypto.randomUUID(),
      slides: [emptySlide],
      activeSlideId: emptySlide.id,
      templateId: null,
      themeId: "redwell",
      canvasFormatId: "portrait",
    },
    slideTimelines: { [emptySlide.id]: timeline },
        carouselDocumentPast: [],
    carouselDocumentFuture: [],
  };
}

function setHistoryDocumentMode(history: HistoryState, mode: DocumentMode): HistoryState {
  if (history.documentMode === mode) return history;
  const current = persistActiveDocument(history);

  if (mode === "collage") {
    return { ...current, ...current.collageTimeline, documentMode: "collage" };
  }

  if (!current.carousel) {
    const isEmpty = current.present.photos.length === 0 && current.present.elements.length === 0 && current.present.storyText.length === 0;
    const slide = isEmpty
      ? themeCarouselSlide({ ...createEmptyCarouselSlide(current.present, 0), canvasFormatId: "portrait", selectedLayoutId: null }, getCarouselTheme("redwell")!, true)
      : cloneEditorStateToSlide(current.present, 0);
    const timeline = createTimeline(editorStateFromSlide(slide));
    const carousel: CarouselState = {
      id: crypto.randomUUID(),
      slides: [slide],
      activeSlideId: slide.id,
      canvasFormatId: slide.canvasFormatId,
      themeId: isEmpty ? "redwell" : null,
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

function addHistoryCarouselSlide(history: HistoryState, shouldDuplicate: boolean, presetId?: string): HistoryState {
  if (history.documentMode !== "carousel" || !history.carousel) return history;
  const current = settleCarouselHistory(history);
  const slides = [...current.carousel!.slides].sort((first, second) => first.order - second.order);
  const activeIndex = slides.findIndex((slide) => slide.id === current.carousel?.activeSlideId);
  const insertionIndex = activeIndex + 1;
  const preset = CAROUSEL_SLIDE_PRESETS.find((item) => item.id === presetId);
  const theme = getCarouselTheme(current.carousel?.themeId);
  const source = shouldDuplicate
    ? cloneEditorStateToSlide(current.present, insertionIndex)
    : preset
      ? createStoryCarouselSlide(preset.definition, insertionIndex, [], [], current.present.collageStyle)
      : { ...createEmptyCarouselSlide(current.present, insertionIndex), selectedLayoutId: "carousel-type", storyLayoutId: null };
  const slide = !shouldDuplicate && theme ? themeCarouselSlide(source, theme, true) : source;
  slide.canvasFormatId = current.carousel!.canvasFormatId ?? current.present.canvasFormatId;
  slides.splice(insertionIndex, 0, slide);
  const orderedSlides = slides.map((item, order) => ({ ...item, order }));
  const nextSlide = orderedSlides[insertionIndex];
  const timeline = createTimeline(editorStateFromSlide(nextSlide));

  return recordCarouselDocumentChange(current, {
    ...current,
    ...timeline,
    carousel: {
      ...current.carousel!,
      slides: orderedSlides,
      activeSlideId: nextSlide.id,
    },
    slideTimelines: { ...current.slideTimelines, [nextSlide.id]: timeline },
    carouselDocumentFuture: [],
  });
}

function deleteHistoryCarouselSlide(history: HistoryState): HistoryState {
  if (history.documentMode !== "carousel" || !history.carousel || history.carousel.slides.length <= 1) {
    return history;
  }

  const current = settleCarouselHistory(history);
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

  return recordCarouselDocumentChange(current, {
    ...current,
    ...timeline,
    carousel: {
      ...current.carousel!,
      slides: orderedSlides,
      activeSlideId: nextSlide.id,
    },
    slideTimelines: { ...slideTimelines, [nextSlide.id]: timeline },
      carouselDocumentFuture: [],
  });
}

function applyCarouselTemplateHistory(history: HistoryState, templateId: string): HistoryState {
  if (history.documentMode !== "carousel" || !history.carousel) return history;
  const template = getCarouselStoryTemplate(templateId);
  if (!template) return history;

  const current = settleCarouselHistory(history);
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
    return resolveCreativeLayout(storyLayout?.photoLayoutId)?.cells.length ?? 1;
  };
  const initialCapacity = definitions.reduce((count, definition) => count + layoutCellCount(definition.layoutId), 0);
  let additionalCapacity = initialCapacity;
  let overflowIndex = 0;
  while (additionalCapacity < photos.length && layoutCellCount(template.overflowSlide.layoutId) > 0) {
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
    const collageLayout = resolveCreativeLayout(storyLayout.photoLayoutId)!;
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

  if (photoOffset < photos.length) slides[slides.length - 1].photos.push(...photos.slice(photoOffset));
  const theme = getCarouselTheme(template.themeId ?? "redwell")!;
  const themedSlides = slides.map((slide) => ({ ...themeCarouselSlide(slide, theme, true), canvasFormatId: current.carousel!.canvasFormatId ?? current.present.canvasFormatId }));
  const activeSlide = themedSlides[0];
  const timeline = createTimeline(editorStateFromSlide(activeSlide));
  const applied: HistoryState = {
    ...current,
    ...timeline,
    carousel: {
      ...current.carousel!,
      templateId: template.id,
      themeId: theme.id,
      canvasFormatId: activeSlide.canvasFormatId,
      slides: themedSlides,
      activeSlideId: activeSlide.id,
    },
    slideTimelines: { [activeSlide.id]: timeline },
        carouselDocumentFuture: [],
  };
  return recordCarouselDocumentChange(current, applied);
}

function reorderHistoryCarouselSlide(
  history: HistoryState,
  slideId: string,
  targetSlideId: string,
  placement: "before" | "after"
): HistoryState {
  if (history.documentMode !== "carousel" || !history.carousel || slideId === targetSlideId) return history;

  const current = settleCarouselHistory(history);
  const slides = [...current.carousel!.slides].sort((first, second) => first.order - second.order);
  const sourceIndex = slides.findIndex((slide) => slide.id === slideId);
  if (sourceIndex < 0 || !slides.some((slide) => slide.id === targetSlideId)) return history;

  const previousOrder = slides.map((slide) => slide.id);
  const [movingSlide] = slides.splice(sourceIndex, 1);
  const targetIndex = slides.findIndex((slide) => slide.id === targetSlideId);
  const insertionIndex = targetIndex + (placement === "after" ? 1 : 0);
  slides.splice(insertionIndex, 0, movingSlide);
  if (slides.every((slide, index) => slide.id === previousOrder[index])) return history;

  return recordCarouselDocumentChange(current, {
    ...current,
    carousel: { ...current.carousel!, slides: reindexCarouselSlides(slides) },
  });
}

function clearCarouselDocumentFuture(history: HistoryState): HistoryState {
  return history.documentMode === "carousel"
    ? { ...history, carouselDocumentFuture: [] }
    : history;
}

function clearCarouselHistoryFuture(history: HistoryState): HistoryState {
  return {
    ...history,
    future: [],
    slideTimelines: Object.fromEntries(
      Object.entries(history.slideTimelines).map(([slideId, timeline]) => [slideId, { ...timeline, future: [] }])
    ),
      carouselDocumentFuture: [],
  };
}

function settleCarouselHistory(history: HistoryState): HistoryState {
  return clearCarouselHistoryFuture(historyReducer(history, { type: "finish-transaction" }));
}

/** A document command is a history barrier: snapshots retain slide timelines and shared image URLs. */
function recordCarouselDocumentChange(before: HistoryState, after: HistoryState): HistoryState {
  const applied = { ...after, carouselDocumentFuture: [] };
  const entry: CarouselDocumentHistoryEntry = {
    before: captureCarouselDocument(before), after: captureCarouselDocument(applied),
  };
  return { ...applied, carouselDocumentPast: [...before.carouselDocumentPast, entry].slice(-MAX_HISTORY_ENTRIES) };
}

function updateCarouselDesignHistory(
  history: HistoryState,
  action: { type: "apply-carousel-theme"; themeId: string } | { type: "set-carousel-format"; formatId: string }
): HistoryState {
  if (history.documentMode !== "carousel" || !history.carousel) return history;
  const theme = action.type === "apply-carousel-theme" ? getCarouselTheme(action.themeId) : undefined;
  if (action.type === "apply-carousel-theme" && !theme) return history;
  if (action.type === "set-carousel-format" && !CANVAS_FORMATS.some((format) => format.id === action.formatId)) return history;
  if (action.type === "set-carousel-format" && history.carousel.slides.every((slide) => slide.canvasFormatId === action.formatId)) return history;
  if (theme && history.carousel.themeId === theme.id) return history;
  const current = settleCarouselHistory(history);
  const slides = current.carousel!.slides.map((slide) => theme
    ? themeCarouselSlide(slide, theme)
    : { ...slide, canvasFormatId: action.type === "set-carousel-format" ? action.formatId : slide.canvasFormatId });
  const slideTimelines = Object.fromEntries(slides.map((slide) => {
    const timeline = current.slideTimelines[slide.id] ?? createTimeline(editorStateFromSlide(slide));
    return [slide.id, { ...timeline, present: editorStateFromSlide(slide), transactionStart: null }];
  }));
  return recordCarouselDocumentChange(current, {
    ...current, ...slideTimelines[current.carousel!.activeSlideId], slideTimelines,
    carousel: { ...current.carousel!, slides,
      ...(theme ? { themeId: theme.id } : action.type === "set-carousel-format" ? { canvasFormatId: action.formatId } : {}) },
  });
}

function distributeCarouselPhotosHistory(history: HistoryState): HistoryState {
  if (history.documentMode !== "carousel" || !history.carousel) return history;
  const assigned = new Set(Object.values(history.present.slotAssignments));
  const unplaced = history.present.photos.filter((photo) => !assigned.has(photo.id));
  if (!unplaced.length) return history;
  const current = settleCarouselHistory(history);
  const slides = [...current.carousel!.slides].sort((a, b) => a.order - b.order);
  const index = slides.findIndex((slide) => slide.id === current.carousel!.activeSlideId);
  const sourceState = { ...current.present, photos: current.present.photos.filter((photo) => assigned.has(photo.id)) };
  slides[index] = { ...slides[index], ...sourceState };
  const theme = getCarouselTheme(current.carousel!.themeId);
  const definition = CAROUSEL_SLIDE_PRESETS.find((preset) => preset.id === "photo")!.definition;
  const added = unplaced.map((photo, offset) => {
    const slide = createStoryCarouselSlide(definition, index + offset + 1, [photo], [], current.present.collageStyle);
    return { ...(theme ? themeCarouselSlide(slide, theme, true) : slide), canvasFormatId: current.carousel!.canvasFormatId ?? current.present.canvasFormatId };
  });
  slides.splice(index + 1, 0, ...added);
  const slideTimelines = { ...current.slideTimelines,
    [current.carousel!.activeSlideId]: { ...getTimeline(current), present: sourceState },
    ...Object.fromEntries(added.map((slide) => [slide.id, createTimeline(editorStateFromSlide(slide))])),
  };
  return recordCarouselDocumentChange(current, { ...current, ...slideTimelines[added[0].id], slideTimelines,
    carousel: { ...current.carousel!, slides: reindexCarouselSlides(slides), activeSlideId: added[0].id } });
}

function captureCarouselDocument(history: HistoryState): CarouselDocumentSnapshot {
  if (!history.carousel) throw new Error("Cannot capture a missing carousel document.");
  return {
    carousel: history.carousel,
    slideTimelines: history.slideTimelines,
    activeTimeline: getTimeline(history),
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
  };
}

function hasNewerCarouselDocumentChanges(
  history: HistoryState,
  entry: CarouselDocumentHistoryEntry
): boolean {
  if (!history.carousel) return false;
  if (history.transactionStart && hasChanged(history.transactionStart, history.present)) return true;
  const currentSlideIds = history.carousel.slides.map((slide) => slide.id).sort();
  const expectedSlideIds = entry.after.carousel.slides.map((slide) => slide.id).sort();
  if (
    currentSlideIds.length !== expectedSlideIds.length ||
    currentSlideIds.some((slideId, index) => slideId !== expectedSlideIds[index])
  ) return true;
  return history.carousel.slides.some((slide) => {
    const expected = getSnapshotSlideState(entry.after, slide.id);
    const current = slide.id === history.carousel?.activeSlideId ? history.present : history.slideTimelines[slide.id]?.present ?? editorStateFromSlide(slide);
    return !expected || hasChanged(expected, current);
  });
}

function hasUndoneCarouselDocumentChanges(
  history: HistoryState,
  entry: CarouselDocumentHistoryEntry
): boolean {
  if (!history.carousel) return false;
  const currentSlideIds = history.carousel.slides.map((slide) => slide.id).sort();
  const expectedSlideIds = entry.before.carousel.slides.map((slide) => slide.id).sort();
  if (
    currentSlideIds.length !== expectedSlideIds.length ||
    currentSlideIds.some((slideId, index) => slideId !== expectedSlideIds[index])
  ) return true;
  return history.carousel.slides.some((slide) => {
    const expected = getSnapshotSlideState(entry.before, slide.id);
    const current = slide.id === history.carousel?.activeSlideId ? history.present : history.slideTimelines[slide.id]?.present ?? editorStateFromSlide(slide);
    return !expected || hasChanged(expected, current);
  });
}

function getSnapshotSlideState(snapshot: CarouselDocumentSnapshot, slideId: string) {
  if (snapshot.carousel.activeSlideId === slideId) return snapshot.activeTimeline.present;
  const slide = snapshot.carousel.slides.find((candidate) => candidate.id === slideId);
  return snapshot.slideTimelines[slideId]?.present ?? (slide ? editorStateFromSlide(slide) : undefined);
}

function undoCarouselDocument(history: HistoryState): HistoryState {
  if (history.carouselDocumentPast.length === 0) return history;
  const current = persistActiveDocument(history);
  const [entry, ...remaining] = [...current.carouselDocumentPast].reverse();
  const carouselDocumentPast = remaining.reverse();
  const after = captureCarouselDocument(current);
  const restored = restoreCarouselDocument(current, entry.before);
  return {
    ...restored,
    carouselDocumentPast,
    carouselDocumentFuture: [{ ...entry, after }, ...current.carouselDocumentFuture],
  };
}

function redoCarouselDocument(history: HistoryState): HistoryState {
  if (history.carouselDocumentFuture.length === 0) return history;
  const [entry, ...carouselDocumentFuture] = history.carouselDocumentFuture;
  const restored = restoreCarouselDocument(history, entry.after);
  return {
    ...restored,
    carouselDocumentPast: [...history.carouselDocumentPast, entry],
    carouselDocumentFuture,
  };
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
  const storyText = createStoryText(definition, storyLayout.textPlacements).map((item, index) => ({
    ...item, layerOrder: photos.length + index,
  }));

  return {
    id: crypto.randomUUID(),
    order,
    photos: photos.map((photo, index) => ({ ...photo, layerOrder: index })),
    slotAssignments: Object.fromEntries(photos.map((photo, index) => [index, photo.id])),
    canvasFormatId: storyLayout.formatId,
    selectedLayoutId: storyLayout.photoLayoutId,
    collageStyle: { ...collageStyle, backgroundColor: storyLayout.backgroundColor },
    elements: elements.map((element, index) => ({ ...element, zIndex: index, layerOrder: photos.length + storyText.length + index })),
    storyLayoutId: storyLayout.id,
    storySlideType: definition.type,
    storyText,
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
    return [{ ...placement, id: crypto.randomUUID(), text: value, textBox: true }];
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
    themeDefaults: slide.themeDefaults,
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
  const storyText = state.storyText.map((item) => ({ ...item, id: crypto.randomUUID(), textBox: true }));

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
    themeDefaults: state.themeDefaults,
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
    JSON.stringify(previous.themeDefaults) !== JSON.stringify(current.themeDefaults) ||
    previous.collageStyle.spacing !== current.collageStyle.spacing ||
    previous.collageStyle.cornerRadius !== current.collageStyle.cornerRadius ||
    previous.collageStyle.backgroundColor !== current.collageStyle.backgroundColor ||
    previous.collageStyle.backgroundType !== current.collageStyle.backgroundType ||
    previous.collageStyle.backgroundImage !== current.collageStyle.backgroundImage ||
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
      previousPhoto.src !== currentPhoto.src ||
      previousPhoto.visible !== currentPhoto.visible ||
      previousPhoto.locked !== currentPhoto.locked ||
      previousPhoto.layerOrder !== currentPhoto.layerOrder ||
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
    ? resolveCreativeLayout(state.selectedLayoutId)
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
