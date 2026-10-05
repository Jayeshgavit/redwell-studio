"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PhotoFilters } from "@/types/editor";
import { createPhotoFilterPreset } from "@/components/create/photo-filters";
import {
  INITIAL_IMAGE_EDIT,
  getImageHeight,
  getImageWidth,
  renderEditedImage,
  renderExportCanvas,
  type EditableImageSource,
  type EditorAdjustments,
  type EffectLayer,
  type EffectParameter,
  type ImageEditState,
  type ImageEffect,
} from "./image-editor-renderer";
import { imageProcessingProviders } from "./image-processing-providers";
import {
  BUILT_IN_PRESETS,
  PRESET_CATEGORIES,
  PRESET_SCHEMA,
  PRESET_SCHEMA_VERSION,
  type Preset,
} from "./image-editor-presets";

type EditorTool = "adjust" | "presets" | "effects" | "layers" | "enhance" | "crop" | "background";
type AdjustmentKey = keyof EditorAdjustments;
type AspectId = "original" | "1:1" | "4:5" | "3:4" | "16:9" | "9:16";
interface EditHistoryEntry {
  state: ImageEditState;
  label: string;
}
interface EffectDefinition {
  id: ImageEffect;
  name: string;
  category: string;
  detail: string;
  controls: { key: EffectParameter; label: string; min: number; max: number; initial: number }[];
}

const TOOLS: { id: EditorTool; label: string; number: string }[] = [
  { id: "presets", label: "Presets", number: "01" },
  { id: "adjust", label: "Adjust", number: "02" },
  { id: "effects", label: "Effects", number: "03" },
  { id: "enhance", label: "Enhance", number: "04" },
  { id: "crop", label: "Crop", number: "05" },
  { id: "background", label: "Background", number: "06" },
  { id: "layers", label: "Layers", number: "07" },
];

const EFFECTS: EffectDefinition[] = [
  { id: "fog", name: "Fog", category: "Light / Atmosphere", detail: "A diffused, atmospheric veil", controls: [{ key: "intensity", label: "Intensity", min: 0, max: 100, initial: 48 }, { key: "density", label: "Density", min: 0, max: 100, initial: 45 }, { key: "softness", label: "Softness", min: 0, max: 100, initial: 55 }] },
  { id: "glow", name: "Glow", category: "Light / Atmosphere", detail: "Soft luminous highlights", controls: [{ key: "intensity", label: "Intensity", min: 0, max: 100, initial: 40 }, { key: "radius", label: "Radius", min: 5, max: 100, initial: 35 }, { key: "highlights", label: "Highlights", min: 0, max: 100, initial: 40 }] },
  { id: "bloom", name: "Bloom", category: "Light / Atmosphere", detail: "Gentle highlight spread", controls: [{ key: "intensity", label: "Intensity", min: 0, max: 100, initial: 42 }, { key: "radius", label: "Radius", min: 5, max: 100, initial: 38 }, { key: "threshold", label: "Threshold", min: 0, max: 100, initial: 65 }] },
  { id: "light-leak", name: "Light Leak", category: "Light / Atmosphere", detail: "Warm light across the frame", controls: [{ key: "intensity", label: "Intensity", min: 0, max: 100, initial: 45 }, { key: "position", label: "Position", min: 0, max: 100, initial: 18 }, { key: "warmth", label: "Warmth", min: 0, max: 100, initial: 62 }] },
  { id: "soft-focus", name: "Soft Focus", category: "Light / Atmosphere", detail: "Subtle lens diffusion", controls: [{ key: "intensity", label: "Intensity", min: 0, max: 100, initial: 35 }, { key: "radius", label: "Radius", min: 5, max: 100, initial: 22 }] },
  { id: "vignette", name: "Vignette", category: "Light / Atmosphere", detail: "Draw attention toward the center", controls: [{ key: "intensity", label: "Amount", min: 0, max: 100, initial: 36 }, { key: "feather", label: "Feather", min: 0, max: 100, initial: 72 }, { key: "midpoint", label: "Midpoint", min: 0, max: 100, initial: 55 }] },
  { id: "dreamy", name: "Dreamy", category: "Light / Atmosphere", detail: "Airy softness with a low glow", controls: [{ key: "intensity", label: "Intensity", min: 0, max: 100, initial: 38 }, { key: "softness", label: "Softness", min: 0, max: 100, initial: 55 }] },
  { id: "haze", name: "Haze", category: "Light / Atmosphere", detail: "Lift distant tones with atmosphere", controls: [{ key: "intensity", label: "Intensity", min: 0, max: 100, initial: 36 }, { key: "density", label: "Density", min: 0, max: 100, initial: 42 }] },
  { id: "golden-light", name: "Golden Light", category: "Light / Atmosphere", detail: "A warm directional glow", controls: [{ key: "intensity", label: "Intensity", min: 0, max: 100, initial: 38 }, { key: "position", label: "Position", min: 0, max: 100, initial: 18 }, { key: "warmth", label: "Warmth", min: 0, max: 100, initial: 72 }] },
  { id: "shadow-fade", name: "Shadow Fade", category: "Light / Atmosphere", detail: "Soften the frame's dark edges", controls: [{ key: "intensity", label: "Intensity", min: 0, max: 100, initial: 32 }, { key: "feather", label: "Feather", min: 0, max: 100, initial: 70 }] },
  { id: "film-grain", name: "Film Grain", category: "Film / Texture", detail: "Fine photographic grain", controls: [{ key: "intensity", label: "Amount", min: 0, max: 100, initial: 24 }, { key: "size", label: "Size", min: 10, max: 100, initial: 42 }, { key: "roughness", label: "Roughness", min: 0, max: 100, initial: 50 }] },
  { id: "dust", name: "Dust", category: "Film / Texture", detail: "Sparse flecks on a film surface", controls: [{ key: "intensity", label: "Amount", min: 0, max: 100, initial: 38 }, { key: "size", label: "Size", min: 10, max: 100, initial: 50 }] },
  { id: "vintage", name: "Vintage", category: "Film / Texture", detail: "Warm, gently faded color", controls: [{ key: "intensity", label: "Intensity", min: 0, max: 100, initial: 42 }, { key: "warmth", label: "Warmth", min: 0, max: 100, initial: 58 }] },
  { id: "matte", name: "Matte", category: "Film / Texture", detail: "Lifted blacks and restrained contrast", controls: [{ key: "intensity", label: "Intensity", min: 0, max: 100, initial: 40 }] },
  { id: "faded-film", name: "Faded Film", category: "Film / Texture", detail: "A soft, low-contrast film finish", controls: [{ key: "intensity", label: "Intensity", min: 0, max: 100, initial: 36 }, { key: "warmth", label: "Warmth", min: 0, max: 100, initial: 48 }] },
  { id: "analog", name: "Analog", category: "Film / Texture", detail: "Warm analog character and texture", controls: [{ key: "intensity", label: "Intensity", min: 0, max: 100, initial: 45 }, { key: "roughness", label: "Roughness", min: 0, max: 100, initial: 50 }] },
  { id: "cinematic-grain", name: "Cinematic Grain", category: "Film / Texture", detail: "Fine, film-like texture", controls: [{ key: "intensity", label: "Amount", min: 0, max: 100, initial: 20 }, { key: "roughness", label: "Roughness", min: 0, max: 100, initial: 38 }] },
  ...([
    ["warm", "Warm", "Subtle amber color balance"],
    ["cool", "Cool", "A cooler, blue-leaning balance"],
    ["moody", "Moody", "A restrained, low-key finish"],
    ["cinematic", "Cinematic", "Cool shadows and quiet color"],
    ["golden-hour", "Golden Hour", "Sunlit warmth and color"],
    ["urban", "Urban", "Cool, reduced color"],
    ["clean", "Clean", "A precise, natural finish"],
    ["soft", "Soft", "Gentler contrast and tone"],
    ["dramatic", "Dramatic", "Stronger tonal separation"],
    ["deep-contrast", "Deep Contrast", "Dense blacks and firm contrast"],
    ["pastel", "Pastel", "A lighter, softer color palette"],
  ] as [ImageEffect, string, string][]).map(([id, name, detail]): EffectDefinition => ({
    id,
    name,
    category: "Color / Mood",
    detail,
    controls: [{ key: "intensity", label: "Intensity", min: 0, max: 100, initial: 42 }],
  })),
  ...([
    ["black-white", "Black & White", "Balanced monochrome"],
    ["high-contrast-bw", "High Contrast B&W", "Crisp monochrome tones"],
    ["soft-bw", "Soft B&W", "A gentler monochrome finish"],
    ["warm-mono", "Warm Monochrome", "Subtle warmth in the gray tones"],
    ["cool-mono", "Cool Monochrome", "Cool-leaning monochrome"],
  ] as [ImageEffect, string, string][]).map(([id, name, detail]): EffectDefinition => ({
    id,
    name,
    category: "Monochrome",
    detail,
    controls: [{ key: "intensity", label: "Intensity", min: 0, max: 100, initial: 100 }],
  })),
];

const ASPECTS: { id: AspectId; ratio?: number }[] = [
  { id: "original" },
  { id: "1:1", ratio: 1 },
  { id: "4:5", ratio: 4 / 5 },
  { id: "3:4", ratio: 3 / 4 },
  { id: "16:9", ratio: 16 / 9 },
  { id: "9:16", ratio: 9 / 16 },
];

const ADJUSTMENT_GROUPS: {
  label: string;
  controls: { key: AdjustmentKey; label: string; min: number; max: number; initial: number }[];
}[] = [
  {
    label: "Light",
    controls: [
      { key: "brightness", label: "Brightness", min: 40, max: 160, initial: 100 },
      { key: "contrast", label: "Contrast", min: 40, max: 170, initial: 100 },
      { key: "exposure", label: "Exposure", min: -80, max: 80, initial: 0 },
      { key: "highlights", label: "Highlights", min: -80, max: 80, initial: 0 },
      { key: "shadows", label: "Shadows", min: -80, max: 80, initial: 0 },
      { key: "whites", label: "Whites", min: -80, max: 80, initial: 0 },
      { key: "blacks", label: "Blacks", min: -80, max: 80, initial: 0 },
    ],
  },
  {
    label: "Color",
    controls: [
      { key: "saturation", label: "Saturation", min: 0, max: 180, initial: 100 },
      { key: "vibrance", label: "Vibrance", min: -100, max: 100, initial: 0 },
      { key: "temperature", label: "Temperature", min: -70, max: 70, initial: 0 },
      { key: "tint", label: "Tint", min: -60, max: 60, initial: 0 },
    ],
  },
  {
    label: "Detail",
    controls: [
      { key: "sharpness", label: "Sharpness", min: 0, max: 100, initial: 0 },
      { key: "clarity", label: "Clarity", min: -60, max: 60, initial: 0 },
      { key: "texture", label: "Texture", min: -60, max: 60, initial: 0 },
      { key: "dehaze", label: "Dehaze", min: -60, max: 60, initial: 0 },
      { key: "blur", label: "Blur", min: 0, max: 8, initial: 0 },
    ],
  },
  {
    label: "Finish",
    controls: [
      { key: "vignette", label: "Vignette", min: 0, max: 100, initial: 0 },
      { key: "grain", label: "Grain", min: 0, max: 100, initial: 0 },
    ],
  },
];

