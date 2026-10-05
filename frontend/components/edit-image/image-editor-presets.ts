import type { PhotoFilterPreset, PhotoFilters } from "@/types/editor";
import type { EditorAdjustments, ImageEffect } from "./image-editor-renderer";

export type PresetGroup =
  | "Recommended"
  | "Clean"
  | "Portrait"
  | "Travel"
  | "Cinematic"
  | "Film"
  | "Vintage"
  | "Black & White"
  | "Moody"
  | "Bright"
  | "Warm"
  | "Cool"
  | "Nature"
  | "Food"
  | "Urban"
  | "Night"
  | "Social"
  | "Seasonal"
  | "Yours";

export interface Preset {
  name: string;
  group: PresetGroup;
  id: PhotoFilterPreset;
  filters?: Partial<PhotoFilters>;
  adjustments?: Partial<EditorAdjustments>;
  effects?: ImageEffect[];
  userCreated?: boolean;
}

type PresetSpec = [
  name: string,
  brightness: number,
  contrast: number,
  saturation: number,
  exposure: number,
  temperature: number,
  tint: number,
  highlights: number,
  shadows: number,
  vibrance: number,
  clarity: number,
  dehaze: number,
  grain: number,
  vignette: number,
  sharpness: number,
  blacks?: number,
  whites?: number,
];

