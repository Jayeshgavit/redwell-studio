export type EditorTool =
  | "photos"
  | "layouts"
  | "elements"
  | "layers"
  | "style"
  | "design";

export type CanvasElementType = "icon" | "shape" | "doodle";

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  assetId: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  color?: string;
  flipX: boolean;
  flipY: boolean;
  zIndex: number;
  layerOrder?: number;
  visible?: boolean;
  locked?: boolean;
  supportsColor: boolean;
}

export type PhotoDisplayMode = "fill" | "fit" | "stretch";
export type PhotoRotation = 0 | 90 | 180 | 270;

export type PhotoFilterPreset = 
  | "original" | "vivid" | "warm" | "cool" | "cinematic" | "moody" 
  | "film" | "vintage" | "faded" | "matte" | "bw" | "high-contrast" 
  | "soft" | "bright" | "dark" | "golden" | "forest" | "mist" 
  | "sunset" | "dramatic" | "noir" | "duotone";

export interface PhotoFilters {
  preset: PhotoFilterPreset;
  brightness: number; // 0 to 200 (100 is normal)
  contrast: number; // 0 to 200 (100 is normal)
  saturation: number; // 0 to 200 (100 is normal)
  exposure: number; // -100 to 100 (0 is normal)
  temperature: number; // -100 to 100 (0 is normal)
  tint: number; // -100 to 100 (0 is normal)
  blur: number; // 0 to 10px
  grain: number; // 0 to 100%
  opacity: number; // 0 to 100%
  // Visual Overlays / Atmosphere
  gradientOverlay?: "dark-fade" | "warm-fade";
  lightLeak?: number; // 0 to 100%
  vignette?: number; // 0 to 100%
}

export interface Photo {
  id: string;
  src: string;
  displayMode: PhotoDisplayMode;
  positionX: number;
  positionY: number;
  zoom: number;
  rotation: PhotoRotation;
  flipX: boolean;
  flipY: boolean;
  layerOrder?: number;
  visible?: boolean;
  locked?: boolean;
  filters?: PhotoFilters;
}

export type ElementCategory =
  | "icons"
  | "arrows"
  | "hearts"
  | "stars"
  | "flowers"
  | "circles"
  | "highlights"
  | "scribbles"
  | "lines"
  | "shapes"
  | "custom"
  | "sparkles"
  | "travel"
  | "celebration";

export type ElementFileType = "svg" | "png" | "webp";

export interface ElementAsset {
  id: string;
  name: string;
  category: ElementCategory;
  type: CanvasElementType;
  format: ElementFileType;
  src: string;
  supportsColor: boolean;
  tags: string[];
}

export interface CanvasFormat {
  id: string;
  name: string;
  width: number;
  height: number;
  ratio: number;
}

export const CANVAS_FORMATS = [
  { id: "square", name: "Square", width: 1080, height: 1080, ratio: 1 },
  { id: "portrait", name: "Portrait", width: 1080, height: 1350, ratio: 4 / 5 },
  { id: "story", name: "Story", width: 1080, height: 1920, ratio: 9 / 16 },
  { id: "landscape", name: "Landscape", width: 1920, height: 1080, ratio: 16 / 9 },
] satisfies CanvasFormat[];

export interface LayoutCell {
  x: number; // 0 to 1
  y: number; // 0 to 1
  width: number; // 0 to 1
  height: number; // 0 to 1
  zIndex?: number;
  rotation?: number;
  isBackground?: boolean;
  frameStyle?: "card" | "polaroid";
  frameColor?: string;
}

export type CarouselStoryCategory =
  | "Travel / Journey"
  | "Photography"
  | "Creator"
  | "Story / Narrative"
  | "List / Tips"
  | "Minimal";

export const CAROUSEL_TEXT_SAFE_AREA = 0.06;

export type CarouselStoryLayoutId =
  | "full-bleed"
  | "hero"
  | "split"
  | "two-photo"
  | "three-photo"
  | "editorial"
  | "minimal"
  | "text-focus"
  | "detail"
  | "quote"
  | "cta"
  | "magazine-cover"
  | "photo-dump"
  | "scrapbook"
  | "contact-sheet"
  | "film-strip"
  | "cinematic"
  | "travel-journal"
  | "seamless"
  | "fashion";

export type CarouselStoryLayoutCategory =
  | "Featured"
  | "Editorial"
  | "Photo Dump"
  | "Scrapbook"
  | "Cinematic"
  | "Minimal"
  | "Seamless"
  | "Travel";

export type CarouselStorySlideType =
  | "cover"
  | "introduction"
  | "journey"
  | "detail"
  | "experience"
  | "highlight"
  | "ending"
  | "gallery"
  | "list"
  | "tip"
  | "before-after"
  | "quote"
  | "cta";

export type CarouselStoryTextRole =
  | "eyebrow"
  | "title"
  | "subtitle"
  | "body"
  | "metadata"
  | "location"
  | "quote"
  | "cta";

export const DEFAULT_STORY_TEXT_BY_ROLE: Record<CarouselStoryTextRole, string> = {
  eyebrow: "NEW",
  title: "Add a headline",
  subtitle: "Add a subtitle",
  body: "Add a caption",
  metadata: "Add a date",
  location: "Add a location",
  quote: "Add a quote",
  cta: "NEW",
};