const THUMBNAIL_CACHE = new Map<string, string>();
const PREVIEW_CACHE_LIMIT = 2;
const PREVIEW_BITMAP_CACHE = new Map<string, ImageBitmap>();
const IMAGE_SOURCE_IDS = new WeakMap<HTMLImageElement, number>();
let nextImageSourceId = 1;

export function ImageEditorWorkspace() {
  const uploadRef = useRef<HTMLInputElement>(null);
  const presetUploadRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasFrameRef = useRef<HTMLDivElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const editRef = useRef<ImageEditState>(INITIAL_IMAGE_EDIT);
  const inspectorPointerRef = useRef<{ pointerId: number; startX: number; width: number } | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    kind: "move" | "resize";
    x: number;
    y: number;
    crop: ImageEditState["crop"];
  } | null>(null);
  const [source, setSource] = useState<{ url: string; name: string } | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [edit, setEdit] = useState<ImageEditState>(INITIAL_IMAGE_EDIT);
  const [tool, setTool] = useState<EditorTool>("presets");
  const [presetGroup, setPresetGroup] = useState<string>("ALL");
  const [presetSearch, setPresetSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentPresets, setRecentPresets] = useState<string[]>([]);
  const [userPresets, setUserPresets] = useState<Preset[]>([]);
  const [presetDataLoaded, setPresetDataLoaded] = useState(false);
  const [activeEffectId, setActiveEffectId] = useState<string | null>(null);
  const [aspect, setAspect] = useState<AspectId>("original");
  const [past, setPast] = useState<EditHistoryEntry[]>([]);
  const [future, setFuture] = useState<EditHistoryEntry[]>([]);
  const [zoom, setZoom] = useState(1);
  const [format, setFormat] = useState<"png" | "jpg" | "webp">("png");
  const [isPreview, setIsPreview] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");
  const [inspectorWidth, setInspectorWidth] = useState(320);
  const [resolution, setResolution] = useState<"original" | number>("original");
  const previewRequestRef = useRef<number | null>(null);
  const latestPreviewStateRef = useRef<ImageEditState>(INITIAL_IMAGE_EDIT);
  const previewDimensionRef = useRef(1600);
  const lastPreviewSignatureRef = useRef("");
  const lastPreviewModeRef = useRef("");
  const lastPreviewSourceRef = useRef<HTMLImageElement | null>(null);
  const allPresets = useMemo(() => [...BUILT_IN_PRESETS, ...userPresets], [userPresets]);
  const matchingPresets = useMemo(() => {
    const query = presetSearch.trim().toLocaleLowerCase();
    return allPresets.filter((preset) => {
      const matchesCategory = presetGroup === "ALL" || preset.group === presetGroup;
      const matchesFavorite = !favoritesOnly || favorites.includes(preset.name);
      const matchesSearch = !query || `${preset.name} ${preset.group}`.toLocaleLowerCase().includes(query);
      return matchesCategory && matchesFavorite && matchesSearch;
    });
  }, [allPresets, favorites, favoritesOnly, presetGroup, presetSearch]);
  const recentPresetList = useMemo(
    () => recentPresets.map((name) => allPresets.find((preset) => preset.name === name)).filter((preset): preset is Preset => Boolean(preset)),
    [allPresets, recentPresets]
  );
  const activePreset = allPresets.find(({ name }) => name === edit.presetName);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    if (previewRequestRef.current !== null) {
      cancelAnimationFrame(previewRequestRef.current);
    }
  }, []);

  useEffect(() => {
    const savedWidth = Number(window.localStorage.getItem("redwell-image-inspector-width"));
    if (Number.isFinite(savedWidth) && savedWidth >= 280 && savedWidth <= 480) {
      setInspectorWidth(savedWidth);
    }
  }, []);

  useEffect(() => {
    try {
      const savedFavorites = readStoredStringArray("redwell-image-presets-favorites");
      const savedRecents = readStoredStringArray("redwell-image-presets-recents");
      const savedPresets = readStoredPresets();
      setFavorites(savedFavorites);
      setRecentPresets(savedRecents);
      setUserPresets(savedPresets);
    } catch (loadError) {
      console.error("Could not load saved Redwell presets:", loadError);
      setError("Saved presets could not be loaded. Your current editing session is still available.");
    } finally {
      setPresetDataLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!presetDataLoaded) return;
    window.localStorage.setItem("redwell-image-presets-favorites", JSON.stringify(favorites));
    window.localStorage.setItem("redwell-image-presets-recents", JSON.stringify(recentPresets.slice(0, 10)));
    window.localStorage.setItem("redwell-image-presets-custom", JSON.stringify(userPresets));
  }, [favorites, presetDataLoaded, recentPresets, userPresets]);

  useEffect(() => {
    if (!source) {
      setImage(null);
      return;
    }

    let isCurrent = true;
    const loadedImage = new Image();
    loadedImage.onload = () => {
      if (!isCurrent) return;
      setImage(loadedImage);
      setError("");
    };
    loadedImage.onerror = () => {
      if (!isCurrent) return;
      setImage(null);
      setError("This image could not be opened. Choose a different photo.");
    };
    loadedImage.src = source.url;
    return () => {
      isCurrent = false;
    };
  }, [source]);

  const renderPreview = useCallback((state: ImageEditState) => {
    if (!image || !canvasRef.current) return;
    try {
      const previewSource = image;
      const previewState = isComparing ? INITIAL_IMAGE_EDIT : state;
      const dimension = previewDimensionRef.current;
      const cropSource = (tool === "crop" && !isPreview && !isComparing) || (isComparing && tool === "crop");
      const cacheKey = [
        getImageSourceId(previewSource),
        getRenderSignature(previewState),
        dimension,
        cropSource,
      ].join(":");
      const cachedBitmap = takePreviewBitmap(cacheKey);
      if (cachedBitmap) {
        const target = canvasRef.current;
        if (target.width !== cachedBitmap.width) target.width = cachedBitmap.width;
        if (target.height !== cachedBitmap.height) target.height = cachedBitmap.height;
        const context = target.getContext("2d");
        if (!context) throw new Error("This browser could not create an image preview.");
        context.clearRect(0, 0, target.width, target.height);
        context.drawImage(cachedBitmap, 0, 0);
        return;
      }
      renderEditedImage(canvasRef.current, previewSource, previewState, {
        cropSource,
        preview: true,
        previewDimension: dimension,
      });
      if (dimension >= 1600 && typeof createImageBitmap === "function") {
        void createImageBitmap(canvasRef.current)
          .then((bitmap) => storePreviewBitmap(cacheKey, bitmap))
          .catch((cacheError: unknown) => {
            console.error("Could not cache image preview:", cacheError);
          });
      }
    } catch (renderError) {
      setError(renderError instanceof Error ? renderError.message : "The image preview could not be rendered.");
    }
  }, [image, isComparing, isPreview, tool]);

  const schedulePreviewRender = useCallback((state: ImageEditState) => {
    latestPreviewStateRef.current = state;
    if (previewRequestRef.current !== null) return;

    previewRequestRef.current = requestAnimationFrame(() => {
      previewRequestRef.current = null;
      renderPreview(latestPreviewStateRef.current);
    });
  }, [renderPreview]);

  useEffect(() => {
    if (!image) return;
    const previewSource = image;
    const signature = getRenderSignature(edit);
    const cropSource = tool === "crop" && (!isPreview || isComparing);
    const mode = `${isPreview}:${isComparing}:${cropSource}:${previewDimensionRef.current}`;
    if (
      signature === lastPreviewSignatureRef.current &&
      mode === lastPreviewModeRef.current &&
      previewSource === lastPreviewSourceRef.current
    ) return;
    lastPreviewSignatureRef.current = signature;
    lastPreviewModeRef.current = mode;
    lastPreviewSourceRef.current = previewSource;
    schedulePreviewRender(edit);
  }, [edit, image, isComparing, isPreview, schedulePreviewRender, tool]);

  const commitEdit = useCallback((
    update: (current: ImageEditState) => ImageEditState,
    track = true,
    label = "Edited image"
  ) => {
    const current = editRef.current;
    const next = update(current);
    if (next === current) return;
    if (track) {
      setPast((previous) => [...previous.slice(-39), { state: current, label }]);
      setFuture([]);
    }
    editRef.current = next;
    setEdit(next);
    setError("");
  }, []);

  const resetEditor = () => {
    commitEdit(() => INITIAL_IMAGE_EDIT);
    setPast([]);
    setFuture([]);
    setAspect("original");
    setZoom(1);
    setResolution("original");
  };

  const resetAdjustments = () => {
    commitEdit((current) => ({
      ...current,
      filters: INITIAL_IMAGE_EDIT.filters,
      highlights: 0,
      shadows: 0,
      sharpness: 0,
      vibrance: 0,
      whites: 0,
      blacks: 0,
      clarity: 0,
      texture: 0,
      dehaze: 0,
      colorGrade: INITIAL_IMAGE_EDIT.colorGrade,
      manualAdjustments: {},
      presetName: "Original",
      presetAmount: 100,
      effects: current.effects.filter(({ source }) => source === "manual"),
    }), true, "Reset adjustments");
  };

  const undo = () => {
    const previous = past[past.length - 1];
    if (!previous) return;
    const current = editRef.current;
    setPast((items) => items.slice(0, -1));
    setFuture((items) => [{ state: current, label: previous.label }, ...items]);
    editRef.current = previous.state;
    setEdit(previous.state);
  };

  const redo = () => {
    const next = future[0];
    if (!next) return;
    const current = editRef.current;
    setFuture((items) => items.slice(1));
    setPast((items) => [...items, { state: current, label: next.label }]);
    editRef.current = next.state;
    setEdit(next.state);
  };

  const openUpload = () => uploadRef.current?.click();

  const selectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose a supported image file to begin editing.");
      return;
    }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setSource({ url, name: file.name });
    setImage(null);
    editRef.current = INITIAL_IMAGE_EDIT;
    setEdit(INITIAL_IMAGE_EDIT);
    setPast([]);
    setFuture([]);
    setAspect("original");
    setZoom(1);
    setTool("presets");
    setPresetGroup("ALL");
    setActiveEffectId(null);
    setIsComparing(false);
    setResolution("original");
    setError("");
  };

  const beginSliderEdit = (label = "Adjusted image") => {
    const current = editRef.current;
    setPast((previous) => [...previous.slice(-39), { state: current, label }]);
    setFuture([]);
    previewDimensionRef.current = 1100;
  };

  const finishSliderEdit = () => {
    previewDimensionRef.current = 1600;
    schedulePreviewRender(editRef.current);
  };

  const updateAdjustment = (key: AdjustmentKey, value: number) => {
    commitEdit((current) => {
      return withManualAdjustment(current, key, value);
    }, false, `Adjusted ${key}`);
  };

  const applyPreset = (preset: Preset) => {
    const base = createPresetState(edit, preset, 100);
    commitEdit((current) => ({
      ...base,
      crop: current.crop,
      rotation: current.rotation,
      flipX: current.flipX,
      flipY: current.flipY,
    }), true, `Applied ${preset.name} preset`);
    setRecentPresets((current) => [preset.name, ...current.filter((name) => name !== preset.name)].slice(0, 10));
  };

  const updatePresetAmount = (amount: number) => {
    const preset = allPresets.find(({ name }) => name === editRef.current.presetName);
    if (!preset || preset.name === "Original") return;
    commitEdit((current) => createPresetState(current, preset, amount), false);
  };

  const togglePresetFavorite = (name: string) => {
    setFavorites((current) => current.includes(name)
      ? current.filter((favorite) => favorite !== name)
      : [...current, name]);
  };

  const deleteUserPreset = (preset: Preset) => {
    setUserPresets((current) => current.filter(({ name }) => name !== preset.name));
    setFavorites((current) => current.filter((name) => name !== preset.name));
    setRecentPresets((current) => current.filter((name) => name !== preset.name));
    if (editRef.current.presetName === preset.name) applyPreset(BUILT_IN_PRESETS[0]);
  };

  const saveCurrentPreset = () => {
    const suggestedName = edit.presetName === "Original" ? "" : `${edit.presetName} Copy`;
    const name = window.prompt("Name this Redwell preset", suggestedName)?.trim();
    if (!name) return;
    if (allPresets.some((preset) => preset.name.toLowerCase() === name.toLowerCase())) {
      setError("A preset with that name already exists.");
      return;
    }
    const preset: Preset = {
      name,
      group: "Yours",
      id: "original",
      filters: { ...edit.filters },
      adjustments: {
        highlights: edit.highlights,
        shadows: edit.shadows,
        sharpness: edit.sharpness,
        vibrance: edit.vibrance,
        whites: edit.whites,
        blacks: edit.blacks,
        clarity: edit.clarity,
        texture: edit.texture,
        dehaze: edit.dehaze,
      },
      effects: edit.effects.filter(({ visible }) => visible).map(({ effect }) => effect),
      userCreated: true,
    };
    setUserPresets((current) => [...current, preset]);
    setPresetGroup("Yours");
    setError("");
  };

  const importPresets = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const value: unknown = JSON.parse(await file.text());
      const imported = parseImportedPreset(value);
      if (!imported) {
        setError("Unsupported preset file. Import a Redwell JSON preset (schema redwell-preset, version 1). Lightroom XMP and Snapseed files are not supported.");
        return;
      }
      if (allPresets.some(({ name }) => name.toLowerCase() === imported.name.toLowerCase())) {
        setError(`A preset named “${imported.name}” already exists.`);
        return;
      }
      setUserPresets((current) => [...current, imported]);
      setPresetGroup("Yours");
      setError("");
    } catch (importError) {
      console.error("Could not import preset file:", importError);
      setError("The preset file could not be read. Check that it is valid JSON and try again.");
    }
  };

  const applyWorkingChanges = () => {
    const currentEdit = editRef.current;
    if (!image || !hasRenderableEdits(currentEdit)) return;
    previewDimensionRef.current = 1600;
    schedulePreviewRender(currentEdit);
  };

  const applyAspect = (nextAspect: AspectId) => {
    setAspect(nextAspect);
    setResolution("original");
    if (nextAspect === "original") {
      commitEdit((current) => ({ ...current, crop: { x: 0, y: 0, width: 1, height: 1 } }), true, "Reset crop");
      return;
    }
    if (!image) {
      return;
    }
    const requested = ASPECTS.find((entry) => entry.id === nextAspect)?.ratio ?? 1;
    const cropRatio = edit.rotation === 90 || edit.rotation === 270 ? 1 / requested : requested;
    const workingSource = image;
    const fullRatio = getImageWidth(workingSource) / getImageHeight(workingSource);
    let width = 1;
    let height = 1;
    if (fullRatio > cropRatio) width = cropRatio / fullRatio;
    else height = fullRatio / cropRatio;
    commitEdit((current) => ({
      ...current,
      crop: { x: (1 - width) / 2, y: (1 - height) / 2, width, height },
    }), true, `Cropped to ${nextAspect}`);
  };

  const cropPoint = (event: React.PointerEvent<HTMLElement>) => {
    const frame = canvasFrameRef.current;
    if (!frame) return null;
    const bounds = frame.getBoundingClientRect();
    let x = (event.clientX - bounds.left) / bounds.width;
    let y = (event.clientY - bounds.top) / bounds.height;
    const workingSource = image;
    if (!workingSource) return null;
    if (edit.rotation === 90) [x, y] = [y, 1 - x];
    else if (edit.rotation === 180) [x, y] = [1 - x, 1 - y];
    else if (edit.rotation === 270) [x, y] = [1 - y, x];
    if (edit.flipX) x = 1 - x;
    if (edit.flipY) y = 1 - y;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  };

  const startCropDrag = (event: React.PointerEvent<HTMLElement>, kind: "move" | "resize") => {
    if (tool !== "crop" || !image) return;
    const point = cropPoint(event);
    if (!point) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, kind, ...point, crop: edit.crop };
    beginSliderEdit();
  };

  const moveCrop = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    const point = cropPoint(event);
    if (!drag || !point || !image || drag.pointerId !== event.pointerId) return;
    const dx = point.x - drag.x;
    const dy = point.y - drag.y;
    if (drag.kind === "move") {
      commitEdit((current) => ({
        ...current,
        crop: {
          ...drag.crop,
          x: Math.max(0, Math.min(1 - drag.crop.width, drag.crop.x + dx)),
          y: Math.max(0, Math.min(1 - drag.crop.height, drag.crop.y + dy)),
        },
      }), false);
      return;
    }
    const sourceWidth = image ? getImageWidth(image) : 1;
    const sourceHeight = image ? getImageHeight(image) : 1;
    const ratio = (drag.crop.width * sourceWidth) / (drag.crop.height * sourceHeight);
    const widthDelta = Math.abs(dx) > Math.abs(dy * sourceWidth / sourceHeight / ratio)
      ? dx
      : dy * sourceWidth / sourceHeight / ratio;
    let width = Math.max(0.08, Math.min(1 - drag.crop.x, drag.crop.width + widthDelta));
    let height = width * sourceWidth / sourceHeight / ratio;
    if (height > 1 - drag.crop.y) {
      height = 1 - drag.crop.y;
      width = height * sourceHeight / sourceWidth * ratio;
    }
    commitEdit((current) => ({
      ...current,
      crop: { ...drag.crop, width, height },
    }), false);
  };

  const renameEffectLayer = (layerId: string, name: string) => {
    const normalizedName = name.trim();
    const activeLayer = editRef.current.effects.find((layer) => layer.id === layerId);
    if (!normalizedName || !activeLayer || activeLayer.locked || activeLayer.name === normalizedName) return;
    commitEdit((current) => ({
      ...current,
      effects: current.effects.map((layer) =>
        layer.id === layerId && !layer.locked ? { ...layer, name: normalizedName } : layer
      ),
    }), true, "Renamed layer");
  };

  const finishCropDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setResolution("original");
      previewDimensionRef.current = 1600;
      schedulePreviewRender(editRef.current);
    }
  };

  const exportImage = async () => {
    if (!image || isExporting) return;
    setIsExporting(true);
    setError("");
    try {
      const blob = await renderExportCanvas(image, edit, format, 0.92, resolution === "original" ? undefined : resolution);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${source?.name.replace(/\.[^.]+$/, "") || "redwell-edit"}.${format}`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "The edited image could not be exported.");
    } finally {
      setIsExporting(false);
    }
  };

  const runEnhancement = (kind: "auto" | "sharpen" | "clarity" | "detail" | "hdr") => {
    commitEdit((current) => {
      if (kind === "auto") {
        return {
          ...current,
          filters: { ...current.filters, brightness: 104, contrast: 108, saturation: 106 },
          highlights: -8,
          shadows: 14,
          sharpness: 10,
          manualAdjustments: {
            ...current.manualAdjustments,
            brightness: 104,
            contrast: 108,
            saturation: 106,
            highlights: -8,
            shadows: 14,
            sharpness: 10,
          },
        };
      }
      if (kind === "clarity") {
        const clarity = Math.min(60, current.clarity + 12);
        return {
          ...current,
          clarity,
          manualAdjustments: { ...current.manualAdjustments, clarity },
        };
      }
      if (kind === "detail") {
        const texture = Math.min(60, current.texture + 18);
        return { ...current, texture, manualAdjustments: { ...current.manualAdjustments, texture } };
      }
      if (kind === "hdr") {
        const existing = current.effects.find((effect) => effect.effect === "dramatic");
        if (existing) return current;
        const effect = createEffectLayer(EFFECTS.find(({ id }) => id === "dramatic")!, "manual");
        effect.name = "HDR-style";
        effect.parameters.intensity = 42;
        return { ...current, effects: [...current.effects, effect] };
      }
      const sharpness = Math.min(100, current.sharpness + 28);
      return { ...current, sharpness, manualAdjustments: { ...current.manualAdjustments, sharpness } };
    }, true, kind === "auto" ? "Auto enhanced image" : `Applied ${kind} enhancement`);
  };

  const rotate = (turn: -90 | 90) => {
    commitEdit((current) => ({
      ...current,
      rotation: (((current.rotation + turn + 360) % 360) as ImageEditState["rotation"]),
    }), true, turn < 0 ? "Rotated image left" : "Rotated image right");
  };

  const addEffect = (definition: EffectDefinition) => {
    const existing = edit.effects.find((layer) => layer.effect === definition.id);
    if (existing) {
      setActiveEffectId(existing.id);
      return;
    }
    const layer = createEffectLayer(definition, "manual");
    setActiveEffectId(layer.id);
    commitEdit((current) => ({ ...current, effects: [...current.effects, layer] }), true, `Added ${definition.name} effect`);
  };

  const duplicateEffect = (layerId: string) => {
    const layer = editRef.current.effects.find((entry) => entry.id === layerId);
    if (!layer) return;
    const duplicate = { ...layer, id: crypto.randomUUID(), name: `${layer.name} copy`, locked: false, parameters: { ...layer.parameters } };
    commitEdit((current) => {
      const index = current.effects.findIndex((entry) => entry.id === layerId);
      if (index < 0) return current;
      const effects = [...current.effects];
      effects.splice(index + 1, 0, duplicate);
      return { ...current, effects };
    }, true, `Duplicated ${layer.name}`);
    setActiveEffectId(duplicate.id);
  };

  const updateEffectParameter = (layerId: string, key: EffectParameter, value: number) => {
    commitEdit((current) => ({
      ...current,
      effects: current.effects.map((layer) =>
        layer.id === layerId && !layer.locked
          ? { ...layer, source: "manual", parameters: { ...layer.parameters, [key]: value } }
          : layer
      ),
    }), false);
  };

  const updateEffectOpacity = (layerId: string, opacity: number) => {
    commitEdit((current) => ({
      ...current,
      effects: current.effects.map((layer) =>
        layer.id === layerId && !layer.locked ? { ...layer, opacity } : layer
      ),
    }), false);
  };

  const moveEffect = (layerId: string, direction: -1 | 1) => {
    commitEdit((current) => {
      const index = current.effects.findIndex((layer) => layer.id === layerId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.effects.length) return current;
      const effects = [...current.effects];
      [effects[index], effects[target]] = [effects[target], effects[index]];
      effects[index] = { ...effects[index], source: "manual" };
      effects[target] = { ...effects[target], source: "manual" };
      return { ...current, effects };
    }, true, "Reordered effects");
  };

  const toggleEffect = (layerId: string, property: "visible" | "locked") => {
    const layer = edit.effects.find((entry) => entry.id === layerId);
    if (!layer || (property === "visible" && layer.locked)) return;
    commitEdit((current) => ({
      ...current,
      effects: current.effects.map((entry) =>
        entry.id === layerId ? { ...entry, source: "manual", [property]: !entry[property] } : entry
      ),
    }), true, property === "visible"
      ? `${layer.visible ? "Hid" : "Showed"} ${layer.name}`
      : `${layer.locked ? "Unlocked" : "Locked"} ${layer.name}`);
  };

  const removeEffect = (layerId: string) => {
    const layer = edit.effects.find((entry) => entry.id === layerId);
    if (!layer || layer.locked) return;
    commitEdit((current) => ({
      ...current,
      effects: current.effects.filter((entry) => entry.id !== layerId),
    }), true, `Removed ${layer.name}`);
    if (activeEffectId === layerId) setActiveEffectId(null);
  };

  const changeColorGrade = (
    range: "shadows" | "midtones" | "highlights",
    key: "hue" | "saturation",
    value: number
  ) => {
    commitEdit((current) => ({
      ...current,
      colorGrade: { ...current.colorGrade, [range]: { ...current.colorGrade[range], [key]: value } },
    }), false);
  };

  const changeColorBalance = (value: number) => {
    commitEdit((current) => ({
      ...current,
      colorGrade: { ...current.colorGrade, balance: value },
    }), false);
  };

  const startInspectorResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    inspectorPointerRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      width: inspectorWidth,
    };
  };

  const resizeInspector = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = inspectorPointerRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const maximum = Math.max(280, Math.min(480, window.innerWidth * 0.42, window.innerWidth - 320));
    setInspectorWidth(Math.round(Math.max(280, Math.min(maximum, drag.width + drag.startX - event.clientX))));
  };

  const finishInspectorResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (inspectorPointerRef.current?.pointerId !== event.pointerId) return;
    const drag = inspectorPointerRef.current;
    if (drag) {
      const maximum = Math.max(280, Math.min(480, window.innerWidth * 0.42, window.innerWidth - 320));
      const width = Math.round(Math.max(280, Math.min(maximum, drag.width + drag.startX - event.clientX)));
      setInspectorWidth(width);
      window.localStorage.setItem("redwell-image-inspector-width", String(width));
    }
    inspectorPointerRef.current = null;
  };

  const resolutionOptions = image ? getResolutionOptions(image, edit) : [];
  const hasPendingChanges = hasRenderableEdits(edit);

  return (
    <main className="flex h-[100dvh] min-h-[560px] flex-col overflow-hidden bg-[#f7f6f2] text-[#111]">
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        onChange={selectImage}
        className="sr-only"
        aria-label="Choose an image to edit"
      />

      {isPreview ? (
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#222321] p-6">
          {image && (
            <canvas
              ref={canvasRef}
              aria-label="Edited image preview"
              className="max-h-full max-w-full object-contain"
            />
          )}
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            className="absolute right-5 top-5 border border-white/25 bg-[#222321] px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-white hover:text-black"
          >
            Return to edit
          </button>
          {image && <CompareButton onDown={() => setIsComparing(true)} onUp={() => setIsComparing(false)} />}
        </div>
      ) : (
        <>
          <header className="z-10 flex min-h-[64px] flex-wrap items-center justify-between gap-3 border-b border-black/10 bg-[#f7f6f2] px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/"
                aria-label="Back to Redwell Studio"
                className="flex h-9 w-9 shrink-0 items-center justify-center border border-black/15 text-[20px] transition hover:border-black/50"
              >
                ←
              </Link>
              <Link href="/" className="hidden min-w-[130px] sm:block">
                <span className="block text-[14px] font-bold tracking-[-0.03em]">Redwell Studio</span>
                <span className="block text-[8px] font-semibold uppercase tracking-[0.2em] text-black/45">Image editor</span>
              </Link>
              <span aria-hidden="true" className="hidden h-7 w-px bg-black/15 sm:block" />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium">{source?.name ?? "New image"}</p>
                <p className="text-[9px] uppercase tracking-[0.14em] text-black/40">
                  {image ? `${image.naturalWidth} × ${image.naturalHeight}` : "Ready when you are"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {image && (
                <>
                  <HeaderButton label="Replace image" onClick={openUpload}>Replace</HeaderButton>
                  <CompareButton
                    onDown={() => setIsComparing(true)}
                    onUp={() => setIsComparing(false)}
                    className="h-9 border border-black/15 px-2 text-[10px] font-semibold transition hover:border-black/40"
                  />
                  <HeaderButton label={past.length ? `Undo ${past[past.length - 1].label}` : "Undo"} disabled={!past.length} onClick={undo}>↶</HeaderButton>
                  <HeaderButton label={future.length ? `Redo ${future[0].label}` : "Redo"} disabled={!future.length} onClick={redo}>↷</HeaderButton>
                  <HeaderButton
                    label="Apply current edits at full preview quality"
                    disabled={!hasPendingChanges}
                    onClick={applyWorkingChanges}
                  >
                    Apply
                  </HeaderButton>
                  <HeaderButton label="Reset" onClick={resetEditor}>Reset</HeaderButton>
                  <span aria-hidden="true" className="mx-1 h-6 w-px bg-black/15" />
                  <HeaderButton label="Preview" onClick={() => setIsPreview(true)}>Preview</HeaderButton>
                  <select
                    value={resolution}
                    onChange={(event) => setResolution(event.target.value === "original" ? "original" : Number(event.target.value))}
                    aria-label="Export resolution"
                    className="h-9 max-w-[124px] border border-black/15 bg-transparent px-2 text-[10px] font-semibold focus:outline-none focus:ring-1 focus:ring-redwell-600"
                  >
                    <option value="original">Original</option>
                    {resolutionOptions.map((option) => (
                      <option key={option.dimension} value={option.dimension}>{option.label}</option>
                    ))}
                  </select>
                  <select
                    value={format}
                    onChange={(event) => setFormat(event.target.value as "png" | "jpg" | "webp")}
                    aria-label="Export format"
                    className="h-9 border border-black/15 bg-transparent px-2 text-[10px] font-semibold focus:outline-none focus:ring-1 focus:ring-redwell-600"
                  >
                    <option value="png">PNG</option>
                    <option value="jpg">JPG</option>
                    <option value="webp">WebP</option>
                  </select>
                  <button
                    type="button"
                    onClick={exportImage}
                    disabled={isExporting}
                    className="h-9 bg-redwell-600 px-3 text-[11px] font-semibold text-white transition hover:bg-redwell-700 disabled:opacity-50"
                  >
                    {isExporting ? "Saving…" : "Export"}
                  </button>
                </>
              )}
            </div>
          </header>

          <div
            className="flex min-h-0 flex-1 flex-col md:grid md:grid-rows-[minmax(0,1fr)]"
            style={image ? { gridTemplateColumns: `minmax(0, 1fr) 6px ${inspectorWidth}px` } : undefined}
          >
            <section
              aria-label="Image workspace"
              className="relative flex min-h-[340px] flex-1 items-center justify-center overflow-hidden bg-[#e7e5df] p-5 sm:p-8 md:min-h-0"
            >
              {!image ? (
                <div className="flex max-w-sm flex-col items-center text-center">
                  <div className="mb-7 flex h-20 w-20 items-center justify-center border border-black/20">
                    <div className="relative h-10 w-12 border border-black/50">
                      <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-redwell-600" />
                      <span className="absolute bottom-1 left-1 right-1 h-px rotate-[-25deg] bg-black/50" />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-redwell-600">A fresh start</p>
                  <h1 className="mt-3 text-[clamp(36px,5vw,58px)] font-semibold leading-[0.9] tracking-[-0.07em]">
                    Edit your photo.
                  </h1>
                  <p className="mt-4 text-[13px] leading-6 text-black/55">
                    Upload an image to start editing.
                  </p>
                  <button
                    type="button"
                    onClick={openUpload}
                    className="mt-7 bg-redwell-600 px-6 py-3 text-[12px] font-semibold text-white transition hover:bg-redwell-700"
                  >
                    Upload photo
                  </button>
                  <p className="mt-4 text-[10px] text-black/35">JPG, PNG, WebP and other browser-supported images</p>
                </div>
              ) : (
                <>
                  <div className="flex max-h-full max-w-full items-center justify-center">
                    <div
                      ref={canvasFrameRef}
                      className={`relative inline-flex max-h-full max-w-full origin-center items-center justify-center shadow-[0_18px_55px_rgba(0,0,0,0.18)] ${
                        tool === "crop" ? "cursor-crosshair touch-none" : ""
                      }`}
                      style={{
                        transform: tool === "crop"
                          ? `scale(${zoom}) rotate(${edit.rotation}deg) scale(${edit.flipX ? -1 : 1}, ${edit.flipY ? -1 : 1})`
                          : `scale(${zoom})`,
                      }}
                      onPointerMove={moveCrop}
                      onPointerUp={finishCropDrag}
                      onPointerCancel={finishCropDrag}
                    >
                      <canvas
                        ref={canvasRef}
                        aria-label={tool === "crop" ? "Image crop area" : "Edited image"}
                        className="block max-h-[calc(100dvh-145px)] max-w-full object-contain"
                      />
                      {tool === "crop" && (
                        <>
                          <div className="pointer-events-none absolute inset-0 bg-black/35" />
                          <div
                            className="absolute border border-white shadow-[0_0_0_1px_rgba(0,0,0,0.45)]"
                            style={{
                              left: `${edit.crop.x * 100}%`,
                              top: `${edit.crop.y * 100}%`,
                              width: `${edit.crop.width * 100}%`,
                              height: `${edit.crop.height * 100}%`,
                            }}
                            onPointerDown={(event) => startCropDrag(event, "move")}
                          >
                            <span className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                              {Array.from({ length: 9 }, (_, index) => (
                                <span key={index} className="border border-white/25" />
                              ))}
                            </span>
                            <button
                              type="button"
                              aria-label="Resize crop area"
                              onPointerDown={(event) => {
                                event.stopPropagation();
                                startCropDrag(event, "resize");
                              }}
                              className="absolute -bottom-2 -right-2 h-4 w-4 border-2 border-white bg-redwell-600 shadow"
                            />
                          </div>
                          <p className="pointer-events-none absolute left-2 top-2 bg-black/55 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.16em] text-white">
                            Drag to reposition · corner to resize
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center border border-black/10 bg-[#f7f6f2]/95 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setZoom((value) => Math.max(0.5, Math.round((value - 0.1) * 10) / 10))}
                      aria-label="Zoom out"
                      className="h-8 w-9 text-[16px] hover:bg-black/5"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom(1)}
                      className="min-w-14 px-2 text-[10px] font-medium tabular-nums hover:bg-black/5"
                    >
                      {zoom === 1 ? "Fit" : `${Math.round(zoom * 100)}%`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom((value) => Math.min(2.5, Math.round((value + 0.1) * 10) / 10))}
                      aria-label="Zoom in"
                      className="h-8 w-9 text-[16px] hover:bg-black/5"
                    >
                      +
                    </button>
                  </div>
                </>
              )}
              {error && (
                <p role="alert" className="absolute bottom-14 left-1/2 max-w-[90%] -translate-x-1/2 border border-red-800/20 bg-[#fff9f7] px-4 py-2 text-center text-[11px] text-red-800">
                  {error}
                </p>
              )}
            </section>

            {image && (
              <>
              <div
                role="separator"
                aria-label="Resize editing inspector"
                aria-orientation="vertical"
                aria-valuemin={280}
                aria-valuemax={480}
                aria-valuenow={inspectorWidth}
                tabIndex={0}
                onPointerDown={startInspectorResize}
                onPointerMove={resizeInspector}
                onPointerUp={finishInspectorResize}
                onPointerCancel={finishInspectorResize}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                  event.preventDefault();
                  const next = Math.max(280, Math.min(480, inspectorWidth + (event.key === "ArrowLeft" ? 16 : -16)));
                  setInspectorWidth(next);
                  window.localStorage.setItem("redwell-image-inspector-width", String(next));
                }}
                className="group relative hidden cursor-col-resize items-center justify-center bg-black/[0.025] outline-none transition-colors hover:bg-redwell-600/10 focus-visible:bg-redwell-600/10 md:flex"
              >
                <span aria-hidden="true" className="h-10 w-px bg-black/20 transition-colors group-hover:bg-redwell-600" />
              </div>
              <aside className="flex min-h-0 flex-col border-t border-black/10 bg-[#f7f6f2] md:border-l-0 md:border-t-0">
                <div className="grid grid-cols-7 border-b border-black/10">
                  {TOOLS.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      aria-pressed={tool === item.id}
                      onClick={() => setTool(item.id)}
                      className={`min-h-[58px] border-r border-black/10 px-1 py-2 text-center transition last:border-r-0 ${
                        tool === item.id ? "bg-white" : "text-black/50 hover:bg-white/60"
                      }`}
                    >
                      <span className={`block text-[8px] font-bold tracking-[0.12em] ${tool === item.id ? "text-redwell-600" : "text-black/35"}`}>
                        {item.number}
                      </span>
                      <span className={`mt-1 block text-[10px] font-semibold ${tool === item.id ? "text-black" : ""}`}>
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
                  <div className="mb-4 flex items-baseline justify-between gap-3">
                    <h2 className="text-[21px] font-semibold tracking-[-0.05em]">
                      {TOOLS.find((item) => item.id === tool)?.label}
                    </h2>
                    <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-black/35">
                      Image tools
                    </span>
                  </div>

                  {tool === "presets" && (
                    <>
                      <div className="mb-3 flex items-center gap-2">
                        <label className="flex min-w-0 flex-1 items-center border border-black/15 bg-white px-2">
                          <span aria-hidden="true" className="mr-1.5 text-[11px] text-black/35">⌕</span>
                          <input
                            type="search"
                            value={presetSearch}
                            onChange={(event) => setPresetSearch(event.target.value)}
                            placeholder="Search presets"
                            aria-label="Search presets"
                            className="h-8 min-w-0 flex-1 bg-transparent text-[10px] outline-none placeholder:text-black/35"
                          />
                        </label>
                        <button
                          type="button"
                          aria-pressed={favoritesOnly}
                          onClick={() => setFavoritesOnly((current) => !current)}
                          className={`h-8 shrink-0 border px-2 text-[9px] font-semibold transition ${favoritesOnly ? "border-redwell-600 bg-white text-redwell-600" : "border-black/15 text-black/55 hover:bg-white"}`}
                        >
                          ☆ Favorites
                        </button>
                      </div>
                      <div className="mb-3 flex gap-1 overflow-x-auto border-b border-black/10 pb-2">
                        {PRESET_CATEGORIES.map((group) => (
                          <button
                            type="button"
                            key={group}
                            aria-pressed={presetGroup === group}
                            onClick={() => setPresetGroup(group)}
                            className={`shrink-0 px-2 py-1 text-[9px] font-semibold transition ${presetGroup === group ? "bg-[#111] text-white" : "text-black/50 hover:bg-black/5"}`}
                          >
                            {group}
                          </button>
                        ))}
                      </div>
                      {recentPresetList.length > 0 && !presetSearch && !favoritesOnly && (
                        <div className="mb-3 flex gap-1 overflow-x-auto">
                          <span className="shrink-0 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-black/35">Recent</span>
                          {recentPresetList.slice(0, 4).map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => applyPreset(preset)}
                              className="shrink-0 border border-black/10 px-2 py-1 text-[8px] text-black/60 hover:bg-white"
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      )}
                      {presetGroup === "Yours" && (
                        <div className="mb-3">
                          <div className="flex gap-2">
                            <input
                              ref={presetUploadRef}
                              type="file"
                              accept=".json,application/json"
                              className="sr-only"
                              aria-label="Import Redwell preset JSON"
                              onChange={importPresets}
                            />
                            <button
                              type="button"
                              onClick={() => presetUploadRef.current?.click()}
                              className="border border-black/15 px-2.5 py-1.5 text-[9px] font-semibold hover:bg-white"
                            >
                              Import Presets
                            </button>
                            <button
                              type="button"
                              onClick={saveCurrentPreset}
                              className="border border-black/15 px-2.5 py-1.5 text-[9px] font-semibold hover:bg-white"
                            >
                              Save Current Look
                            </button>
                          </div>
                          <p className="mt-1.5 text-[8px] leading-relaxed text-black/40">
                            Import Redwell JSON presets (schema redwell-preset, version 1). Your saved looks stay in this browser.
                          </p>
                        </div>
                      )}
                      {activePreset && activePreset.name !== "Original" && (
                        <div className="mb-4 border-y border-black/10 py-3">
                          <div className="mb-2 flex items-baseline justify-between text-[10px]">
                            <span className="font-semibold">{edit.presetName}</span>
                            <span className="tabular-nums text-black/45">Amount {edit.presetAmount}</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={edit.presetAmount}
                            aria-label="Preset amount"
                            onPointerDown={() => beginSliderEdit("Adjusted preset amount")}
                            onPointerUp={finishSliderEdit}
                            onPointerCancel={finishSliderEdit}
                            onKeyDown={(event) => {
                              if (["ArrowLeft", "ArrowRight", "Home", "End", "PageDown", "PageUp"].includes(event.key)) {
                                beginSliderEdit("Adjusted preset amount");
                              }
                            }}
                            onKeyUp={(event) => {
                              if (["ArrowLeft", "ArrowRight", "Home", "End", "PageDown", "PageUp"].includes(event.key)) {
                                finishSliderEdit();
                              }
                            }}
                            onChange={(event) => updatePresetAmount(Number(event.target.value))}
                            className="h-1.5 w-full cursor-pointer accent-redwell-600"
                          />
                        </div>
                      )}
                      <div className="mb-2 flex items-center justify-between text-[8px] uppercase tracking-[0.12em] text-black/35">
                        <span>{matchingPresets.length} looks</span>
                        {favoritesOnly && <span>Favorites</span>}
                      </div>
                      {matchingPresets.length ? (
                      <div className="grid grid-cols-3 gap-x-2.5 gap-y-3">
                        {matchingPresets.map((preset) => {
                          const previewState = PRESET_THUMBNAIL_STATES.get(preset.name) ?? getPresetThumbnailState(preset);
                          return (
                            <div
                              key={preset.name}
                              className="group relative min-w-0 text-left"
                            >
                              <button
                                type="button"
                                aria-pressed={edit.presetName === preset.name}
                                onClick={() => applyPreset(preset)}
                                className="block w-full min-w-0 text-left"
                              >
                                <span className="relative block aspect-[4/3] overflow-hidden bg-[#d5d0c6]">
                                  <MemoizedImagePreviewThumbnail image={image} state={previewState} cacheKey={`${source?.url}:${preset.name}`} />
                                  <span className={`absolute inset-0 border-2 transition ${edit.presetName === preset.name ? "border-redwell-600" : "border-transparent group-hover:border-white/80"}`} />
                                </span>
                                <span className={`mt-1.5 block truncate pr-3 text-[9px] ${edit.presetName === preset.name ? "font-semibold" : "text-black/60"}`}>
                                  {preset.name}
                                </span>
                              </button>
                              <button
                                type="button"
                                aria-label={`${favorites.includes(preset.name) ? "Remove" : "Add"} ${preset.name} ${favorites.includes(preset.name) ? "from" : "to"} favorites`}
                                aria-pressed={favorites.includes(preset.name)}
                                onClick={() => togglePresetFavorite(preset.name)}
                                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-[#f7f6f2]/90 text-[11px] text-black/55 hover:text-redwell-600"
                              >
                                {favorites.includes(preset.name) ? "★" : "☆"}
                              </button>
                              {preset.userCreated && presetGroup === "Yours" && (
                                <button
                                  type="button"
                                  onClick={() => deleteUserPreset(preset)}
                                  className="mt-1 text-[8px] font-semibold text-redwell-600"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      ) : (
                        <p className="border-y border-black/10 py-5 text-center text-[10px] text-black/45">
                          {presetGroup === "Yours" ? "Save a look or import a Redwell preset to start your library." : "No presets match this search."}
                        </p>
                      )}
                    </>
                  )}

                  {tool === "adjust" && (
                    <div className="space-y-2">
                      {ADJUSTMENT_GROUPS.map((group, index) => (
                        <details key={group.label} open={index === 0} className="group border-t border-black/10">
                          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-black/55 [&::-webkit-details-marker]:hidden">
                            {group.label}
                            <span aria-hidden="true" className="text-[14px] transition group-open:rotate-180">⌄</span>
                          </summary>
                          <div className="space-y-4 pb-4">
                            {group.controls.map((control) => {
                              const value = getAdjustmentValue(edit, control.key);
                              return (
                                <AdjustmentSlider
                                  key={control.key}
                                  label={control.label}
                                  min={control.min}
                                  max={control.max}
                                  value={value ?? control.initial}
                                  initial={control.initial}
                                  onStart={() => beginSliderEdit(`Adjusted ${control.label}`)}
                                  onFinish={finishSliderEdit}
                                  onChange={(next) => updateAdjustment(control.key, next)}
                                />
                              );
                            })}
                          </div>
                        </details>
                      ))}
                      <button
                        type="button"
                        onClick={resetAdjustments}
                        className="mt-3 text-[10px] font-semibold text-redwell-600 underline decoration-redwell-600/30 underline-offset-4 hover:text-redwell-700"
                      >
                        Reset adjustments
                      </button>
                    </div>
                  )}

                  {(tool === "effects" || tool === "layers") && (
                    <EffectsPanel
                      image={image}
                      state={edit}
                      activeLayerId={activeEffectId}
                      effects={EFFECTS}
                      onAdd={addEffect}
                      onDuplicate={duplicateEffect}
                      onSelect={setActiveEffectId}
                      onRename={(layerId, name) => renameEffectLayer(layerId, name)}
                      onOpacityChange={updateEffectOpacity}
                      onParameterChange={updateEffectParameter}
                      onToggle={toggleEffect}
                      onRemove={removeEffect}
                      onMove={moveEffect}
                      onBeginEdit={() => beginSliderEdit("Adjusted effect")}
                      onFinishEdit={finishSliderEdit}
                    />
                  )}

                  {tool === "enhance" && (
                    <div>
                      <p className="mb-5 text-[11px] leading-5 text-black/55">
                        Refine light and detail with browser-based image processing. No AI upscaling is applied.
                      </p>
                      <button
                        type="button"
                        onClick={() => runEnhancement("auto")}
                        className="mb-4 flex w-full items-center justify-between border border-black/15 bg-white px-3 py-3 text-left transition hover:border-redwell-600"
                      >
                        <span>
                          <span className="block text-[11px] font-semibold">Auto Enhance</span>
                          <span className="mt-1 block text-[9px] text-black/45">Balance exposure, color and detail</span>
                        </span>
                        <span className="text-lg text-redwell-600">↗</span>
                      </button>
                      <div className="divide-y divide-black/10 border-y border-black/10">
                        {[
                          { id: "sharpen", name: "Sharpen", detail: "Strengthen edge definition" },
                          { id: "clarity", name: "Clarity", detail: "Shape midtone contrast" },
                          { id: "detail", name: "Detail", detail: "Bring out fine texture" },
                          { id: "hdr", name: "HDR-style", detail: "Extend tonal separation" },
                        ].map((enhancement) => (
                          <button
                            type="button"
                            key={enhancement.id}
                            onClick={() => runEnhancement(enhancement.id as "sharpen" | "clarity" | "detail" | "hdr")}
                            className="flex w-full items-center justify-between py-3 text-left hover:text-redwell-600"
                          >
                            <span>
                              <span className="block text-[11px] font-semibold text-black">{enhancement.name}</span>
                              <span className="mt-0.5 block text-[9px] text-black/45">{enhancement.detail}</span>
                            </span>
                            <span aria-hidden="true" className="text-[16px]">+</span>
                          </button>
                        ))}
                      </div>
                      <div className="mt-5 border-t border-black/10 pt-4">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-black/45">Super Resolution</p>
                        <p className="mt-2 text-[10px] leading-4 text-black/50">
                          {imageProcessingProviders.superResolution
                            ? `Available through ${imageProcessingProviders.superResolution.id}.`
                            : "No super-resolution provider is configured. This editor does not claim AI upscaling."}
                        </p>
                        {!imageProcessingProviders.superResolution && (
                          <span className="mt-2 inline-block border border-black/10 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-black/35">
                            2× / 4× unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {tool === "crop" && (
                    <div>
                      <p className="mb-4 text-[10px] leading-4 text-black/50">
                        Drag the crop area over your photo or pull its corner to resize.
                      </p>
                      <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-black/40">
                        Aspect ratio
                      </p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {ASPECTS.map((ratio) => (
                          <button
                            type="button"
                            key={ratio.id}
                            aria-pressed={aspect === ratio.id}
                            onClick={() => applyAspect(ratio.id)}
                            className={`h-8 border text-[10px] font-medium transition ${
                              aspect === ratio.id ? "border-redwell-600 bg-white text-black" : "border-black/10 text-black/55 hover:border-black/30"
                            }`}
                          >
                            {ratio.id === "original" ? "Original" : ratio.id}
                          </button>
                        ))}
                      </div>
                      <div className="mt-6 space-y-2 border-t border-black/10 pt-4">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-black/40">Transform</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button type="button" onClick={() => rotate(-90)} className="h-9 border border-black/15 text-[10px] font-medium hover:bg-white">↶ Rotate left</button>
                          <button type="button" onClick={() => rotate(90)} className="h-9 border border-black/15 text-[10px] font-medium hover:bg-white">↷ Rotate right</button>
                          <button type="button" aria-pressed={edit.flipX} onClick={() => commitEdit((current) => ({ ...current, flipX: !current.flipX }), true, "Flipped image horizontally")} className={`h-9 border text-[10px] font-medium ${edit.flipX ? "border-redwell-600 bg-white" : "border-black/15 hover:bg-white"}`}>Flip horizontal</button>
                          <button type="button" aria-pressed={edit.flipY} onClick={() => commitEdit((current) => ({ ...current, flipY: !current.flipY }), true, "Flipped image vertically")} className={`h-9 border text-[10px] font-medium ${edit.flipY ? "border-redwell-600 bg-white" : "border-black/15 hover:bg-white"}`}>Flip vertical</button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTool("presets")}
                        className="mt-6 w-full bg-[#111] px-4 py-2.5 text-[11px] font-semibold text-white transition hover:bg-redwell-600"
                      >
                        Apply crop
                      </button>
                    </div>
                  )}

                  {tool === "adjust" && (
                    <ColorGradePanel
                      state={edit}
                      onChange={changeColorGrade}
                      onBalanceChange={changeColorBalance}
                      onBeginEdit={() => beginSliderEdit("Changed color grade")}
                      onFinishEdit={finishSliderEdit}
                    />
                  )}

                  {tool === "background" && (
                    <BackgroundPanel provider={imageProcessingProviders.backgroundRemoval} />
                  )}
                </div>
              </aside>
              </>
            )}
          </div>
        </>
      )}
    </main>
  );
}

function HeaderButton({
  label,
  children,
  disabled = false,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="h-9 min-w-8 px-2 text-[10px] font-semibold transition hover:bg-black/5 disabled:cursor-not-allowed disabled:text-black/25"
    >
      {children}
    </button>
  );
}

function AdjustmentSlider({
  label,
  min,
  max,
  value,
  initial,
  onStart,
  onFinish,
  onChange,
  disabled = false,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  initial: number;
  onStart: () => void;
  onFinish: () => void;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="block">
      <span className="mb-2 flex items-center justify-between text-[10px]">
        <span className="font-medium text-black/75">{label}</span>
        <span className="flex items-center gap-2 tabular-nums text-black/45">
          {value}
          {value !== initial && (
            <button
              type="button"
              aria-label={`Reset ${label}`}
              onClick={(event) => {
                event.preventDefault();
                onStart();
                onChange(initial);
                onFinish();
              }}
              className="text-[9px] font-semibold text-redwell-600"
            >
              Reset
            </button>
          )}
        </span>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        onPointerDown={onStart}
        onPointerUp={onFinish}
        onPointerCancel={onFinish}
        onKeyDown={(event) => {
          if (["ArrowLeft", "ArrowRight", "Home", "End", "PageDown", "PageUp"].includes(event.key)) onStart();
        }}
        onKeyUp={(event) => {
          if (["ArrowLeft", "ArrowRight", "Home", "End", "PageDown", "PageUp"].includes(event.key)) onFinish();
        }}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer accent-redwell-600 disabled:cursor-not-allowed disabled:opacity-40"
      />
      <span className="mt-1 flex justify-between text-[8px] tabular-nums text-black/30">
        <span>{min}</span>
        <span>{max}</span>
      </span>
    </div>
  );
}

const MemoizedImagePreviewThumbnail = memo(function ImagePreviewThumbnail({
  image,
  state,
  cacheKey,
}: {
  image: HTMLImageElement;
  state: ImageEditState;
  cacheKey: string;
}) {
  const [thumbnail, setThumbnail] = useState("");
  const containerRef = useRef<HTMLSpanElement>(null);
  const [isInView, setIsInView] = useState(false);
  const serializedState = JSON.stringify(state);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isInView || typeof IntersectionObserver === "undefined") {
      if (!container || isInView) return;
      setIsInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setIsInView(true);
      observer.disconnect();
    }, { rootMargin: "160px" });
    observer.observe(container);
    return () => observer.disconnect();
  }, [isInView]);

  useEffect(() => {
    if (!isInView) return;
    const key = `${cacheKey}:${serializedState}`;
    const cached = THUMBNAIL_CACHE.get(key);
    if (cached) {
      setThumbnail(cached);
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      renderEditedImage(canvas, image, state, { preview: true, previewDimension: 320 });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.76);
      THUMBNAIL_CACHE.set(key, dataUrl);
      if (THUMBNAIL_CACHE.size > 96) {
        const oldest = THUMBNAIL_CACHE.keys().next().value;
        if (oldest) THUMBNAIL_CACHE.delete(oldest);
      }
      setThumbnail(dataUrl);
    } catch (previewError) {
      console.error("Could not render image preview:", previewError);
      setThumbnail("");
    }
  }, [cacheKey, image, isInView, serializedState, state]);

  return (
    <span ref={containerRef} className={`block h-full w-full ${thumbnail ? "" : "bg-[#ddd9d1]"}`}>
      {thumbnail && <img src={thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.04]" />}
    </span>
  );
});

function EffectsPanel({
  image,
  state,
  activeLayerId,
  effects,
  onAdd,
  onDuplicate,
  onSelect,
  onRename,
  onOpacityChange,
  onParameterChange,
  onToggle,
  onRemove,
  onMove,
  onBeginEdit,
  onFinishEdit,
}: {
  image: HTMLImageElement;
  state: ImageEditState;
  activeLayerId: string | null;
  effects: EffectDefinition[];
  onAdd: (definition: EffectDefinition) => void;
  onDuplicate: (layerId: string) => void;
  onSelect: (layerId: string | null) => void;
  onRename: (layerId: string, name: string) => void;
  onOpacityChange: (layerId: string, opacity: number) => void;
  onParameterChange: (layerId: string, key: EffectParameter, value: number) => void;
  onToggle: (layerId: string, property: "visible" | "locked") => void;
  onRemove: (layerId: string) => void;
  onMove: (layerId: string, direction: -1 | 1) => void;
  onBeginEdit: () => void;
  onFinishEdit: () => void;
}) {
  const [category, setCategory] = useState("Light / Atmosphere");
  const [renamingLayerId, setRenamingLayerId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const activeLayer = state.effects.find((layer) => layer.id === activeLayerId);
  const activeDefinition = effects.find(({ id }) => id === activeLayer?.effect);
  const categories = Array.from(new Set(effects.map(({ category: value }) => value)));

  return (
    <div>
      <section aria-label="Layers" className="mb-5">
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-[9px] font-semibold uppercase tracking-[0.16em] text-black/45">Layers</h3>
          <span className="text-[9px] text-black/35">
            {state.effects.length + 1} {state.effects.length === 0 ? "layer" : "layers"}
          </span>
        </div>
        <div className="divide-y divide-black/10 border-y border-black/10">
          <button
            type="button"
            aria-pressed={activeLayerId === null}
            onClick={() => onSelect(null)}
            className={`flex w-full items-center justify-between py-2 px-1 text-left text-[10px] font-medium ${activeLayerId === null ? "bg-white" : ""}`}
          >
            <span>Original image</span>
            <span className="text-[8px] text-black/35">Source preserved</span>
          </button>
          {state.effects.length ? state.effects.map((layer, index) => (
              <div
                key={layer.id}
                className={`flex items-center gap-1.5 py-2 ${activeLayerId === layer.id ? "bg-white" : ""}`}
              >
                {renamingLayerId === layer.id ? (
                  <form
                    className="flex min-w-0 flex-1 gap-1"
                    onSubmit={(event) => {
                      event.preventDefault();
                      onRename(layer.id, renameValue);
                      setRenamingLayerId(null);
                    }}
                  >
                    <input
                      autoFocus
                      aria-label={`Rename ${layer.name}`}
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      className="min-w-0 w-full border border-black/15 bg-white px-1 text-[10px] outline-none focus:border-redwell-600"
                    />
                    <button type="submit" className="text-[9px] font-semibold text-redwell-600">Save</button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelect(layer.id)}
                    className="min-w-0 flex-1 truncate px-1 text-left text-[10px] font-medium"
                  >
                    {layer.name}
                    {layer.source === "preset" && <span className="ml-1 text-[8px] font-normal text-black/35">preset</span>}
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Rename ${layer.name}`}
                  disabled={layer.locked}
                  onClick={() => {
                    setRenameValue(layer.name);
                    setRenamingLayerId(layer.id);
                  }}
                  className="px-1 text-[9px] text-black/45 hover:text-black disabled:opacity-25"
                >
                  Rename
                </button>
                <button type="button" aria-label={`${layer.visible ? "Hide" : "Show"} ${layer.name}`} onClick={() => onToggle(layer.id, "visible")} className="px-1 text-[10px] text-black/45 hover:text-black">
                  {layer.visible ? "◉" : "○"}
                </button>
                <button type="button" aria-label={`${layer.locked ? "Unlock" : "Lock"} ${layer.name}`} onClick={() => onToggle(layer.id, "locked")} className="px-1 text-[9px] text-black/45 hover:text-black">
                  {layer.locked ? "Locked" : "Lock"}
                </button>
                <button type="button" aria-label={`Duplicate ${layer.name}`} onClick={() => onDuplicate(layer.id)} className="px-1 text-[9px] text-black/45 hover:text-black">
                  Copy
                </button>
                <button type="button" aria-label={`Move ${layer.name} up`} disabled={index === 0} onClick={() => onMove(layer.id, -1)} className="px-0.5 text-[12px] text-black/45 hover:text-black disabled:opacity-20">↑</button>
                <button type="button" aria-label={`Move ${layer.name} down`} disabled={index === state.effects.length - 1} onClick={() => onMove(layer.id, 1)} className="px-0.5 text-[12px] text-black/45 hover:text-black disabled:opacity-20">↓</button>
                <button type="button" aria-label={`Remove ${layer.name}`} disabled={layer.locked} onClick={() => onRemove(layer.id)} className="px-1 text-[13px] text-black/35 hover:text-redwell-600 disabled:opacity-25">×</button>
              </div>
            )) : <p className="py-2 text-[9px] text-black/40">No effect layers yet. Choose an effect below to add one.</p>}
        </div>

        {activeLayer && activeDefinition && (
          <div className="mt-3 space-y-4 border-b border-black/10 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold">{activeLayer.name}</p>
              <button
                type="button"
                disabled={activeLayer.locked}
                onClick={() => onRemove(activeLayer.id)}
                className="text-[9px] font-semibold text-redwell-600 disabled:opacity-30"
              >
                Remove
              </button>
            </div>
            <AdjustmentSlider
              label="Layer opacity"
              min={0}
              max={100}
              value={activeLayer.opacity ?? 100}
              initial={100}
              disabled={activeLayer.locked}
              onStart={onBeginEdit}
              onFinish={onFinishEdit}
              onChange={(value) => onOpacityChange(activeLayer.id, value)}
            />
            {activeDefinition.controls.map((control) => (
              <AdjustmentSlider
                key={control.key}
                label={control.label}
                min={control.min}
                max={control.max}
                value={activeLayer.parameters[control.key] ?? control.initial}
                initial={control.initial}
                disabled={activeLayer.locked}
                onStart={onBeginEdit}
                onFinish={onFinishEdit}
                onChange={(value) => onParameterChange(activeLayer.id, control.key, value)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="mb-3 flex gap-1 overflow-x-auto pb-1">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
            className={`shrink-0 px-2 py-1 text-[8px] font-semibold transition ${category === item ? "bg-[#111] text-white" : "text-black/50 hover:bg-black/5"}`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-x-2.5 gap-y-4">
        {effects.filter((effect) => effect.category === category).map((definition) => {
          const layer = state.effects.find((entry) => entry.effect === definition.id);
          const previewState = EFFECT_THUMBNAIL_STATES.get(definition.id) ?? INITIAL_IMAGE_EDIT;
          return (
            <button
              type="button"
              key={definition.id}
              aria-label={`${layer ? "Select" : "Add"} ${definition.name} layer`}
              aria-pressed={Boolean(layer)}
              onClick={() => {
                if (layer) onSelect(layer.id);
                else onAdd(definition);
              }}
              className="group min-w-0 text-left"
            >
              <span className="relative block aspect-[4/3] overflow-hidden bg-[#d5d0c6]">
                <MemoizedImagePreviewThumbnail image={image} state={previewState} cacheKey={`${image.src}:effect:${definition.id}`} />
                <span className={`absolute inset-0 border-2 transition ${layer ? "border-redwell-600" : "border-transparent group-hover:border-white/80"}`} />
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center bg-[#f7f6f2]/90 text-[10px] font-semibold text-black/65">
                  {layer ? "✓" : "+"}
                </span>
              </span>
              <span className="mt-1.5 block truncate text-[9px] font-medium">{definition.name}</span>
              <span className="mt-0.5 block truncate text-[8px] text-black/40">{definition.detail}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ColorGradePanel({
  state,
  onChange,
  onBalanceChange,
  onBeginEdit,
  onFinishEdit,
}: {
  state: ImageEditState;
  onChange: (range: "shadows" | "midtones" | "highlights", key: "hue" | "saturation", value: number) => void;
  onBalanceChange: (value: number) => void;
  onBeginEdit: () => void;
  onFinishEdit: () => void;
}) {
  return (
    <details className="group mt-5 border-t border-black/10">
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-black/55 [&::-webkit-details-marker]:hidden">
        Color grading
        <span aria-hidden="true" className="text-[14px] transition group-open:rotate-180">⌄</span>
      </summary>
      <div className="space-y-5 pb-4">
        {(["shadows", "midtones", "highlights"] as const).map((range) => {
          const grade = state.colorGrade[range];
          return (
            <div key={range} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold capitalize">{range}</span>
                <span
                  aria-hidden="true"
                  className="h-4 w-4 rounded-full border border-black/20"
                  style={{ backgroundColor: `hsl(${grade.hue} 75% 55%)`, opacity: grade.saturation === 0 ? 0.2 : 1 }}
                />
              </div>
              <AdjustmentSlider label={`${range} hue`} min={0} max={360} value={grade.hue} initial={range === "shadows" ? 220 : range === "midtones" ? 35 : 45} onStart={onBeginEdit} onFinish={onFinishEdit} onChange={(value) => onChange(range, "hue", value)} />
              <AdjustmentSlider label={`${range} saturation`} min={0} max={100} value={grade.saturation} initial={0} onStart={onBeginEdit} onFinish={onFinishEdit} onChange={(value) => onChange(range, "saturation", value)} />
            </div>
          );
        })}
        <AdjustmentSlider label="Color balance" min={-100} max={100} value={state.colorGrade.balance} initial={0} onStart={onBeginEdit} onFinish={onFinishEdit} onChange={onBalanceChange} />
      </div>
    </details>
  );
}

function BackgroundPanel({ provider }: { provider: (typeof imageProcessingProviders)["backgroundRemoval"] }) {
  return (
    <section aria-label="Background removal">
      <div className="mb-4 flex aspect-[4/3] flex-col items-center justify-center border border-dashed border-black/15 bg-[#f1eee7] text-center">
        <span aria-hidden="true" className="mb-3 flex h-10 w-10 items-center justify-center border border-black/20 text-[20px] text-black/40">◌</span>
        <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-black/45">No subject mask</span>
      </div>
      <h3 className="text-[13px] font-semibold tracking-[-0.03em]">Background removal</h3>
      <p className="mt-2 text-[10px] leading-5 text-black/50">
        {provider
          ? `A background-removal provider is registered (${provider.id}), but its preview and apply workflow is not yet connected.`
          : "No segmentation provider is configured. Redwell Studio will not simulate background removal or discard image pixels."}
      </p>
      {!provider && (
        <span className="mt-4 inline-block border border-black/10 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-black/35">
          Provider unavailable
        </span>
      )}
    </section>
  );
}

function CompareButton({
  onDown,
  onUp,
  className = "absolute bottom-4 left-4 border border-black/10 bg-[#f7f6f2]/95 px-3 py-2 text-[9px] font-semibold transition hover:border-black/40",
}: {
  onDown: () => void;
  onUp: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onUp}
      onBlur={onUp}
      onKeyDown={(event) => {
        if (event.key === " ") {
          event.preventDefault();
          onDown();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === " ") onUp();
      }}
      className={className}
    >
      Hold to compare
    </button>
  );
}

function createEffectLayer(definition: EffectDefinition, source: EffectLayer["source"], id?: string): EffectLayer {
  return {
    id: id ?? crypto.randomUUID(),
    effect: definition.id,
    name: definition.name,
    visible: true,
    locked: false,
    source,
    parameters: Object.fromEntries(definition.controls.map(({ key, initial }) => [key, initial])),
  };
}

function createPresetState(current: ImageEditState, preset: Preset, amount: number) {
  const strength = Math.max(0, Math.min(100, amount)) / 100;
  const targetFilters = { ...createPhotoFilterPreset(preset.id), ...preset.filters };
  let targetState: ImageEditState = {
    ...INITIAL_IMAGE_EDIT,
    filters: { ...INITIAL_IMAGE_EDIT.filters, ...targetFilters, preset: "original" },
  };
  for (const [key, value] of Object.entries(preset.adjustments ?? {}) as [AdjustmentKey, number][]) {
    targetState = setAdjustmentValue(targetState, key, value);
  }
  const filters = { ...INITIAL_IMAGE_EDIT.filters, preset: "original" as const };
  const filterKeys: (keyof PhotoFilters)[] = [
    "brightness", "contrast", "saturation", "exposure", "temperature", "tint", "blur", "grain", "vignette", "opacity",
  ];
  for (const key of filterKeys) {
    const from = INITIAL_IMAGE_EDIT.filters[key];
    const to = targetFilters[key] ?? from;
    if (typeof from === "number" && typeof to === "number") {
      Object.assign(filters, { [key]: interpolate(from, to, strength) });
    }
  }

  let state: ImageEditState = {
    ...current,
    filters,
    manualAdjustments: current.manualAdjustments,
    presetName: preset.name,
    presetAmount: preset.name === "Original" ? 100 : amount,
    effects: [
      ...current.effects.filter(({ source: origin }) => origin === "manual"),
      ...(preset.effects ?? []).flatMap((effectId) => {
        const definition = EFFECTS.find(({ id }) => id === effectId);
        if (!definition) return [];
        return [{
          ...createEffectLayer(definition, "preset", `preset:${preset.name}:${effectId}`),
          opacity: amount,
        }];
      }),
    ],
  };
  for (const key of [
    "brightness", "contrast", "saturation", "exposure", "temperature", "tint", "blur", "grain", "vignette",
    "highlights", "shadows", "sharpness", "vibrance", "whites", "blacks", "clarity", "texture", "dehaze",
  ] as AdjustmentKey[]) {
    const from = getAdjustmentValue(INITIAL_IMAGE_EDIT, key) ?? 0;
    const to = getAdjustmentValue(targetState, key) ?? from;
    state = setAdjustmentValue(state, key, interpolate(from, to, strength));
  }
  for (const [key, value] of Object.entries(current.manualAdjustments) as [AdjustmentKey, number][]) {
    state = setAdjustmentValue(state, key, value);
  }
  return state;
}

function interpolate(start: number, end: number, amount: number) {
  return Math.round(start + (end - start) * amount);
}

function getPresetThumbnailState(preset: Preset) {
  const cached = PRESET_THUMBNAIL_STATES.get(preset.name);
  if (cached) return cached;
  const state = createPresetState(INITIAL_IMAGE_EDIT, preset, 100);
  PRESET_THUMBNAIL_STATES.set(preset.name, state);
  return state;
}

function readStoredStringArray(key: string) {
  const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
}

function readStoredPresets() {
  const value: unknown = JSON.parse(window.localStorage.getItem("redwell-image-presets-custom") ?? "[]");
  if (!Array.isArray(value)) return [];
  return value.filter(isStoredPreset);
}

function isStoredPreset(value: unknown): value is Preset {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Preset>;
  return typeof candidate.name === "string" &&
    candidate.group === "Yours" &&
    candidate.id === "original" &&
    candidate.userCreated === true;
}

function parseImportedPreset(value: unknown): Preset | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  if (source.schema !== PRESET_SCHEMA || source.version !== PRESET_SCHEMA_VERSION) return null;
  const data = (source.preset && typeof source.preset === "object" ? source.preset : source) as Record<string, unknown>;
  if (typeof data.name !== "string" || !data.name.trim() || data.name.length > 60) return null;

  const filters = parseNumericRecord(data.filters, [
    "brightness", "contrast", "saturation", "exposure", "temperature", "tint", "blur", "grain", "vignette", "opacity",
  ]);
  const adjustments = parseNumericRecord(data.adjustments, [
    "brightness", "contrast", "saturation", "exposure", "temperature", "tint", "blur", "grain", "vignette",
    "highlights", "shadows", "sharpness", "vibrance", "whites", "blacks", "clarity", "texture", "dehaze",
  ]);
  if (!filters || !adjustments || (data.effects !== undefined && (
    !Array.isArray(data.effects) || !data.effects.every((effect) => EFFECTS.some(({ id }) => id === effect))
  ))) return null;

  return {
    name: data.name.trim(),
    group: "Yours",
    id: "original",
    filters: filters as Partial<PhotoFilters>,
    adjustments: adjustments as Partial<EditorAdjustments>,
    effects: data.effects as ImageEffect[] | undefined,
    userCreated: true,
  };
}

function parseNumericRecord(value: unknown, supportedKeys: string[]) {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result: Record<string, number> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!supportedKeys.includes(key) || typeof entry !== "number" || !Number.isFinite(entry)) return null;
    result[key] = entry;
  }
  return result;
}

function previewEffectState(state: ImageEditState, definition: EffectDefinition): ImageEditState {
  const existing = state.effects.find(({ effect }) => effect === definition.id);
  const effects = existing
    ? state.effects.map((layer) => layer.id === existing.id ? { ...layer, visible: true } : layer)
    : [...state.effects, createEffectLayer(definition, "manual", `preview:${definition.id}`)];
  return { ...state, effects };
}

function withManualAdjustment(state: ImageEditState, key: AdjustmentKey, value: number): ImageEditState {
  return {
    ...setAdjustmentValue(state, key, value),
    manualAdjustments: { ...state.manualAdjustments, [key]: value },
  };
}

function setAdjustmentValue(state: ImageEditState, key: AdjustmentKey, value: number): ImageEditState {
  if ([
    "brightness", "contrast", "saturation", "exposure", "temperature", "tint", "blur", "grain", "vignette",
  ].includes(key)) {
    return { ...state, filters: { ...state.filters, [key as keyof PhotoFilters]: value } };
  }
  switch (key) {
    case "highlights": return { ...state, highlights: value };
    case "shadows": return { ...state, shadows: value };
    case "sharpness": return { ...state, sharpness: value };
    case "vibrance": return { ...state, vibrance: value };
    case "whites": return { ...state, whites: value };
    case "blacks": return { ...state, blacks: value };
    case "clarity": return { ...state, clarity: value };
    case "texture": return { ...state, texture: value };
    case "dehaze": return { ...state, dehaze: value };
    default: return state;
  }
}

function getAdjustmentValue(state: ImageEditState, key: AdjustmentKey) {
  if ([
    "brightness", "contrast", "saturation", "exposure", "temperature", "tint", "blur", "grain", "vignette",
  ].includes(key)) return state.filters[key as keyof PhotoFilters] as number;
  switch (key) {
    case "highlights": return state.highlights;
    case "shadows": return state.shadows;
    case "sharpness": return state.sharpness;
    case "vibrance": return state.vibrance;
    case "whites": return state.whites;
    case "blacks": return state.blacks;
    case "clarity": return state.clarity;
    case "texture": return state.texture;
    case "dehaze": return state.dehaze;
  }
}

function getRenderSignature(state: ImageEditState) {
  return JSON.stringify({
    filters: state.filters,
    highlights: state.highlights,
    shadows: state.shadows,
    sharpness: state.sharpness,
    vibrance: state.vibrance,
    whites: state.whites,
    blacks: state.blacks,
    clarity: state.clarity,
    texture: state.texture,
    dehaze: state.dehaze,
    colorGrade: state.colorGrade,
    rotation: state.rotation,
    flipX: state.flipX,
    flipY: state.flipY,
    crop: state.crop,
    presetAmount: state.presetAmount,
    effects: state.effects.map(({ effect, visible, opacity, parameters }) => ({ effect, visible, opacity, parameters })),
  });
}

function getImageSourceId(image: HTMLImageElement) {
  const existingId = IMAGE_SOURCE_IDS.get(image);
  if (existingId) return existingId;
  const id = nextImageSourceId++;
  IMAGE_SOURCE_IDS.set(image, id);
  return id;
}

function takePreviewBitmap(key: string) {
  const bitmap = PREVIEW_BITMAP_CACHE.get(key);
  if (!bitmap) return null;
  PREVIEW_BITMAP_CACHE.delete(key);
  PREVIEW_BITMAP_CACHE.set(key, bitmap);
  return bitmap;
}

function storePreviewBitmap(key: string, bitmap: ImageBitmap) {
  const previous = PREVIEW_BITMAP_CACHE.get(key);
  previous?.close();
  PREVIEW_BITMAP_CACHE.delete(key);
  PREVIEW_BITMAP_CACHE.set(key, bitmap);
  while (PREVIEW_BITMAP_CACHE.size > PREVIEW_CACHE_LIMIT) {
    const oldestKey = PREVIEW_BITMAP_CACHE.keys().next().value;
    if (!oldestKey) break;
    PREVIEW_BITMAP_CACHE.get(oldestKey)?.close();
    PREVIEW_BITMAP_CACHE.delete(oldestKey);
  }
}

function hasRenderableEdits(state: ImageEditState) {
  return getRenderSignature(state) !== getRenderSignature(INITIAL_IMAGE_EDIT);
}

function getResolutionOptions(source: EditableImageSource, state: ImageEditState) {
  const cropWidth = getImageWidth(source) * state.crop.width;
  const cropHeight = getImageHeight(source) * state.crop.height;
  const longestSide = Math.max(
    state.rotation === 90 || state.rotation === 270 ? cropHeight : cropWidth,
    state.rotation === 90 || state.rotation === 270 ? cropWidth : cropHeight
  );
  return [
    { dimension: 3840, label: "4K" },
    { dimension: 2560, label: "2K" },
    { dimension: 1920, label: "1080p" },
    { dimension: 1280, label: "720p" },
    { dimension: 854, label: "480p" },
    { dimension: 640, label: "360p" },
  ].filter(({ dimension }) => dimension <= longestSide);
}

const PRESET_THUMBNAIL_STATES = new Map<string, ImageEditState>(
  BUILT_IN_PRESETS.map((preset) => [preset.name, createPresetState(INITIAL_IMAGE_EDIT, preset, 100)])
);

const EFFECT_THUMBNAIL_STATES = new Map(
  EFFECTS.map((effect) => [effect.id, previewEffectState(INITIAL_IMAGE_EDIT, effect)])
);