const groups: [PresetGroup, PhotoFilterPreset, PresetSpec[]][] = [
  ["Recommended", "original", [
    ["Redwell Natural", 102, 103, 102, 2, 1, 0, -5, 6, 7, 2, 1, 0, 2, 2],
    ["Redwell Gold", 103, 104, 104, 3, 10, 2, -8, 5, 9, 2, 1, 0, 5, 2],
    ["Redwell Air", 108, 96, 98, 5, 2, 0, -9, 9, 4, -2, 0, 0, 0, 0, 3, 5],
    ["Redwell Deep", 97, 108, 96, -1, -2, 0, -8, 2, 4, 4, 3, 0, 8, 2, -3],
    ["Redwell Portrait", 103, 100, 98, 2, 5, 1, -10, 6, 5, -2, 0, 0, 1, 0, 1, 3],
  ]],
  ["Clean", "original", [
    ["Clean Natural", 102, 101, 99, 1, 0, 0, -4, 4, 4, 1, 0, 0, 0, 1],
    ["Soft Natural", 105, 96, 96, 3, 2, 0, -8, 7, 3, -3, 0, 0, 0, 0, 2, 3],
    ["Fresh Light", 107, 99, 103, 5, 1, 0, -7, 8, 7, 1, 0, 0, 1, 1, 2, 5],
    ["Balanced", 101, 103, 100, 0, 0, 0, -5, 5, 3, 2, 1, 0, 1, 1],
    ["Clear Day", 103, 105, 104, 2, -1, 0, -8, 4, 8, 3, 2, 0, 2, 2],
    ["Neutral Pro", 100, 104, 98, 0, 0, 0, -6, 3, 2, 2, 1, 0, 0, 2],
  ]],
  ["Portrait", "soft", [
    ["Portrait Soft", 105, 96, 94, 3, 4, 1, -12, 7, 3, -5, 0, 0, 1, 0, 2, 4],
    ["Portrait Warm", 103, 100, 99, 2, 8, 2, -10, 6, 5, -2, 0, 0, 2, 0],
    ["Portrait Clean", 102, 102, 97, 1, 3, 0, -8, 5, 4, 0, 0, 0, 0, 1],
    ["Skin Glow", 106, 98, 101, 4, 6, 2, -13, 9, 7, -3, 0, 0, 1, 0, 2, 5],
    ["Editorial Portrait", 99, 107, 91, -1, 1, 1, -11, 2, 1, 4, 1, 0, 4, 1, -2],
    ["Studio Neutral", 101, 103, 96, 1, 0, 0, -9, 5, 2, 1, 0, 0, 0, 1],
  ]],
  ["Travel", "golden", [
    ["Travel Bright", 106, 102, 105, 4, 3, 0, -7, 7, 9, 2, 2, 0, 2, 1, 1, 4],
    ["Mountain Air", 104, 107, 99, 2, -4, -1, -8, 4, 6, 4, 5, 0, 3, 3],
    ["Coastal", 105, 101, 104, 3, -3, 1, -9, 6, 8, 1, 2, 0, 2, 1],
    ["Golden Journey", 104, 104, 103, 3, 9, 2, -9, 5, 9, 2, 2, 0, 5, 1],
    ["Explorer", 101, 109, 102, 0, 1, -1, -7, 3, 7, 5, 5, 0, 4, 3, -2],
  ]],
  ["Cinematic", "cinematic", [
    ["Cinema Dark", 94, 109, 89, -3, -3, 1, -13, -3, 1, 4, 3, 2, 12, 1, -5],
    ["Cinema Gold", 101, 108, 97, 0, 8, 2, -12, 1, 4, 4, 3, 1, 8, 1, -3],
    ["Cinema Blue", 98, 108, 91, -1, -9, -2, -11, 1, 1, 4, 4, 1, 9, 1, -4],
    ["Teal Night", 94, 112, 88, -4, -8, -4, -14, -3, 0, 5, 5, 2, 14, 2, -6],
    ["Soft Cinema", 103, 101, 94, 2, 2, 1, -10, 6, 2, 0, 1, 1, 5, 0, 1, 3],
    ["Modern Cinema", 99, 106, 96, 0, -2, 1, -9, 3, 4, 3, 2, 0, 6, 1, -2],
  ]],
  ["Film", "film", [
    ["Redwell Soft Film", 104, 96, 92, 2, 3, 1, -8, 6, 2, -1, 0, 8, 3, 0, 3, 3],
    ["Film Warm", 103, 98, 96, 1, 7, 2, -8, 5, 4, 0, 0, 10, 4, 0, 2],
    ["Film Fade", 107, 89, 83, 4, 4, 0, -9, 9, 2, -2, 0, 7, 2, 0, 7, 5],
    ["Classic Negative", 99, 105, 92, -1, 2, -1, -6, 2, 5, 3, 1, 5, 5, 1, -3],
    ["Faded Color", 106, 91, 81, 3, 1, 1, -9, 7, 1, -1, 0, 6, 1, 0, 6, 4],
    ["Street Film", 98, 108, 95, 0, -1, 0, -7, 2, 4, 4, 2, 9, 8, 2, -3],
  ]],
  ["Vintage", "vintage", [
    ["Retro Warm", 103, 94, 90, 2, 10, 3, -8, 7, 2, -1, 0, 8, 4, 0, 3, 2],
    ["Old Camera", 101, 101, 86, 0, 5, 1, -6, 3, 0, 2, 1, 12, 6, 1, -1],
    ["Faded Memory", 108, 87, 78, 4, 4, 1, -10, 9, 1, -3, 0, 8, 2, 0, 8, 6],
    ["Nostalgic", 102, 97, 88, 1, 7, 2, -7, 5, 2, 0, 0, 10, 5, 0, 2],
  ]],
  ["Black & White", "bw", [
    ["Classic Mono", 101, 105, 0, 0, 0, 0, -7, 4, 0, 1, 0, 0, 2, 1],
    ["Deep Mono", 98, 116, 0, -1, 0, 0, -11, -2, 0, 3, 1, 2, 5, 1, -4],
    ["Soft Mono", 106, 91, 0, 3, 1, 0, -7, 7, 0, -2, 0, 3, 1, 0, 3, 4],
    ["Silver", 102, 108, 0, 0, -1, 0, -8, 3, 0, 3, 1, 1, 3, 2],
    ["Editorial Mono", 99, 111, 0, -1, 0, 0, -11, 1, 0, 4, 1, 0, 4, 1, -2],
    ["Matte Mono", 105, 93, 0, 2, 1, 0, -7, 8, 0, -1, 0, 4, 2, 0, 5, 3],
  ]],
  ["Moody", "moody", [
    ["Dark Mood", 93, 109, 88, -4, -2, 0, -12, -4, 0, 4, 3, 1, 12, 1, -5],
    ["Deep Green", 96, 108, 94, -2, -3, -4, -10, 0, 2, 4, 5, 0, 8, 2, -3],
    ["Shadow Story", 97, 112, 91, -2, 1, 0, -14, -5, 1, 5, 2, 2, 10, 1, -6],
    ["Rainy Mood", 96, 104, 88, -2, -5, 0, -9, 3, 0, 2, 3, 2, 10, 0, -3],
  ]],
  ["Bright", "bright", [
    ["Redwell Airy", 110, 94, 97, 6, 2, 0, -12, 10, 4, -2, 0, 0, 0, 0, 5, 8],
    ["Bright Clean", 108, 101, 102, 5, 1, 0, -8, 7, 5, 1, 0, 0, 0, 1, 3, 7],
    ["High Key", 112, 92, 96, 7, 2, 0, -14, 10, 2, -2, 0, 0, 0, 0, 5, 10],
    ["Morning Light", 107, 98, 101, 5, 4, 1, -9, 8, 5, 0, 0, 0, 1, 0, 3, 6],
  ]],
  ["Warm", "warm", [
    ["Sunset Warm", 102, 103, 101, 1, 12, 4, -8, 4, 5, 2, 1, 0, 5, 1],
    ["Honey", 104, 98, 101, 2, 9, 2, -8, 6, 5, 0, 0, 2, 3, 0],
    ["Warm Skin", 103, 98, 96, 2, 7, 2, -10, 6, 4, -3, 0, 0, 1, 0],
    ["Amber Street", 99, 106, 98, 0, 10, 3, -9, 2, 4, 4, 2, 2, 7, 2, -2],
  ]],
  ["Cool", "cool", [
    ["Arctic", 101, 105, 94, 1, -11, -2, -8, 4, 3, 2, 2, 0, 2, 1],
    ["Blue Hour", 96, 106, 92, -2, -10, -1, -9, 2, 1, 3, 3, 0, 7, 1, -2],
    ["Ocean Blue", 102, 102, 99, 1, -8, -2, -8, 5, 6, 1, 1, 0, 2, 1],
    ["Steel", 99, 109, 87, 0, -6, -1, -9, 2, 0, 4, 2, 1, 5, 2, -2],
  ]],
  ["Nature", "forest", [
    ["Forest Green", 100, 105, 102, 0, -2, -5, -8, 4, 6, 3, 4, 0, 3, 2],
    ["Mountain", 103, 108, 99, 2, -3, 0, -9, 3, 6, 4, 5, 0, 3, 3],
    ["Fresh Green", 105, 101, 104, 3, 0, -3, -8, 7, 9, 1, 2, 0, 1, 1],
    ["Earth Tone", 101, 102, 94, 0, 5, -2, -7, 5, 3, 2, 2, 1, 3, 1],
    ["Wild", 99, 110, 105, -1, -2, -4, -9, 2, 10, 5, 5, 0, 4, 3, -2],
  ]],
  ["Food", "warm", [
    ["Restaurant", 102, 106, 103, 1, 4, 1, -8, 4, 5, 2, 1, 0, 3, 1],
    ["Warm Plate", 103, 102, 104, 2, 8, 2, -9, 6, 6, 0, 0, 0, 1, 0],
    ["Natural Food", 102, 103, 101, 1, 2, 0, -7, 4, 4, 1, 0, 0, 0, 1],
    ["Cafe", 99, 105, 96, 0, 6, 1, -8, 2, 3, 3, 1, 4, 5, 1, -2],
  ]],
  ["Urban", "cinematic", [
    ["Concrete", 99, 108, 91, 0, -2, -1, -8, 2, 1, 4, 3, 1, 5, 2, -2],
    ["City Night", 94, 110, 93, -4, -5, 0, -12, -2, 3, 4, 4, 2, 10, 1, -4],
    ["Architecture", 101, 109, 96, 1, 0, 0, -8, 2, 3, 5, 3, 0, 2, 3, -2],
    ["Metro", 98, 106, 91, 0, -4, -1, -9, 2, 1, 3, 3, 3, 7, 2, -2],
  ]],
  ["Night", "cinematic", [
    ["Night Cinema", 91, 110, 92, -6, -6, -1, -12, -1, 3, 4, 4, 2, 12, 1, -4],
    ["Neon", 95, 109, 105, -3, -4, 3, -10, 1, 8, 3, 3, 1, 9, 1, -3],
    ["Blue Night", 92, 108, 94, -5, -10, -2, -11, 0, 3, 3, 4, 1, 10, 1, -3],
    ["Midnight Film", 90, 107, 88, -6, -3, 0, -10, -2, 0, 2, 3, 8, 13, 0, -4],
  ]],
  ["Social", "vivid", [
    ["Creator", 104, 105, 106, 2, 2, 0, -7, 5, 9, 2, 1, 0, 2, 1],
    ["Soft Social", 106, 95, 96, 4, 3, 1, -9, 8, 4, -2, 0, 0, 1, 0, 3, 5],
    ["Travel Social", 105, 104, 108, 3, 4, 0, -8, 5, 10, 2, 3, 0, 3, 2],
    ["Portrait Social", 104, 99, 101, 3, 5, 1, -11, 7, 6, -2, 0, 0, 1, 0, 2, 4],
    ["Vibrant Social", 102, 108, 112, 1, 1, 0, -8, 3, 12, 3, 2, 0, 3, 2],
  ]],
  ["Seasonal", "golden", [
    ["Spring Bloom", 105, 99, 103, 3, 3, 1, -8, 7, 8, 0, 1, 0, 1, 0],
    ["Summer Glow", 105, 102, 106, 4, 8, 2, -9, 7, 10, 1, 1, 0, 4, 1],
    ["Autumn Ember", 100, 105, 99, 0, 9, 3, -9, 4, 5, 3, 2, 3, 5, 1, -2],
    ["Winter Still", 101, 104, 91, 0, -7, -1, -8, 4, 3, 2, 1, 0, 2, 1],
  ]],
];

export const PRESET_GROUPS: PresetGroup[] = groups.map(([group]) => group).filter((group, index, all) => all.indexOf(group) === index);
export const PRESET_CATEGORIES = ["ALL", ...PRESET_GROUPS, "Yours"] as const;

export const BUILT_IN_PRESETS: Preset[] = [
  { name: "Original", group: "Recommended", id: "original" },
  ...groups.flatMap(([group, id, specs]) =>
    specs.map(([name, brightness, contrast, saturation, exposure, temperature, tint, highlights, shadows, vibrance, clarity, dehaze, grain, vignette, sharpness, blacks, whites]) => ({
      name,
      group,
      id,
      filters: { brightness, contrast, saturation, exposure, temperature, tint, grain, vignette },
      adjustments: { highlights, shadows, vibrance, clarity, dehaze, sharpness, ...(blacks === undefined ? {} : { blacks }), ...(whites === undefined ? {} : { whites }) },
    }))
  ),
];

export const PRESET_SCHEMA = "redwell-preset";
export const PRESET_SCHEMA_VERSION = 1;