export interface CarouselStoryTextPlacement {
  role: CarouselStoryTextRole;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: "serif" | "sans";
  fontWeight: number;
  color: string;
  textAlign: "left" | "center" | "right";
  lineHeight: number;
  letterSpacing: number;
  backgroundColor?: string;
  padding?: number;
  textShadow?: string;
}

export interface CarouselStoryTextItem extends CarouselStoryTextPlacement {
  id: string;
  text: string;
  layerOrder?: number;
  visible?: boolean;
  locked?: boolean;
}

export interface CarouselStoryLayoutDefinition {
  id: CarouselStoryLayoutId;
  name: string;
  category: CarouselStoryLayoutCategory;
  photoLayoutId: string;
  formatId: string;
  backgroundColor: string;
  elementZones: LayoutCell[];
  textPlacements: CarouselStoryTextPlacement[];
}

export interface CarouselStorySlideDefinition {
  id: string;
  type: CarouselStorySlideType;
  layoutId: CarouselStoryLayoutId;
  eyebrow?: string;
  title?: string;
  body?: string;
  subtitle?: string;
  metadata?: string;
  location?: string;
  quote?: string;
  cta?: string;
}

export interface CarouselStoryTemplateDefinition {
  id: string;
  category: CarouselStoryCategory;
  relatedCategories?: CarouselStoryCategory[];
  name: string;
  description: string;
  slides: CarouselStorySlideDefinition[];
  overflowSlide: CarouselStorySlideDefinition;
}

export interface LayoutDefinition {
  id: string;
  name: string;
  photoCount: number;
  cells: LayoutCell[];
}

export interface CollageStyle {
  spacing: number;
  cornerRadius: number;
  backgroundColor: string;
  borderEnabled: boolean;
  borderWidth: number;
  borderColor: string;
}

export type DocumentMode = "collage" | "carousel";

export interface CarouselSlide {
  id: string;
  order: number;
  photos: Photo[];
  slotAssignments: Record<number, string>;
  canvasFormatId: string;
  selectedLayoutId: string | null;
  elements: CanvasElement[];
  collageStyle: CollageStyle;
  storyLayoutId?: CarouselStoryLayoutId | null;
  storySlideType?: CarouselStorySlideType | null;
  storyText?: CarouselStoryTextItem[];
}

export interface CarouselState {
  id: string;
  slides: CarouselSlide[];
  activeSlideId: string;
  templateId?: string | null;
}

export const DEFAULT_COLLAGE_STYLE = {
  spacing: 8,
  cornerRadius: 4,
  backgroundColor: "#ffffff",
  borderEnabled: true,
  borderWidth: 2,
  borderColor: "#e5e7eb",
} satisfies CollageStyle;

