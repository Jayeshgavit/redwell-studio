import type { PhotoFilterPreset, PhotoFilters } from "@/types/editor";

export type ResolvedPhotoFilters = PhotoFilters & {
  gradientOverlay?: "dark-fade" | "warm-fade";
};

export const FILTER_PRESETS: { id: PhotoFilterPreset; label: string }[] = [
  { id: "original", label: "Original" },
  { id: "vivid", label: "Vivid" },
  { id: "warm", label: "Warm" },
  { id: "cool", label: "Cool" },
  { id: "cinematic", label: "Cinematic" },
  { id: "moody", label: "Moody" },
  { id: "film", label: "Film" },
  { id: "vintage", label: "Vintage" },
  { id: "matte", label: "Matte" },
  { id: "faded", label: "Faded" },
  { id: "bw", label: "Black & White" },
  { id: "high-contrast", label: "High Contrast" },
  { id: "soft", label: "Soft" },
  { id: "dramatic", label: "Dramatic" },
  { id: "golden", label: "Golden" },
  { id: "forest", label: "Forest" },
  { id: "mist", label: "Mist" },
  { id: "sunset", label: "Sunset" },
  { id: "noir", label: "Noir" },
];

const DEFAULT_FILTERS: PhotoFilters = {
  preset: "original",
  brightness: 100,
  contrast: 100,
  saturation: 100,
  exposure: 0,
  temperature: 0,
  tint: 0,
  blur: 0,
  grain: 0,
  vignette: 0,
  opacity: 100,
};

const PRESET_VALUES: Record<PhotoFilterPreset, Partial<PhotoFilters>> = {
  original: {},
  vivid: { contrast: 112, saturation: 145 },
  warm: { temperature: 32, saturation: 108 },
  cool: { temperature: -32, saturation: 105 },
  cinematic: { contrast: 118, saturation: 82, temperature: -8, vignette: 18 },
  moody: { brightness: 91, contrast: 116, saturation: 82, vignette: 28 },
  film: { brightness: 104, contrast: 94, saturation: 88, grain: 18 },
  vintage: { brightness: 105, contrast: 88, saturation: 78, temperature: 18, grain: 16 },
  matte: { brightness: 106, contrast: 82, saturation: 88 },
  faded: { brightness: 110, contrast: 80, saturation: 72 },
  bw: { contrast: 112, saturation: 0 },
  "high-contrast": { contrast: 145, saturation: 108 },
  soft: { brightness: 106, contrast: 90, saturation: 90 },
  bright: { brightness: 118, contrast: 106, saturation: 112 },
  dark: { brightness: 82, contrast: 112, saturation: 92 },
  golden: { temperature: 42, saturation: 118, brightness: 104 },
  forest: { temperature: -8, tint: -12, saturation: 112 },
  mist: { brightness: 112, contrast: 76, saturation: 78 },
  sunset: { temperature: 30, tint: 16, saturation: 128 },
  dramatic: { contrast: 136, saturation: 110, vignette: 20 },
  noir: { brightness: 92, contrast: 160, saturation: 0, vignette: 36 },
  duotone: { saturation: 34, temperature: 28, contrast: 110 },
};

export function resolvePhotoFilters(filters?: PhotoFilters): ResolvedPhotoFilters {
  const preset = filters?.preset ?? "original";
  return {
    ...DEFAULT_FILTERS,
    ...PRESET_VALUES[preset],
    ...filters,
    preset,
  };
}

export function createPhotoFilterPreset(preset: PhotoFilterPreset): ResolvedPhotoFilters {
  return resolvePhotoFilters({ ...DEFAULT_FILTERS, ...PRESET_VALUES[preset], preset });
}

export function getPhotoCssFilter(filters?: PhotoFilters, pixelRatio = 1) {
  const value = resolvePhotoFilters(filters);
  const brightness = clamp((value.brightness / 100) * (1 + value.exposure / 100), 0, 3);
  return `brightness(${brightness}) contrast(${value.contrast / 100}) saturate(${value.saturation / 100}) blur(${value.blur * pixelRatio}px)`;
}

export function getPhotoColorOverlay(filters?: PhotoFilters) {
  const value = resolvePhotoFilters(filters);
  if (Math.abs(value.temperature) >= Math.abs(value.tint) && value.temperature !== 0) {
    return {
      color: value.temperature > 0 ? "#ffb45f" : "#71b8ff",
      opacity: Math.abs(value.temperature) / 100 * 0.38,
    };
  }
  if (value.tint !== 0) {
    return {
      color: value.tint > 0 ? "#df6f9e" : "#72aa69",
      opacity: Math.abs(value.tint) / 100 * 0.34,
    };
  }
  return null;
}

export function getPhotoGradientOverlay(filters?: PhotoFilters) {
  const overlay = filters?.gradientOverlay;
  if (overlay === "dark-fade") {
    return "linear-gradient(180deg, rgba(0, 0, 0, 0.62), rgba(0, 0, 0, 0) 72%)";
  }
  if (overlay === "warm-fade") {
    return "linear-gradient(135deg, rgba(177, 91, 42, 0.46), rgba(244, 190, 112, 0) 75%)";
  }
  return undefined;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
