import type { TablerIcon } from "@tabler/icons-react";
import {
  IconArrowRight,
  IconBalloon,
  IconCircle,
  IconConfetti,
  IconHeart,
  IconPlane,
  IconSparkles,
  IconStar,
} from "@tabler/icons-react";
import type { ElementAsset, ElementCategory } from "@/types/editor";

export interface CatalogElement extends ElementAsset {
  icon?: TablerIcon;
}

// Package icons remain useful for quick symbols; doodle artwork itself is served locally.
export const ELEMENT_CATALOG: CatalogElement[] = [
  { id: "tabler-heart", name: "Heart icon", category: "hearts", type: "icon", format: "svg", src: "tabler:heart", supportsColor: true, tags: ["love", "romance"], icon: IconHeart },
  { id: "tabler-star", name: "Star icon", category: "stars", type: "icon", format: "svg", src: "tabler:star", supportsColor: true, tags: ["shine", "favorite"], icon: IconStar },
  { id: "tabler-sparkles", name: "Sparkles icon", category: "sparkles", type: "icon", format: "svg", src: "tabler:sparkles", supportsColor: true, tags: ["shine", "magic"], icon: IconSparkles },
  { id: "tabler-arrow", name: "Arrow icon", category: "arrows", type: "icon", format: "svg", src: "tabler:arrow-right", supportsColor: true, tags: ["direction"], icon: IconArrowRight },
  { id: "tabler-circle", name: "Circle icon", category: "shapes", type: "shape", format: "svg", src: "tabler:circle", supportsColor: true, tags: ["round", "shape"], icon: IconCircle },
  { id: "tabler-plane", name: "Airplane", category: "travel", type: "icon", format: "svg", src: "tabler:plane", supportsColor: true, tags: ["travel", "trip"], icon: IconPlane },
  { id: "tabler-confetti", name: "Confetti icon", category: "celebration", type: "icon", format: "svg", src: "tabler:confetti", supportsColor: true, tags: ["party", "celebrate"], icon: IconConfetti },
  { id: "tabler-balloon", name: "Balloon", category: "celebration", type: "icon", format: "svg", src: "tabler:balloon", supportsColor: true, tags: ["party", "birthday"], icon: IconBalloon },
  { id: "doodle-flower", name: "Hand-drawn flower", category: "custom", type: "doodle", format: "svg", src: "/assets/elements/doodles/custom/flower.svg", supportsColor: false, tags: ["flower", "nature", "custom", "ai"] },

  doodle("arrow-hand", "Hand-drawn arrow", "arrows", "arrows/hand-arrow.svg", ["pointer", "direction"]),
  doodle("arrow-curved", "Curved arrow", "arrows", "arrows/curved-arrow.svg", ["pointer", "direction"]),
  doodle("arrow-double", "Double arrow", "arrows", "arrows/double-arrow.svg", ["direction", "two-way"]),
  doodle("heart-outline", "Outline heart", "hearts", "hearts/outline-heart.svg", ["love", "romance"]),
  doodle("heart-filled", "Filled heart", "hearts", "hearts/filled-heart.svg", ["love", "romance"]),
  doodle("heart-hand", "Scribbled heart", "hearts", "hearts/scribbled-heart.svg", ["love", "hand drawn"]),
  doodle("star-simple", "Simple star", "stars", "stars/simple-star.svg", ["shine"]),
  doodle("star-four-point", "Four-point sparkle", "stars", "stars/four-point-sparkle.svg", ["sparkle", "shine"]),
  doodle("star-twinkle", "Twinkle", "stars", "stars/twinkle.svg", ["sparkle", "shine"]),
  doodle("flower-daisy", "Daisy", "flowers", "flowers/daisy.svg", ["flower", "nature"]),
  doodle("flower-small", "Small flower", "flowers", "flowers/small-flower.svg", ["flower", "nature"]),
  doodle("circle-hand", "Hand-drawn circle", "circles", "circles/hand-circle.svg", ["ring", "outline"]),
  doodle("circle-loose", "Loose highlight ring", "circles", "circles/loose-ring.svg", ["ring", "highlight"]),
  doodle("highlight-underline", "Marker underline", "highlights", "highlights/marker-underline.svg", ["marker", "underline"], false),
  doodle("highlight-swipe", "Marker swipe", "highlights", "highlights/marker-swipe.svg", ["marker", "highlight"], false),
  doodle("scribble-short", "Short scribble", "scribbles", "scribbles/short-scribble.svg", ["sketch", "mark"]),
  doodle("scribble-loop", "Loop scribble", "scribbles", "scribbles/loop-scribble.svg", ["sketch", "mark"]),
  doodle("line-hand", "Hand-drawn line", "lines", "lines/hand-line.svg", ["underline", "stroke"]),
  doodle("line-curved", "Curved line", "lines", "lines/curved-line.svg", ["stroke"]),
  doodle("line-dotted", "Dotted line", "lines", "lines/dotted-line.svg", ["dots", "stroke"]),
  doodle("shape-square", "Hand-drawn square", "shapes", "shapes/hand-square.svg", ["frame", "outline"]),
  doodle("shape-circle", "Circle outline", "shapes", "shapes/circle-outline.svg", ["round", "outline"]),
  doodle("shape-blob", "Organic blob", "shapes", "shapes/organic-blob.svg", ["organic", "shape"]),
];

export const ELEMENT_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "icons", label: "Icons" },
  { id: "doodles", label: "Doodles" },
  { id: "arrows", label: "Arrows" },
  { id: "hearts", label: "Hearts" },
  { id: "stars", label: "Stars" },
  { id: "flowers", label: "Flowers" },
  { id: "circles", label: "Circles" },
  { id: "highlights", label: "Highlights" },
  { id: "scribbles", label: "Scribbles" },
  { id: "lines", label: "Lines" },
  { id: "shapes", label: "Shapes" },
  { id: "custom", label: "Custom" },
  { id: "travel", label: "Travel" },
  { id: "celebration", label: "Celebration" },
] as const;

export type ElementCategoryFilter = (typeof ELEMENT_CATEGORIES)[number]["id"];

function doodle(
  id: string,
  name: string,
  category: ElementCategory,
  fileName: string,
  tags: string[],
  supportsColor = true
): CatalogElement {
  return {
    id,
    name,
    category,
    type: "doodle",
    format: "svg",
    src: `/assets/elements/doodles/${fileName}`,
    supportsColor,
    tags,
  };
}

export function getCatalogElement(id: string) {
  return ELEMENT_CATALOG.find((asset) => asset.id === id);
}

export function isIconAsset(asset: CatalogElement): asset is CatalogElement & { icon: TablerIcon } {
  return asset.icon !== undefined;
}
