import type { CarouselSlide, CarouselStoryLayoutDefinition, CarouselStoryTextItem, CarouselStoryTextPlacement, CollageStyle } from "@/types/editor";
import { CAROUSEL_STORY_LAYOUTS } from "./carousel-story-templates";

export interface CarouselTheme {
  id: string;
  name: string;
  description: string;
  paper: string;
  ink: string;
  muted: string;
  accent: string;
  inverse: string;
  headingFont: "serif" | "sans";
  headingWeight: number;
  spacing: number;
}

export const CAROUSEL_THEMES: CarouselTheme[] = [
  { id: "redwell", name: "Redwell", description: "Warm paper · editorial serif", paper: "#f3eee5", ink: "#24211e", muted: "#60574e", accent: "#a8322b", inverse: "#fffaf1", headingFont: "serif", headingWeight: 500, spacing: 16 },
  { id: "contrast", name: "Contrast", description: "Charcoal · bold sans", paper: "#f6f4ef", ink: "#171717", muted: "#595959", accent: "#b52e27", inverse: "#ffffff", headingFont: "sans", headingWeight: 700, spacing: 12 },
  { id: "field", name: "Field notes", description: "Oat paper · forest accents", paper: "#eee9dc", ink: "#26382d", muted: "#596454", accent: "#416341", inverse: "#f8f5ec", headingFont: "serif", headingWeight: 500, spacing: 20 },
  { id: "blueprint", name: "Blueprint", description: "Cool paper · precise sans", paper: "#eef0f4", ink: "#203451", muted: "#526177", accent: "#2455a4", inverse: "#ffffff", headingFont: "sans", headingWeight: 600, spacing: 16 },
  { id: "sage", name: "Sage", description: "Soft sage · quiet gallery", paper: "#e4ebe3", ink: "#293b32", muted: "#526558", accent: "#42634c", inverse: "#f7faf4", headingFont: "serif", headingWeight: 500, spacing: 20 },
  { id: "clay", name: "Clay", description: "Terracotta paper · personal notes", paper: "#efe0d6", ink: "#4c2e29", muted: "#71534a", accent: "#9b4134", inverse: "#fff7f0", headingFont: "serif", headingWeight: 500, spacing: 18 },
];

export function getCarouselTheme(id?: string | null) {
  return CAROUSEL_THEMES.find((theme) => theme.id === id);
}

function isInverse(layout?: CarouselStoryLayoutDefinition) {
  return layout?.themeTone === "ink" || layout?.themeTone === "photo" ||
    (!layout?.themeTone && layout?.textPlacements.some((item) => item.color === "#ffffff" || item.color === "#fffaf1"));
}

export function getThemedTextDefaults(item: CarouselStoryTextPlacement, theme: CarouselTheme, layout?: CarouselStoryLayoutDefinition): Partial<CarouselStoryTextPlacement> {
  const inverse = isInverse(layout);
  const heading = item.role === "title" || item.role === "quote";
  const label = item.role === "eyebrow" || item.role === "metadata" || item.role === "location";
  const badge = item.role === "cta";
  return {
    fontFamily: heading ? theme.headingFont : "sans",
    fontWeight: heading ? theme.headingWeight : item.fontWeight,
    color: badge ? theme.inverse : inverse ? theme.inverse : label ? theme.accent : heading ? theme.ink : theme.muted,
    ...(item.backgroundColor ? { backgroundColor: badge ? theme.accent : theme.paper } : {}),
  };
}

/** Only update fields still equal to their generated defaults; content and local edits survive. */
function mergeDefaults<T extends object>(current: T, previous: Partial<T>, next: Partial<T>): T {
  const result = { ...current };
  for (const key of Object.keys(next) as Array<keyof T>) {
    if (current[key] === previous[key] || current[key] === undefined) result[key] = next[key] as T[keyof T];
  }
  return result;
}

export function themeCarouselText(item: CarouselStoryTextItem, theme: CarouselTheme, layout?: CarouselStoryLayoutDefinition, initialize = false): CarouselStoryTextItem {
  const placement = layout?.textPlacements.find((candidate) => candidate.role === item.role) ?? item;
  const defaults = getThemedTextDefaults(placement, theme, layout);
  if (item.locked) return item;
  return {
    ...(initialize ? { ...item, ...defaults } : mergeDefaults<CarouselStoryTextItem>(item, item.themeDefaults ?? placement, defaults)),
    themeDefaults: defaults,
  };
}

export function themeCarouselSlide(slide: CarouselSlide, theme: CarouselTheme, initialize = false): CarouselSlide {
  const layout = CAROUSEL_STORY_LAYOUTS.find((candidate) => candidate.id === slide.storyLayoutId);
  const defaults: Partial<CollageStyle> = {
    backgroundColor: isInverse(layout) ? theme.ink : theme.paper,
    spacing: theme.spacing, cornerRadius: 0, borderEnabled: false, borderColor: theme.paper,
  };
  // Legacy slides opt in only where their layout values still match. No guesswork about custom colors.
  const previous = slide.themeDefaults ?? { backgroundColor: layout?.backgroundColor };
  return {
    ...slide,
    collageStyle: initialize ? { ...slide.collageStyle, ...defaults } : mergeDefaults(slide.collageStyle, previous, defaults),
    themeDefaults: defaults,
    storyText: slide.storyText?.map((item) => themeCarouselText(item, theme, layout, initialize)),
  };
}