export const COLLAGE_LAYOUTS = [
  {
    id: "1-full",
    name: "Full frame",
    photoCount: 1,
    cells: [{ x: 0, y: 0, width: 1, height: 1 }],
  },
  {
    id: "1-inset",
    name: "Inset portrait",
    photoCount: 1,
    cells: [{ x: 0.08, y: 0, width: 0.84, height: 1 }],
  },
  {
    id: "1-wide",
    name: "Wide frame",
    photoCount: 1,
    cells: [{ x: 0, y: 0.12, width: 1, height: 0.76 }],
  },
  {
    id: "2-vertical",
    name: "Vertical split",
    photoCount: 2,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 1 },
      { x: 0.5, y: 0, width: 0.5, height: 1 },
    ],
  },
  {
    id: "2-horizontal",
    name: "Horizontal split",
    photoCount: 2,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.5 },
      { x: 0, y: 0.5, width: 1, height: 0.5 },
    ],
  },
  {
    id: "2-large-left",
    name: "Large left",
    photoCount: 2,
    cells: [
      { x: 0, y: 0, width: 0.65, height: 1 },
      { x: 0.65, y: 0, width: 0.35, height: 1 },
    ],
  },
  {
    id: "2-large-right",
    name: "Large right",
    photoCount: 2,
    cells: [
      { x: 0, y: 0, width: 0.35, height: 1 },
      { x: 0.35, y: 0, width: 0.65, height: 1 },
    ],
  },
  {
    id: "3-large-left",
    name: "Feature left",
    photoCount: 3,
    cells: [
      { x: 0, y: 0, width: 0.62, height: 1 },
      { x: 0.62, y: 0, width: 0.38, height: 0.5 },
      { x: 0.62, y: 0.5, width: 0.38, height: 0.5 },
    ],
  },
  {
    id: "3-large-right",
    name: "Feature right",
    photoCount: 3,
    cells: [
      { x: 0, y: 0, width: 0.38, height: 0.5 },
      { x: 0, y: 0.5, width: 0.38, height: 0.5 },
      { x: 0.38, y: 0, width: 0.62, height: 1 },
    ],
  },
  {
    id: "3-horizontal",
    name: "Three rows",
    photoCount: 3,
    cells: [
      { x: 0, y: 0, width: 1, height: 1 / 3 },
      { x: 0, y: 1 / 3, width: 1, height: 1 / 3 },
      { x: 0, y: 2 / 3, width: 1, height: 1 / 3 },
    ],
  },
  {
    id: "3-top-and-pair",
    name: "Feature top",
    photoCount: 3,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.58 },
      { x: 0, y: 0.58, width: 0.5, height: 0.42 },
      { x: 0.5, y: 0.58, width: 0.5, height: 0.42 },
    ],
  },
  {
    id: "4-grid",
    name: "2 × 2 grid",
    photoCount: 4,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0, width: 0.5, height: 0.5 },
      { x: 0, y: 0.5, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
    ],
  },
  {
    id: "4-large-left",
    name: "Hero + Stack",
    photoCount: 4,
    cells: [
      { x: 0, y: 0, width: 0.62, height: 1 },
      { x: 0.62, y: 0, width: 0.38, height: 1 / 3 },
      { x: 0.62, y: 1 / 3, width: 0.38, height: 1 / 3 },
      { x: 0.62, y: 2 / 3, width: 0.38, height: 1 / 3 },
    ],
  },
  {
    id: "4-large-right",
    name: "Stack + Hero",
    photoCount: 4,
    cells: [
      { x: 0, y: 0, width: 0.38, height: 1 / 3 },
      { x: 0, y: 1 / 3, width: 0.38, height: 1 / 3 },
      { x: 0, y: 2 / 3, width: 0.38, height: 1 / 3 },
      { x: 0.38, y: 0, width: 0.62, height: 1 },
    ],
  },
  {
    id: "4-large-top",
    name: "Top Hero + Strip",
    photoCount: 4,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.62 },
      { x: 0, y: 0.62, width: 1 / 3, height: 0.38 },
      { x: 1 / 3, y: 0.62, width: 1 / 3, height: 0.38 },
      { x: 2 / 3, y: 0.62, width: 1 / 3, height: 0.38 },
    ],
  },
  {
    id: "5-feature-left",
    name: "Five · feature left",
    photoCount: 5,
    cells: [
      { x: 0, y: 0, width: 0.58, height: 1 },
      { x: 0.58, y: 0, width: 0.42, height: 0.25 },
      { x: 0.58, y: 0.25, width: 0.42, height: 0.25 },
      { x: 0.58, y: 0.5, width: 0.42, height: 0.25 },
      { x: 0.58, y: 0.75, width: 0.42, height: 0.25 },
    ],
  },
  {
    id: "5-mosaic",
    name: "Five · mosaic",
    photoCount: 5,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 0.55 },
      { x: 0.5, y: 0, width: 0.5, height: 0.45 },
      { x: 0.5, y: 0.45, width: 0.5, height: 0.55 },
      { x: 0, y: 0.55, width: 0.25, height: 0.45 },
      { x: 0.25, y: 0.55, width: 0.25, height: 0.45 },
    ],
  },
  {
    id: "5-feature-top",
    name: "Five · feature top",
    photoCount: 5,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.52 },
      { x: 0, y: 0.52, width: 0.25, height: 0.48 },
      { x: 0.25, y: 0.52, width: 0.25, height: 0.48 },
      { x: 0.5, y: 0.52, width: 0.25, height: 0.48 },
      { x: 0.75, y: 0.52, width: 0.25, height: 0.48 },
    ],
  },
  {
    id: "5-columns",
    name: "Five · editorial columns",
    photoCount: 5,
    cells: [
      { x: 0, y: 0, width: 0.4, height: 1 },
      { x: 0.4, y: 0, width: 0.6, height: 0.25 },
      { x: 0.4, y: 0.25, width: 0.6, height: 0.25 },
      { x: 0.4, y: 0.5, width: 0.6, height: 0.25 },
      { x: 0.4, y: 0.75, width: 0.6, height: 0.25 },
    ],
  },
  {
    id: "6-grid",
    name: "Six · 3 × 2 grid",
    photoCount: 6,
    cells: [
      { x: 0, y: 0, width: 1 / 3, height: 0.5 },
      { x: 1 / 3, y: 0, width: 1 / 3, height: 0.5 },
      { x: 2 / 3, y: 0, width: 1 / 3, height: 0.5 },
      { x: 0, y: 0.5, width: 1 / 3, height: 0.5 },
      { x: 1 / 3, y: 0.5, width: 1 / 3, height: 0.5 },
      { x: 2 / 3, y: 0.5, width: 1 / 3, height: 0.5 },
    ],
  },
  {
    id: "6-feature-left",
    name: "Six · feature left",
    photoCount: 6,
    cells: [
      { x: 0, y: 0, width: 0.55, height: 1 },
      { x: 0.55, y: 0, width: 0.15, height: 0.5 },
      { x: 0.7, y: 0, width: 0.15, height: 0.5 },
      { x: 0.85, y: 0, width: 0.15, height: 0.5 },
      { x: 0.55, y: 0.5, width: 0.225, height: 0.5 },
      { x: 0.775, y: 0.5, width: 0.225, height: 0.5 },
    ],
  },
  {
    id: "6-feature-top",
    name: "Six · feature top",
    photoCount: 6,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.5 },
      { x: 0, y: 0.5, width: 0.6, height: 0.25 },
      { x: 0.6, y: 0.5, width: 0.4, height: 0.25 },
      { x: 0, y: 0.75, width: 0.4, height: 0.25 },
      { x: 0.4, y: 0.75, width: 0.3, height: 0.25 },
      { x: 0.7, y: 0.75, width: 0.3, height: 0.25 },
    ],
  },
  {
    id: "6-magazine",
    name: "Six · magazine mosaic",
    photoCount: 6,
    cells: [
      { x: 0, y: 0, width: 0.62, height: 1 / 3 },
      { x: 0.62, y: 0, width: 0.38, height: 1 / 3 },
      { x: 0, y: 1 / 3, width: 0.38, height: 1 / 3 },
      { x: 0.38, y: 1 / 3, width: 0.62, height: 1 / 3 },
      { x: 0, y: 2 / 3, width: 0.5, height: 1 / 3 },
      { x: 0.5, y: 2 / 3, width: 0.5, height: 1 / 3 },
    ],
  },
  {
    id: "1-gallery-card",
    name: "Gallery card",
    photoCount: 1,
    cells: [{ x: 0.09, y: 0.08, width: 0.82, height: 0.84 }],
  },
  {
    id: "2-editorial-stack",
    name: "Editorial stack",
    photoCount: 2,
    cells: [
      { x: 0.06, y: 0.05, width: 0.7, height: 0.58 },
      { x: 0.28, y: 0.67, width: 0.66, height: 0.28 },
    ],
  },
  {
    id: "3-feature-bottom",
    name: "Feature bottom",
    photoCount: 3,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 0.42 },
      { x: 0.5, y: 0, width: 0.5, height: 0.42 },
      { x: 0, y: 0.42, width: 1, height: 0.58 },
    ],
  },
  {
    id: "4-portrait-story",
    name: "Portrait story",
    photoCount: 4,
    cells: [
      { x: 0, y: 0, width: 0.58, height: 1 },
      { x: 0.58, y: 0, width: 0.42, height: 0.34 },
      { x: 0.58, y: 0.34, width: 0.42, height: 0.33 },
      { x: 0.58, y: 0.67, width: 0.42, height: 0.33 },
    ],
  },
  {
    id: "5-feature-bottom",
    name: "Five · feature bottom",
    photoCount: 5,
    cells: [
      { x: 0, y: 0, width: 0.34, height: 0.46 },
      { x: 0.34, y: 0, width: 0.33, height: 0.46 },
      { x: 0.67, y: 0, width: 0.33, height: 0.46 },
      { x: 0, y: 0.46, width: 0.42, height: 0.54 },
      { x: 0.42, y: 0.46, width: 0.58, height: 0.54 },
    ],
  },
  {
    id: "6-portrait-grid",
    name: "Six · portrait grid",
    photoCount: 6,
    cells: [
      { x: 0, y: 0, width: 0.25, height: 0.62 },
      { x: 0.25, y: 0, width: 0.5, height: 0.62 },
      { x: 0.75, y: 0, width: 0.25, height: 0.62 },
      { x: 0, y: 0.62, width: 1 / 3, height: 0.38 },
      { x: 1 / 3, y: 0.62, width: 1 / 3, height: 0.38 },
      { x: 2 / 3, y: 0.62, width: 1 / 3, height: 0.38 },
    ],
  },
  {
    id: "7-feature-left",
    name: "Seven · feature left",
    photoCount: 7,
    cells: [
      { x: 0, y: 0, width: 0.52, height: 1 },
      { x: 0.52, y: 0, width: 0.24, height: 1 / 3 },
      { x: 0.76, y: 0, width: 0.24, height: 1 / 3 },
      { x: 0.52, y: 1 / 3, width: 0.24, height: 1 / 3 },
      { x: 0.76, y: 1 / 3, width: 0.24, height: 1 / 3 },
      { x: 0.52, y: 2 / 3, width: 0.24, height: 1 / 3 },
      { x: 0.76, y: 2 / 3, width: 0.24, height: 1 / 3 },
    ],
  },
  {
    id: "7-editorial-mosaic",
    name: "Seven · editorial mosaic",
    photoCount: 7,
    cells: [
      { x: 0, y: 0, width: 0.6, height: 0.52 },
      { x: 0.6, y: 0, width: 0.4, height: 0.26 },
      { x: 0.6, y: 0.26, width: 0.4, height: 0.26 },
      { x: 0, y: 0.52, width: 0.25, height: 0.48 },
      { x: 0.25, y: 0.52, width: 0.25, height: 0.48 },
      { x: 0.5, y: 0.52, width: 0.25, height: 0.48 },
      { x: 0.75, y: 0.52, width: 0.25, height: 0.48 },
    ],
  },
  {
    id: "8-grid",
    name: "Eight · balanced grid",
    photoCount: 8,
    cells: [
      { x: 0, y: 0, width: 0.25, height: 0.5 }, { x: 0.25, y: 0, width: 0.25, height: 0.5 },
      { x: 0.5, y: 0, width: 0.25, height: 0.5 }, { x: 0.75, y: 0, width: 0.25, height: 0.5 },
      { x: 0, y: 0.5, width: 0.25, height: 0.5 }, { x: 0.25, y: 0.5, width: 0.25, height: 0.5 },
      { x: 0.5, y: 0.5, width: 0.25, height: 0.5 }, { x: 0.75, y: 0.5, width: 0.25, height: 0.5 },
    ],
  },
  {
    id: "8-hero-mosaic",
    name: "Eight · hero mosaic",
    photoCount: 8,
    cells: [
      { x: 0, y: 0, width: 0.56, height: 0.66 },
      { x: 0.56, y: 0, width: 0.22, height: 0.33 }, { x: 0.78, y: 0, width: 0.22, height: 0.33 },
      { x: 0.56, y: 0.33, width: 0.22, height: 0.33 }, { x: 0.78, y: 0.33, width: 0.22, height: 0.33 },
      { x: 0, y: 0.66, width: 1 / 3, height: 0.34 }, { x: 1 / 3, y: 0.66, width: 1 / 3, height: 0.34 },
      { x: 2 / 3, y: 0.66, width: 1 / 3, height: 0.34 },
    ],
  },
  {
    id: "4-balanced-inset",
    name: "Four · inset grid",
    photoCount: 4,
    cells: [
      { x: 0.03, y: 0.03, width: 0.46, height: 0.46 },
      { x: 0.51, y: 0.03, width: 0.46, height: 0.46 },
      { x: 0.03, y: 0.51, width: 0.46, height: 0.46 },
      { x: 0.51, y: 0.51, width: 0.46, height: 0.46 },
    ],
  },
  {
    id: "4-tall-pair",
    name: "Four · tall pair",
    photoCount: 4,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 0.48 },
      { x: 0.5, y: 0, width: 0.5, height: 0.48 },
      { x: 0, y: 0.48, width: 0.64, height: 0.52 },
      { x: 0.64, y: 0.48, width: 0.36, height: 0.52 },
    ],
  },
  {
    id: "4-wide-ledger",
    name: "Four · wide ledger",
    photoCount: 4,
    cells: [
      { x: 0, y: 0, width: 0.64, height: 0.62 },
      { x: 0.64, y: 0, width: 0.36, height: 0.62 },
      { x: 0, y: 0.62, width: 0.36, height: 0.38 },
      { x: 0.36, y: 0.62, width: 0.64, height: 0.38 },
    ],
  },
  {
    id: "5-two-feature",
    name: "Five · twin feature",
    photoCount: 5,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 0.68 },
      { x: 0.5, y: 0, width: 0.5, height: 0.68 },
      { x: 0, y: 0.68, width: 1 / 3, height: 0.32 },
      { x: 1 / 3, y: 0.68, width: 1 / 3, height: 0.32 },
      { x: 2 / 3, y: 0.68, width: 1 / 3, height: 0.32 },
    ],
  },
  {
    id: "5-editorial-cross",
    name: "Five · editorial cross",
    photoCount: 5,
    cells: [
      { x: 0, y: 0, width: 0.66, height: 0.62 },
      { x: 0.66, y: 0, width: 0.34, height: 0.38 },
      { x: 0.66, y: 0.38, width: 0.34, height: 0.62 },
      { x: 0, y: 0.62, width: 0.33, height: 0.38 },
      { x: 0.33, y: 0.62, width: 0.33, height: 0.38 },
    ],
  },
  {
    id: "6-three-column-editorial",
    name: "Six · three column editorial",
    photoCount: 6,
    cells: [
      { x: 0, y: 0, width: 0.4, height: 0.54 },
      { x: 0.4, y: 0, width: 0.3, height: 0.54 },
      { x: 0.7, y: 0, width: 0.3, height: 0.54 },
      { x: 0, y: 0.54, width: 0.3, height: 0.46 },
      { x: 0.3, y: 0.54, width: 0.3, height: 0.46 },
      { x: 0.6, y: 0.54, width: 0.4, height: 0.46 },
    ],
  },
  {
    id: "6-center-feature",
    name: "Six · center feature",
    photoCount: 6,
    cells: [
      { x: 0, y: 0, width: 0.25, height: 0.66 },
      { x: 0.25, y: 0, width: 0.5, height: 0.66 },
      { x: 0.75, y: 0, width: 0.25, height: 0.66 },
      { x: 0, y: 0.66, width: 1 / 3, height: 0.34 },
      { x: 1 / 3, y: 0.66, width: 1 / 3, height: 0.34 },
      { x: 2 / 3, y: 0.66, width: 1 / 3, height: 0.34 },
    ],
  },
  {
    id: "6-cinema-strip",
    name: "Six · cinema strip",
    photoCount: 6,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.58 },
      { x: 0, y: 0.58, width: 0.2, height: 0.42 },
      { x: 0.2, y: 0.58, width: 0.2, height: 0.42 },
      { x: 0.4, y: 0.58, width: 0.2, height: 0.42 },
      { x: 0.6, y: 0.58, width: 0.2, height: 0.42 },
      { x: 0.8, y: 0.58, width: 0.2, height: 0.42 },
    ],
  },
  {
    id: "7-magazine-grid",
    name: "Seven · magazine grid",
    photoCount: 7,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 0.64 },
      { x: 0.5, y: 0, width: 0.5, height: 0.32 },
      { x: 0.5, y: 0.32, width: 0.5, height: 0.32 },
      { x: 0, y: 0.64, width: 0.25, height: 0.36 },
      { x: 0.25, y: 0.64, width: 0.25, height: 0.36 },
      { x: 0.5, y: 0.64, width: 0.25, height: 0.36 },
      { x: 0.75, y: 0.64, width: 0.25, height: 0.36 },
    ],
  },
  {
    id: "7-double-hero",
    name: "Seven · double hero",
    photoCount: 7,
    cells: [
      { x: 0, y: 0, width: 0.62, height: 0.62 },
      { x: 0.62, y: 0, width: 0.38, height: 0.62 },
      { x: 0, y: 0.62, width: 0.2, height: 0.38 },
      { x: 0.2, y: 0.62, width: 0.2, height: 0.38 },
      { x: 0.4, y: 0.62, width: 0.2, height: 0.38 },
      { x: 0.6, y: 0.62, width: 0.2, height: 0.38 },
      { x: 0.8, y: 0.62, width: 0.2, height: 0.38 },
    ],
  },
  {
    id: "8-editorial-mix",
    name: "Eight · editorial mix",
    photoCount: 8,
    cells: [
      { x: 0, y: 0, width: 0.58, height: 0.62 },
      { x: 0.58, y: 0, width: 0.42, height: 0.31 },
      { x: 0.58, y: 0.31, width: 0.42, height: 0.31 },
      { x: 0, y: 0.62, width: 0.28, height: 0.38 },
      { x: 0.28, y: 0.62, width: 0.24, height: 0.38 },
      { x: 0.52, y: 0.62, width: 0.24, height: 0.38 },
      { x: 0.76, y: 0.62, width: 0.24, height: 0.19 },
      { x: 0.76, y: 0.81, width: 0.24, height: 0.19 },
    ],
  },
  {
    id: "8-tall-hero",
    name: "Eight · tall hero",
    photoCount: 8,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 1 },
      { x: 0.5, y: 0, width: 0.25, height: 0.25 },
      { x: 0.75, y: 0, width: 0.25, height: 0.25 },
      { x: 0.5, y: 0.25, width: 0.25, height: 0.25 },
      { x: 0.75, y: 0.25, width: 0.25, height: 0.25 },
      { x: 0.5, y: 0.5, width: 1 / 6, height: 0.5 },
      { x: 2 / 3, y: 0.5, width: 1 / 6, height: 0.5 },
      { x: 5 / 6, y: 0.5, width: 1 / 6, height: 0.5 },
    ],
  },
  {
    id: "2-hero-caption",
    name: "Hero + companion",
    photoCount: 2,
    cells: [
      { x: 0, y: 0, width: 0.7, height: 1 },
      { x: 0.7, y: 0.12, width: 0.3, height: 0.76 },
    ],
  },
  {
    id: "2-editorial-diptych",
    name: "Editorial diptych",
    photoCount: 2,
    cells: [
      { x: 0, y: 0, width: 0.48, height: 0.82 },
      { x: 0.52, y: 0.18, width: 0.48, height: 0.82 },
    ],
  },
  {
    id: "3-editorial-columns",
    name: "Three · editorial columns",
    photoCount: 3,
    cells: [
      { x: 0, y: 0, width: 0.38, height: 1 },
      { x: 0.38, y: 0.16, width: 0.31, height: 0.68 },
      { x: 0.69, y: 0, width: 0.31, height: 1 },
    ],
  },
  {
    id: "3-vertical-editorial",
    name: "Three · vertical editorial",
    photoCount: 3,
    cells: [
      { x: 0, y: 0, width: 0.54, height: 1 },
      { x: 0.54, y: 0, width: 0.46, height: 0.49 },
      { x: 0.54, y: 0.51, width: 0.46, height: 0.49 },
    ],
  },
  {
    id: "4-four-corners",
    name: "Four · corner windows",
    photoCount: 4,
    cells: [
      { x: 0, y: 0, width: 0.47, height: 0.47 },
      { x: 0.53, y: 0, width: 0.47, height: 0.47 },
      { x: 0, y: 0.53, width: 0.47, height: 0.47 },
      { x: 0.53, y: 0.53, width: 0.47, height: 0.47 },
    ],
  },
  {
    id: "4-tall-feature-strip",
    name: "Four · tall feature",
    photoCount: 4,
    cells: [
      { x: 0, y: 0, width: 0.59, height: 1 },
      { x: 0.59, y: 0, width: 0.41, height: 0.33 },
      { x: 0.59, y: 0.335, width: 0.41, height: 0.33 },
      { x: 0.59, y: 0.67, width: 0.41, height: 0.33 },
    ],
  },
  {
    id: "4-landscape-feature",
    name: "Four · wide feature",
    photoCount: 4,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.61 },
      { x: 0, y: 0.61, width: 0.25, height: 0.39 },
      { x: 0.25, y: 0.61, width: 0.25, height: 0.39 },
      { x: 0.5, y: 0.61, width: 0.5, height: 0.39 },
    ],
  },
  {
    id: "5-bottom-feature-strip",
    name: "Five · low horizon",
    photoCount: 5,
    cells: [
      { x: 0, y: 0, width: 0.25, height: 0.4 },
      { x: 0.25, y: 0, width: 0.25, height: 0.4 },
      { x: 0.5, y: 0, width: 0.25, height: 0.4 },
      { x: 0.75, y: 0, width: 0.25, height: 0.4 },
      { x: 0, y: 0.4, width: 1, height: 0.6 },
    ],
  },
  {
    id: "5-tall-feature-right",
    name: "Five · tall feature right",
    photoCount: 5,
    cells: [
      { x: 0, y: 0, width: 0.42, height: 0.25 },
      { x: 0, y: 0.25, width: 0.42, height: 0.25 },
      { x: 0, y: 0.5, width: 0.42, height: 0.25 },
      { x: 0, y: 0.75, width: 0.42, height: 0.25 },
      { x: 0.42, y: 0, width: 0.58, height: 1 },
    ],
  },
  {
    id: "6-balanced-portrait",
    name: "Balanced six · portrait",
    photoCount: 6,
    cells: [
      { x: 0, y: 0, width: 1 / 3, height: 1 / 3 },
      { x: 1 / 3, y: 0, width: 1 / 3, height: 1 / 3 },
      { x: 2 / 3, y: 0, width: 1 / 3, height: 1 / 3 },
      { x: 0, y: 1 / 3, width: 1 / 3, height: 2 / 3 },
      { x: 1 / 3, y: 1 / 3, width: 1 / 3, height: 2 / 3 },
      { x: 2 / 3, y: 1 / 3, width: 1 / 3, height: 2 / 3 },
    ],
  },
  {
    id: "6-wide-feature-strip",
    name: "Six · wide feature",
    photoCount: 6,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.55 },
      { x: 0, y: 0.55, width: 0.2, height: 0.45 },
      { x: 0.2, y: 0.55, width: 0.2, height: 0.45 },
      { x: 0.4, y: 0.55, width: 0.2, height: 0.45 },
      { x: 0.6, y: 0.55, width: 0.2, height: 0.45 },
      { x: 0.8, y: 0.55, width: 0.2, height: 0.45 },
    ],
  },
  {
    id: "7-offset-editorial",
    name: "Editorial seven · offset",
    photoCount: 7,
    cells: [
      { x: 0, y: 0, width: 0.58, height: 0.6 },
      { x: 0.58, y: 0, width: 0.42, height: 0.3 },
      { x: 0.58, y: 0.3, width: 0.42, height: 0.3 },
      { x: 0, y: 0.6, width: 0.2, height: 0.4 },
      { x: 0.2, y: 0.6, width: 0.2, height: 0.4 },
      { x: 0.4, y: 0.6, width: 0.2, height: 0.4 },
      { x: 0.6, y: 0.6, width: 0.4, height: 0.4 },
    ],
  },
  {
    id: "8-hero-supporting-grid",
    name: "Hero eight · supporting grid",
    photoCount: 8,
    cells: [
      { x: 0, y: 0, width: 0.58, height: 0.68 },
      { x: 0.58, y: 0, width: 0.21, height: 0.34 },
      { x: 0.79, y: 0, width: 0.21, height: 0.34 },
      { x: 0.58, y: 0.34, width: 0.21, height: 0.34 },
      { x: 0.79, y: 0.34, width: 0.21, height: 0.34 },
      { x: 0, y: 0.68, width: 1 / 3, height: 0.32 },
      { x: 1 / 3, y: 0.68, width: 1 / 3, height: 0.32 },
      { x: 2 / 3, y: 0.68, width: 1 / 3, height: 0.32 },
    ],
  },
  {
    id: "8-balanced-six-plus-two",
    name: "Eight · portrait grid",
    photoCount: 8,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 0.25 }, { x: 0.5, y: 0, width: 0.5, height: 0.25 },
      { x: 0, y: 0.25, width: 0.5, height: 0.25 }, { x: 0.5, y: 0.25, width: 0.5, height: 0.25 },
      { x: 0, y: 0.5, width: 0.5, height: 0.25 }, { x: 0.5, y: 0.5, width: 0.5, height: 0.25 },
      { x: 0, y: 0.75, width: 0.5, height: 0.25 }, { x: 0.5, y: 0.75, width: 0.5, height: 0.25 },
    ],
  },
  {
    id: "5-center-surround",
    name: "Center feature · surround",
    photoCount: 5,
    cells: [
      { x: 0.3, y: 0.19, width: 0.4, height: 0.62 },
      { x: 0, y: 0, width: 0.49, height: 0.18 },
      { x: 0.51, y: 0, width: 0.49, height: 0.18 },
      { x: 0, y: 0.82, width: 0.49, height: 0.18 },
      { x: 0.51, y: 0.82, width: 0.49, height: 0.18 },
    ],
  },
  {
    id: "6-dual-hero-strip",
    name: "Twin hero + strip",
    photoCount: 6,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 0.64 },
      { x: 0.5, y: 0, width: 0.5, height: 0.64 },
      { x: 0, y: 0.64, width: 0.25, height: 0.36 },
      { x: 0.25, y: 0.64, width: 0.25, height: 0.36 },
      { x: 0.5, y: 0.64, width: 0.25, height: 0.36 },
      { x: 0.75, y: 0.64, width: 0.25, height: 0.36 },
    ],
  },
  {
    id: "3-overlap-editorial",
    name: "Three · layered editorial",
    photoCount: 3,
    cells: [
      { x: 0.04, y: 0.08, width: 0.58, height: 0.7, zIndex: 0, rotation: -4, frameStyle: "card" },
      { x: 0.4, y: 0.12, width: 0.56, height: 0.7, zIndex: 1, rotation: 3, frameStyle: "card" },
      { x: 0.2, y: 0.6, width: 0.58, height: 0.32, zIndex: 2, rotation: -2, frameStyle: "polaroid" },
    ],
  },
  {
    id: "3-vertical-triptych",
    name: "Three · vertical triptych",
    photoCount: 3,
    cells: [
      { x: 0, y: 0, width: 1 / 3, height: 1 },
      { x: 1 / 3, y: 0, width: 1 / 3, height: 1 },
      { x: 2 / 3, y: 0, width: 1 / 3, height: 1 },
    ],
  },
  {
    id: "4-vertical-strips",
    name: "Four · vertical strips",
    photoCount: 4,
    cells: [
      { x: 0, y: 0, width: 0.25, height: 1 },
      { x: 0.25, y: 0, width: 0.25, height: 1 },
      { x: 0.5, y: 0, width: 0.25, height: 1 },
      { x: 0.75, y: 0, width: 0.25, height: 1 },
    ],
  },
  {
    id: "4-horizontal-strips",
    name: "Four · horizontal strips",
    photoCount: 4,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.25 },
      { x: 0, y: 0.25, width: 1, height: 0.25 },
      { x: 0, y: 0.5, width: 1, height: 0.25 },
      { x: 0, y: 0.75, width: 1, height: 0.25 },
    ],
  },
  {
    id: "4-full-bleed-insets",
    name: "Full-bleed + inset cards",
    photoCount: 4,
    cells: [
      { x: 0, y: 0, width: 1, height: 1, zIndex: 0, isBackground: true },
      { x: 0.06, y: 0.08, width: 0.37, height: 0.38, zIndex: 1, rotation: -3, frameStyle: "polaroid" },
      { x: 0.57, y: 0.12, width: 0.36, height: 0.36, zIndex: 2, rotation: 3, frameStyle: "card" },
      { x: 0.28, y: 0.56, width: 0.45, height: 0.36, zIndex: 3, rotation: -1, frameStyle: "polaroid" },
    ],
  },
  {
    id: "4-polaroid-cards",
    name: "Four · photo cards",
    photoCount: 4,
    cells: [
      { x: 0.05, y: 0.07, width: 0.42, height: 0.42, zIndex: 0, rotation: -2, frameStyle: "polaroid" },
      { x: 0.53, y: 0.07, width: 0.42, height: 0.42, zIndex: 1, rotation: 2, frameStyle: "polaroid" },
      { x: 0.05, y: 0.51, width: 0.42, height: 0.42, zIndex: 2, rotation: 2, frameStyle: "polaroid" },
      { x: 0.53, y: 0.51, width: 0.42, height: 0.42, zIndex: 3, rotation: -2, frameStyle: "polaroid" },
    ],
  },
  {
    id: "5-film-strip",
    name: "Five · film strip",
    photoCount: 5,
    cells: [
      { x: 0, y: 0.18, width: 0.2, height: 0.64 },
      { x: 0.2, y: 0.18, width: 0.2, height: 0.64 },
      { x: 0.4, y: 0.18, width: 0.2, height: 0.64 },
      { x: 0.6, y: 0.18, width: 0.2, height: 0.64 },
      { x: 0.8, y: 0.18, width: 0.2, height: 0.64 },
    ],
  },
  {
    id: "5-scrapbook-stack",
    name: "Five · scrapbook stack",
    photoCount: 5,
    cells: [
      { x: 0.04, y: 0.1, width: 0.48, height: 0.54, zIndex: 0, rotation: -5, frameStyle: "polaroid" },
      { x: 0.48, y: 0.06, width: 0.47, height: 0.52, zIndex: 1, rotation: 4, frameStyle: "polaroid" },
      { x: 0.25, y: 0.35, width: 0.5, height: 0.56, zIndex: 2, rotation: 2, frameStyle: "card" },
      { x: 0.02, y: 0.62, width: 0.32, height: 0.3, zIndex: 3, rotation: 3, frameStyle: "card" },
      { x: 0.68, y: 0.62, width: 0.3, height: 0.3, zIndex: 4, rotation: -4, frameStyle: "card" },
    ],
  },
  {
    id: "5-layered-photo-stack",
    name: "Five · layered photo stack",
    photoCount: 5,
    cells: [
      { x: 0.04, y: 0.05, width: 0.72, height: 0.72, zIndex: 0, rotation: -5, frameStyle: "card" },
      { x: 0.25, y: 0.09, width: 0.7, height: 0.72, zIndex: 1, rotation: 4, frameStyle: "card" },
      { x: 0.12, y: 0.24, width: 0.74, height: 0.7, zIndex: 2, rotation: -1, frameStyle: "card" },
      { x: 0.02, y: 0.66, width: 0.32, height: 0.28, zIndex: 3, rotation: 3, frameStyle: "polaroid" },
      { x: 0.66, y: 0.66, width: 0.32, height: 0.28, zIndex: 4, rotation: -3, frameStyle: "polaroid" },
    ],
  },
  {
    id: "6-editorial-panels",
    name: "Six · editorial panels",
    photoCount: 6,
    cells: [
      { x: 0, y: 0, width: 1 / 3, height: 1 },
      { x: 1 / 3, y: 0, width: 1 / 3, height: 0.58 },
      { x: 2 / 3, y: 0, width: 1 / 3, height: 0.58 },
      { x: 1 / 3, y: 0.58, width: 1 / 3, height: 0.42 },
      { x: 2 / 3, y: 0.58, width: 1 / 3, height: 0.42 },
      { x: 0.1, y: 0.72, width: 0.23, height: 0.28, zIndex: 2 },
    ],
  },
] satisfies LayoutDefinition[];

export interface EditorState {
  activeTool: EditorTool;
  photos: string[];
  layoutId: string | null;
  borderWidth: number;
  borderColor: string;
  spacing: number;
  backgroundColor: string;
}

export const EDITOR_TOOLS: { id: EditorTool; label: string; icon: string }[] = [
  { id: "photos", label: "Photos", icon: "📷" },
  { id: "layouts", label: "Layouts", icon: "⊞" },
  { id: "elements", label: "Elements", icon: "✦" },
  { id: "layers", label: "Layers", icon: "▤" },
  { id: "design", label: "Design", icon: "T" },
  { id: "style", label: "Style", icon: "◐" },
];
