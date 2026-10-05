import {
  type CarouselStoryLayoutDefinition,
  type CarouselStoryLayoutCategory,
  type CarouselStoryLayoutId,
  type CarouselStorySlideDefinition,
  type CarouselStoryTemplateDefinition,
  type CarouselStoryTextPlacement,
} from "@/types/editor";

const travelFormat = "portrait";

function text(
  role: CarouselStoryTextPlacement["role"],
  placement: Omit<CarouselStoryTextPlacement, "role">
): CarouselStoryTextPlacement {
  return { role, ...placement };
}

export const CAROUSEL_STORY_LAYOUTS = [
  {
    id: "full-bleed",
    name: "Full-bleed",
    category: "Featured",
    photoLayoutId: "1-full",
    formatId: travelFormat,
    backgroundColor: "#3b342e",
    elementZones: [{ x: 0.82, y: 0.06, width: 0.12, height: 0.12 }],
    textPlacements: [
      text("eyebrow", { x: 0.08, y: 0.68, width: 0.84, height: 0.06, fontSize: 24, fontFamily: "sans", fontWeight: 600, color: "#ffffff", textAlign: "left", lineHeight: 1.1, letterSpacing: 3, textShadow: "0 1px 8px rgba(0,0,0,.45)" }),
      text("title", { x: 0.08, y: 0.74, width: 0.84, height: 0.18, fontSize: 86, fontFamily: "serif", fontWeight: 500, color: "#ffffff", textAlign: "left", lineHeight: 0.98, letterSpacing: -1.5, textShadow: "0 2px 12px rgba(0,0,0,.45)" }),
      text("body", { x: 0.08, y: 0.91, width: 0.8, height: 0.07, fontSize: 34, fontFamily: "sans", fontWeight: 400, color: "#ffffff", textAlign: "left", lineHeight: 1.2, letterSpacing: 0, textShadow: "0 1px 8px rgba(0,0,0,.45)" }),
    ],
  },
  {
    id: "hero",
    name: "Hero Portrait",
    category: "Featured",
    photoLayoutId: "2-large-left",
    formatId: travelFormat,
    backgroundColor: "#eee7dc",
    elementZones: [{ x: 0.83, y: 0.06, width: 0.1, height: 0.1 }],
    textPlacements: [
      text("eyebrow", { x: 0.67, y: 0.2, width: 0.27, height: 0.1, fontSize: 20, fontFamily: "sans", fontWeight: 600, color: "#8d342d", textAlign: "left", lineHeight: 1.2, letterSpacing: 2 }),
      text("title", { x: 0.67, y: 0.3, width: 0.29, height: 0.38, fontSize: 68, fontFamily: "serif", fontWeight: 500, color: "#29251f", textAlign: "left", lineHeight: 0.98, letterSpacing: -1 }),
      text("body", { x: 0.67, y: 0.7, width: 0.28, height: 0.2, fontSize: 28, fontFamily: "sans", fontWeight: 400, color: "#514a41", textAlign: "left", lineHeight: 1.35, letterSpacing: 0 }),
    ],
  },
  {
    id: "split",
    name: "Editorial Diptych",
    category: "Editorial",
    photoLayoutId: "2-editorial-diptych",
    formatId: travelFormat,
    backgroundColor: "#e9e3d9",
    elementZones: [{ x: 0.82, y: 0.06, width: 0.1, height: 0.1 }],
    textPlacements: [
      text("eyebrow", { x: 0.54, y: 0.15, width: 0.38, height: 0.06, fontSize: 20, fontFamily: "sans", fontWeight: 600, color: "#9c3a32", textAlign: "left", lineHeight: 1.2, letterSpacing: 2 }),
      text("title", { x: 0.54, y: 0.22, width: 0.39, height: 0.28, fontSize: 62, fontFamily: "serif", fontWeight: 500, color: "#28251f", textAlign: "left", lineHeight: 1, letterSpacing: -1 }),
      text("body", { x: 0.54, y: 0.55, width: 0.39, height: 0.26, fontSize: 26, fontFamily: "sans", fontWeight: 400, color: "#514a41", textAlign: "left", lineHeight: 1.3, letterSpacing: 0 }),
    ],
  },
  {
    id: "two-photo",
    name: "Photo Pair",
    category: "Photo Dump",
    photoLayoutId: "2-horizontal",
    formatId: travelFormat,
    backgroundColor: "#f1ede5",
    elementZones: [{ x: 0.84, y: 0.06, width: 0.1, height: 0.1 }],
    textPlacements: [
      text("eyebrow", { x: 0.07, y: 0.04, width: 0.86, height: 0.05, fontSize: 18, fontFamily: "sans", fontWeight: 600, color: "#973a32", textAlign: "left", lineHeight: 1.15, letterSpacing: 2 }),
      text("title", { x: 0.07, y: 0.08, width: 0.86, height: 0.12, fontSize: 48, fontFamily: "serif", fontWeight: 500, color: "#29251f", textAlign: "left", lineHeight: 1, letterSpacing: -0.5 }),
      text("body", { x: 0.07, y: 0.86, width: 0.86, height: 0.1, fontSize: 24, fontFamily: "sans", fontWeight: 400, color: "#514a41", textAlign: "left", lineHeight: 1.3, letterSpacing: 0, backgroundColor: "#f1ede5" }),
    ],
  },
  {
    id: "three-photo",
    name: "Asymmetric Trio",
    category: "Photo Dump",
    photoLayoutId: "3-large-right",
    formatId: travelFormat,
    backgroundColor: "#eee9df",
    elementZones: [{ x: 0.83, y: 0.06, width: 0.1, height: 0.1 }],
    textPlacements: [
      text("eyebrow", { x: 0.65, y: 0.12, width: 0.29, height: 0.06, fontSize: 18, fontFamily: "sans", fontWeight: 600, color: "#96372f", textAlign: "left", lineHeight: 1.1, letterSpacing: 1.5 }),
      text("title", { x: 0.65, y: 0.2, width: 0.3, height: 0.3, fontSize: 48, fontFamily: "serif", fontWeight: 500, color: "#29251f", textAlign: "left", lineHeight: 1, letterSpacing: -0.5 }),
      text("body", { x: 0.65, y: 0.54, width: 0.3, height: 0.27, fontSize: 22, fontFamily: "sans", fontWeight: 400, color: "#514a41", textAlign: "left", lineHeight: 1.3, letterSpacing: 0 }),
    ],
  },
  {
    id: "editorial",
    name: "Editorial",
    category: "Editorial",
    photoLayoutId: "6-editorial-panels",
    formatId: travelFormat,
    backgroundColor: "#f2eee6",
    elementZones: [{ x: 0.84, y: 0.05, width: 0.1, height: 0.1 }],
    textPlacements: [
      text("eyebrow", { x: 0.06, y: 0.025, width: 0.4, height: 0.045, fontSize: 17, fontFamily: "sans", fontWeight: 600, color: "#96372f", textAlign: "left", lineHeight: 1.1, letterSpacing: 2 }),
      text("title", { x: 0.06, y: 0.07, width: 0.84, height: 0.11, fontSize: 48, fontFamily: "serif", fontWeight: 500, color: "#29251f", textAlign: "left", lineHeight: 1, letterSpacing: -0.5 }),
    ],
  },
  {
    id: "minimal",
    name: "Minimal",
    category: "Minimal",
    photoLayoutId: "1-gallery-card",
    formatId: travelFormat,
    backgroundColor: "#f7f4ed",
    elementZones: [{ x: 0.84, y: 0.05, width: 0.1, height: 0.1 }],
    textPlacements: [
      text("eyebrow", { x: 0.1, y: 0.035, width: 0.8, height: 0.05, fontSize: 18, fontFamily: "sans", fontWeight: 600, color: "#96372f", textAlign: "center", lineHeight: 1.1, letterSpacing: 2 }),
      text("title", { x: 0.1, y: 0.08, width: 0.8, height: 0.11, fontSize: 48, fontFamily: "serif", fontWeight: 500, color: "#29251f", textAlign: "center", lineHeight: 1, letterSpacing: -0.5 }),
      text("body", { x: 0.12, y: 0.9, width: 0.76, height: 0.06, fontSize: 22, fontFamily: "sans", fontWeight: 400, color: "#514a41", textAlign: "center", lineHeight: 1.2, letterSpacing: 0 }),
    ],
  },
  {
    id: "text-focus",
    name: "Quiet Caption",
    category: "Minimal",
    photoLayoutId: "1-wide",
    formatId: travelFormat,
    backgroundColor: "#f5f0e7",
    elementZones: [{ x: 0.83, y: 0.06, width: 0.1, height: 0.1 }],
    textPlacements: [
      text("eyebrow", { x: 0.08, y: 0.025, width: 0.84, height: 0.05, fontSize: 18, fontFamily: "sans", fontWeight: 600, color: "#96372f", textAlign: "left", lineHeight: 1.1, letterSpacing: 2 }),
      text("title", { x: 0.08, y: 0.08, width: 0.84, height: 0.12, fontSize: 48, fontFamily: "serif", fontWeight: 500, color: "#29251f", textAlign: "left", lineHeight: 1, letterSpacing: -0.5 }),
      text("body", { x: 0.08, y: 0.84, width: 0.84, height: 0.13, fontSize: 26, fontFamily: "sans", fontWeight: 400, color: "#514a41", textAlign: "left", lineHeight: 1.3, letterSpacing: 0 }),
    ],
  },
  {
    id: "detail",
    name: "Detail Study",
    category: "Editorial",
    photoLayoutId: "4-tall-feature-strip",
    formatId: travelFormat,
    backgroundColor: "#eee8dd",
    elementZones: [{ x: 0.83, y: 0.06, width: 0.1, height: 0.1 }],
    textPlacements: [
      text("eyebrow", { x: 0.04, y: 0.13, width: 0.3, height: 0.06, fontSize: 17, fontFamily: "sans", fontWeight: 600, color: "#96372f", textAlign: "left", lineHeight: 1.1, letterSpacing: 1.5 }),
      text("title", { x: 0.04, y: 0.21, width: 0.29, height: 0.3, fontSize: 43, fontFamily: "serif", fontWeight: 500, color: "#29251f", textAlign: "left", lineHeight: 0.98, letterSpacing: -0.5 }),
      text("body", { x: 0.04, y: 0.55, width: 0.29, height: 0.3, fontSize: 21, fontFamily: "sans", fontWeight: 400, color: "#514a41", textAlign: "left", lineHeight: 1.3, letterSpacing: 0 }),
    ],
  },
  {
    id: "quote",
    name: "Quote",
    category: "Cinematic",
    photoLayoutId: "1-full",
    formatId: travelFormat,
    backgroundColor: "#ddd4c6",
    elementZones: [{ x: 0.84, y: 0.06, width: 0.1, height: 0.1 }],
    textPlacements: [
      text("quote", { x: 0.1, y: 0.3, width: 0.8, height: 0.4, fontSize: 62, fontFamily: "serif", fontWeight: 500, color: "#29251f", textAlign: "center", lineHeight: 1.08, letterSpacing: -0.5, backgroundColor: "rgba(247,244,237,.92)", padding: 42 }),
      text("eyebrow", { x: 0.16, y: 0.73, width: 0.68, height: 0.08, fontSize: 20, fontFamily: "sans", fontWeight: 600, color: "#96372f", textAlign: "center", lineHeight: 1.1, letterSpacing: 1.5 }),
    ],
  },
  {
    id: "cta",
    name: "Closing Note",
    category: "Featured",
    photoLayoutId: "1-gallery-card",
    formatId: travelFormat,
    backgroundColor: "#f1ebe1",
    elementZones: [{ x: 0.84, y: 0.06, width: 0.1, height: 0.1 }],
    textPlacements: [
      text("eyebrow", { x: 0.13, y: 0.31, width: 0.74, height: 0.06, fontSize: 19, fontFamily: "sans", fontWeight: 600, color: "#96372f", textAlign: "center", lineHeight: 1.1, letterSpacing: 2 }),
      text("title", { x: 0.1, y: 0.39, width: 0.8, height: 0.24, fontSize: 60, fontFamily: "serif", fontWeight: 500, color: "#29251f", textAlign: "center", lineHeight: 1, letterSpacing: -0.5 }),
      text("cta", { x: 0.15, y: 0.68, width: 0.7, height: 0.1, fontSize: 26, fontFamily: "sans", fontWeight: 600, color: "#ffffff", textAlign: "center", lineHeight: 1.2, letterSpacing: 0, backgroundColor: "#a8322b", padding: 18 }),
    ],
  },
  {
    id: "magazine-cover",
    name: "Magazine Cover",
    category: "Editorial",
    photoLayoutId: "3-vertical-editorial",
    formatId: travelFormat,
    backgroundColor: "#29251f",
    elementZones: [{ x: 0.83, y: 0.06, width: 0.1, height: 0.1 }],
    textPlacements: [
      text("eyebrow", { x: 0.08, y: 0.1, width: 0.84, height: 0.06, fontSize: 19, fontFamily: "sans", fontWeight: 600, color: "#fffaf1", textAlign: "left", lineHeight: 1.1, letterSpacing: 2 }),
      text("title", { x: 0.08, y: 0.68, width: 0.84, height: 0.2, fontSize: 82, fontFamily: "serif", fontWeight: 500, color: "#fffaf1", textAlign: "left", lineHeight: 0.92, letterSpacing: -1.5, textShadow: "0 2px 12px rgba(0,0,0,.5)" }),
      text("body", { x: 0.08, y: 0.9, width: 0.76, height: 0.06, fontSize: 25, fontFamily: "sans", fontWeight: 400, color: "#fffaf1", textAlign: "left", lineHeight: 1.2, letterSpacing: 0, textShadow: "0 1px 8px rgba(0,0,0,.45)" }),
    ],
  },
  {
    id: "photo-dump",
    name: "Hero + Photo Dump",
    category: "Photo Dump",
    photoLayoutId: "8-hero-mosaic",
    formatId: travelFormat,
    backgroundColor: "#e9e3d9",
    elementZones: [{ x: 0.84, y: 0.05, width: 0.1, height: 0.1 }],
    textPlacements: [
      text("eyebrow", { x: 0.07, y: 0.035, width: 0.86, height: 0.045, fontSize: 17, fontFamily: "sans", fontWeight: 600, color: "#96372f", textAlign: "left", lineHeight: 1.1, letterSpacing: 2 }),
      text("title", { x: 0.07, y: 0.08, width: 0.86, height: 0.12, fontSize: 47, fontFamily: "serif", fontWeight: 500, color: "#29251f", textAlign: "left", lineHeight: 1, letterSpacing: -0.5 }),
    ],
  },
  {
    id: "scrapbook",
    name: "Scrapbook Stack",
    category: "Scrapbook",
    photoLayoutId: "5-scrapbook-stack",
    formatId: travelFormat,
    backgroundColor: "#e8dece",
    elementZones: [{ x: 0.84, y: 0.05, width: 0.1, height: 0.1 }],
    textPlacements: [
      text("eyebrow", { x: 0.08, y: 0.045, width: 0.82, height: 0.05, fontSize: 18, fontFamily: "sans", fontWeight: 600, color: "#83382f", textAlign: "left", lineHeight: 1.1, letterSpacing: 1.5 }),
      text("title", { x: 0.1, y: 0.78, width: 0.8, height: 0.13, fontSize: 47, fontFamily: "serif", fontWeight: 500, color: "#29251f", textAlign: "center", lineHeight: 1, letterSpacing: -0.5 }),
      text("metadata", { x: 0.68, y: 0.92, width: 0.22, height: 0.035, fontSize: 15, fontFamily: "sans", fontWeight: 500, color: "#62584c", textAlign: "right", lineHeight: 1, letterSpacing: 0.5 }),
    ],
  },
  {
    id: "contact-sheet",
    name: "Contact Sheet",
    category: "Photo Dump",
    photoLayoutId: "8-grid",
    formatId: travelFormat,
    backgroundColor: "#f6f3ec",
    elementZones: [{ x: 0.84, y: 0.05, width: 0.1, height: 0.1 }],
    textPlacements: [
      text("eyebrow", { x: 0.07, y: 0.035, width: 0.86, height: 0.045, fontSize: 17, fontFamily: "sans", fontWeight: 600, color: "#96372f", textAlign: "left", lineHeight: 1.1, letterSpacing: 2 }),
      text("title", { x: 0.07, y: 0.08, width: 0.86, height: 0.1, fontSize: 44, fontFamily: "serif", fontWeight: 500, color: "#29251f", textAlign: "left", lineHeight: 1, letterSpacing: -0.5 }),
      text("metadata", { x: 0.07, y: 0.91, width: 0.86, height: 0.04, fontSize: 15, fontFamily: "sans", fontWeight: 500, color: "#514a41", textAlign: "right", lineHeight: 1, letterSpacing: 1 }),
    ],
  },
  {
    id: "film-strip",
    name: "Film Strip",
    category: "Cinematic",
    photoLayoutId: "5-film-strip",
    formatId: travelFormat,
    backgroundColor: "#24231f",
    elementZones: [{ x: 0.84, y: 0.05, width: 0.1, height: 0.1 }],
    textPlacements: [
      text("eyebrow", { x: 0.08, y: 0.055, width: 0.84, height: 0.05, fontSize: 17, fontFamily: "sans", fontWeight: 600, color: "#e8dece", textAlign: "left", lineHeight: 1.1, letterSpacing: 2 }),
      text("title", { x: 0.08, y: 0.73, width: 0.84, height: 0.13, fontSize: 50, fontFamily: "serif", fontWeight: 500, color: "#fffaf1", textAlign: "left", lineHeight: 1, letterSpacing: -0.5 }),
      text("metadata", { x: 0.08, y: 0.89, width: 0.84, height: 0.04, fontSize: 15, fontFamily: "sans", fontWeight: 500, color: "#c9bda9", textAlign: "right", lineHeight: 1, letterSpacing: 1 }),
    ],
  },
  {
    id: "cinematic",
    name: "Cinematic Frame",
    category: "Cinematic",
    photoLayoutId: "6-cinema-strip",
    formatId: travelFormat,
    backgroundColor: "#201f1c",
    elementZones: [{ x: 0.84, y: 0.05, width: 0.1, height: 0.1 }],
    textPlacements: [
      text("eyebrow", { x: 0.08, y: 0.055, width: 0.84, height: 0.05, fontSize: 17, fontFamily: "sans", fontWeight: 600, color: "#f1eadd", textAlign: "left", lineHeight: 1.1, letterSpacing: 2 }),
      text("title", { x: 0.08, y: 0.79, width: 0.84, height: 0.12, fontSize: 48, fontFamily: "serif", fontWeight: 500, color: "#fffaf1", textAlign: "left", lineHeight: 1, letterSpacing: -0.5 }),
      text("metadata", { x: 0.68, y: 0.92, width: 0.24, height: 0.035, fontSize: 15, fontFamily: "sans", fontWeight: 500, color: "#c9bda9", textAlign: "right", lineHeight: 1, letterSpacing: 1 }),
    ],
  },
  {
    id: "travel-journal",
    name: "Travel Journal",
    category: "Travel",
    photoLayoutId: "5-editorial-cross",
    formatId: travelFormat,
    backgroundColor: "#eee7dc",
    elementZones: [{ x: 0.84, y: 0.05, width: 0.1, height: 0.1 }],
    textPlacements: [
      text("eyebrow", { x: 0.07, y: 0.045, width: 0.38, height: 0.045, fontSize: 17, fontFamily: "sans", fontWeight: 600, color: "#96372f", textAlign: "left", lineHeight: 1.1, letterSpacing: 1.5 }),
      text("title", { x: 0.07, y: 0.1, width: 0.42, height: 0.23, fontSize: 48, fontFamily: "serif", fontWeight: 500, color: "#29251f", textAlign: "left", lineHeight: 0.98, letterSpacing: -0.5 }),
      text("metadata", { x: 0.56, y: 0.91, width: 0.36, height: 0.04, fontSize: 15, fontFamily: "sans", fontWeight: 500, color: "#514a41", textAlign: "right", lineHeight: 1, letterSpacing: 1 }),
    ],
  },
  {
    id: "seamless",
    name: "Seamless Sequence",
    category: "Seamless",
    photoLayoutId: "4-horizontal-strips",
    formatId: travelFormat,
    backgroundColor: "#f3efe7",
    elementZones: [{ x: 0.84, y: 0.05, width: 0.1, height: 0.1 }],
    textPlacements: [
      text("eyebrow", { x: 0.07, y: 0.045, width: 0.86, height: 0.045, fontSize: 17, fontFamily: "sans", fontWeight: 600, color: "#96372f", textAlign: "left", lineHeight: 1.1, letterSpacing: 2 }),
      text("title", { x: 0.07, y: 0.1, width: 0.86, height: 0.12, fontSize: 46, fontFamily: "serif", fontWeight: 500, color: "#29251f", textAlign: "left", lineHeight: 1, letterSpacing: -0.5 }),
      text("metadata", { x: 0.74, y: 0.92, width: 0.18, height: 0.035, fontSize: 15, fontFamily: "sans", fontWeight: 500, color: "#514a41", textAlign: "right", lineHeight: 1, letterSpacing: 1 }),
    ],
  },
  {
    id: "fashion",
    name: "Fashion Story",
    category: "Featured",
    photoLayoutId: "3-overlap-editorial",
    formatId: travelFormat,
    backgroundColor: "#e8e4dc",
    elementZones: [{ x: 0.84, y: 0.05, width: 0.1, height: 0.1 }],
    textPlacements: [
      text("eyebrow", { x: 0.07, y: 0.05, width: 0.35, height: 0.05, fontSize: 17, fontFamily: "sans", fontWeight: 600, color: "#96372f", textAlign: "left", lineHeight: 1.1, letterSpacing: 2 }),
      text("title", { x: 0.07, y: 0.72, width: 0.86, height: 0.17, fontSize: 72, fontFamily: "serif", fontWeight: 500, color: "#29251f", textAlign: "left", lineHeight: 0.93, letterSpacing: -1.5 }),
      text("metadata", { x: 0.07, y: 0.91, width: 0.86, height: 0.04, fontSize: 15, fontFamily: "sans", fontWeight: 500, color: "#514a41", textAlign: "right", lineHeight: 1, letterSpacing: 1 }),
    ],
  },
] satisfies CarouselStoryLayoutDefinition[];

const layoutById = new Map(CAROUSEL_STORY_LAYOUTS.map((layout) => [layout.id, layout]));

function slide(
  id: string,
  type: CarouselStorySlideDefinition["type"],
  layoutId: CarouselStoryLayoutId,
  copy: Omit<CarouselStorySlideDefinition, "id" | "type" | "layoutId"> = {}
): CarouselStorySlideDefinition {
  return { id, type, layoutId, ...copy };
}

function template(
  id: string,
  category: CarouselStoryTemplateDefinition["category"],
  name: string,
  description: string,
  slides: CarouselStorySlideDefinition[],
  relatedCategories: CarouselStoryTemplateDefinition["relatedCategories"] = []
): CarouselStoryTemplateDefinition {
  return {
    id,
    category,
    relatedCategories,
    name,
    description,
    slides,
    overflowSlide: slide("more-details", "detail", "three-photo", {
      eyebrow: "THE SMALL THINGS",
      title: "A closer look",
      body: "Keep exploring the moments between the landmarks.",
    }),
  };
}

export const CAROUSEL_STORY_TEMPLATES = [
  template("journey", "Travel / Journey", "Journey", "A considered route from first glimpse to final memory.", [
    slide("cover", "cover", "full-bleed", { eyebrow: "FIELD NOTES · 01", title: "A journey worth taking", body: "A story told one moment at a time." }),
    slide("introduction", "introduction", "magazine-cover", { eyebrow: "THE BEGINNING", title: "Out of office", body: "A little room to wander, and nowhere urgent to be." }),
    slide("journey", "journey", "travel-journal", { eyebrow: "ON THE WAY", title: "The long way round", body: "The best turns rarely appear on the map." }),
    slide("detail", "detail", "detail", { eyebrow: "IN THE DETAILS", title: "Slow mornings", body: "Coffee, old stone, and the sound of the town waking up." }),
    slide("experience", "experience", "photo-dump", { eyebrow: "A MOMENT TO KEEP", title: "Somewhere in between", body: "The in-between moments became the whole point." }),
    slide("highlight", "highlight", "quote", { quote: "Take the road that lets you stay a little longer.", eyebrow: "A NOTE FROM THE ROAD" }),
    slide("ending", "ending", "cta", { eyebrow: "UNTIL NEXT TIME", title: "Keep a little room for wonder.", cta: "Save this journey" }),
  ], ["Story / Narrative"]),
  template("weekend-escape", "Travel / Journey", "Weekend Escape", "A short break with space for the details.", [
    slide("cover", "cover", "magazine-cover", { eyebrow: "48 HOURS AWAY", title: "A weekend escape", body: "A change of pace, close to home." }),
    slide("arrival", "introduction", "hero", { eyebrow: "CHECK IN", title: "Somewhere slower", body: "Leave the schedule light and the windows open." }),
    slide("wander", "journey", "seamless", { eyebrow: "THE AFTERNOON", title: "Take the scenic route", body: "A few turns with no particular destination." }),
    slide("stay", "detail", "travel-journal", { eyebrow: "A PLACE TO LAND", title: "Room to breathe", body: "The best part was having nowhere else to be." }),
    slide("memory", "highlight", "minimal", { eyebrow: "LITTLE THINGS", title: "The details stayed with me", body: "A weekend, held in a handful of frames." }),
    slide("ending", "ending", "cta", { eyebrow: "MAKE A LITTLE SPACE", title: "Your next escape is waiting.", cta: "Save for later" }),
  ], ["Minimal"]),
  template("mountain-adventure", "Travel / Journey", "Mountain Adventure", "An outdoors-led story with a strong visual climb.", [
    slide("cover", "cover", "full-bleed", { eyebrow: "ABOVE THE EVERYDAY", title: "Into the mountains", body: "A trail, a view, a day well spent." }),
    slide("preparation", "introduction", "text-focus", { eyebrow: "BEFORE SUNRISE", title: "Pack light. Start early.", body: "The first light makes every step feel possible." }),
    slide("trail", "journey", "split", { eyebrow: "THE CLIMB", title: "One step at a time", body: "The path opened slowly, then all at once." }),
    slide("summit", "highlight", "hero", { eyebrow: "THE HIGH POINT", title: "Worth the climb", body: "A view that made the quiet feel enormous." }),
    slide("details", "detail", "film-strip", { eyebrow: "ON THE TRAIL", title: "Small discoveries", body: "Wildflowers, weather, and the colour of the rock." }),
    slide("reflection", "quote", "cinematic", { quote: "Some views make you feel both smaller and more yourself.", eyebrow: "TRAIL NOTES" }),
    slide("ending", "ending", "cta", { eyebrow: "TAKE THE LONG WAY", title: "Find your own horizon.", cta: "Keep this route" }),
  ]),
  template("hidden-place", "Travel / Journey", "Hidden Place", "A reveal-first sequence for places worth finding.", [
    slide("cover", "cover", "minimal", { eyebrow: "A PLACE TO FIND", title: "Somewhere hidden", body: "A small guide to a quieter corner." }),
    slide("tease", "introduction", "text-focus", { eyebrow: "JUST OFF THE MAIN ROAD", title: "Look a little closer", body: "The entrance is easy to miss. That is part of the charm." }),
    slide("arrival", "journey", "hero", { eyebrow: "WHEN YOU ARRIVE", title: "A different kind of quiet", body: "The kind that settles in before you notice." }),
    slide("details", "detail", "detail", { eyebrow: "NOTICE THIS", title: "Made for lingering", body: "Find a seat, order something local, and stay a while." }),
    slide("reveal", "highlight", "photo-dump", { eyebrow: "THE PLACE ITSELF", title: "A little off the map", body: "Good places do not always need a sign." }),
    slide("ending", "ending", "cta", { eyebrow: "PASS IT ON GENTLY", title: "Keep this one close.", cta: "Save the place" }),
  ]),
  template("destination-guide", "Travel / Journey", "Destination Guide", "A practical mini-guide wrapped in an editorial photo story.", [
    slide("cover", "cover", "magazine-cover", { eyebrow: "A POCKET GUIDE", title: "A few days in Lisbon", body: "Places to pause, wander, and return to." }),
    slide("orientation", "introduction", "editorial", { eyebrow: "START HERE", title: "Find your own rhythm" }),
    slide("neighborhood", "journey", "travel-journal", { eyebrow: "THE NEIGHBOURHOOD", title: "Walk it slowly", body: "A good pair of shoes is the only plan you need." }),
    slide("food", "detail", "two-photo", { eyebrow: "FOR THE TABLE", title: "Order one more thing", body: "Look for the small rooms full of conversation." }),
    slide("stay", "experience", "photo-dump", { eyebrow: "A PLACE TO STAY", title: "Choose a good window", body: "A view of ordinary life beats a perfect itinerary." }),
    slide("tip", "tip", "seamless", { eyebrow: "A LOCAL NOTE", title: "Leave an afternoon open", body: "The best recommendation may come from the next table." }),
    slide("ending", "ending", "cta", { eyebrow: "MAKE IT YOURS", title: "There is always another street.", cta: "Save this guide" }),
  ]),
  template("travel-diary", "Story / Narrative", "Travel Diary", "An intimate, handwritten-feeling record of the trip.", [
    slide("cover", "cover", "minimal", { eyebrow: "TRAVEL DIARY · 04", title: "Notes from away", body: "Collected in no particular order." }),
    slide("first-note", "introduction", "scrapbook", { eyebrow: "DAY ONE", title: "We took the early train", body: "The window kept framing places we had not planned to see." }),
    slide("walking", "journey", "travel-journal", { eyebrow: "ON FOOT", title: "A day without directions", body: "Every wrong turn gave us somewhere new to stop." }),
    slide("table", "experience", "detail", { eyebrow: "AT THE TABLE", title: "One more cup", body: "The afternoon stretched until the light changed." }),
    slide("keepsake", "highlight", "quote", { quote: "I want to remember how unhurried it felt.", eyebrow: "FROM THE NOTEBOOK" }),
    slide("ending", "ending", "cta", { eyebrow: "END OF THIS ENTRY", title: "More notes soon.", cta: "Keep the diary" }),
  ], ["Travel / Journey", "Minimal"]),
  template("minimal-gallery", "Minimal", "Minimal Gallery", "Quiet layouts that let the photographs lead.", [
    slide("cover", "cover", "minimal", { eyebrow: "SELECTED FRAMES", title: "A study in stillness", body: "A small collection of light and form." }),
    slide("frame-one", "gallery", "full-bleed", { eyebrow: "FRAME 01", title: "Late light" }),
    slide("pair", "gallery", "film-strip", { eyebrow: "FRAMES 02—03", title: "Shapes of the afternoon" }),
    slide("frame-four", "gallery", "contact-sheet", { eyebrow: "FRAME 04", title: "After the rain" }),
    slide("notes", "quote", "quote", { quote: "A photograph is a pause you can return to.", eyebrow: "ON LOOKING" }),
    slide("ending", "ending", "cta", { eyebrow: "END OF SELECTION", title: "Keep looking closely.", cta: "Save the gallery" }),
  ], ["Photography"]),
  template("cinematic", "Photography", "Cinematic", "A filmic rhythm of wide moments, details, and pauses.", [
    slide("cover", "cover", "cinematic", { eyebrow: "A SHORT FILM IN FRAMES", title: "Somewhere, slowly", body: "A visual story in six scenes." }),
    slide("opening", "introduction", "text-focus", { eyebrow: "SCENE 01", title: "The light was different here", body: "Everything seemed to move at half speed." }),
    slide("movement", "journey", "film-strip", { eyebrow: "SCENE 02", title: "A little movement", body: "A train window, a turning road, the world passing by." }),
    slide("details", "detail", "photo-dump", { eyebrow: "SCENE 03", title: "Cut to the details", body: "The story was hiding in the edges." }),
    slide("still", "highlight", "quote", { quote: "Stay with the frame a moment longer.", eyebrow: "SCENE 04" }),
    slide("ending", "ending", "cta", { eyebrow: "FADE OUT", title: "The rest is yours to imagine.", cta: "Save this film diary" }),
  ]),
  template("photography-editorial", "Photography", "Editorial", "A magazine-like sequence for a considered photo essay.", [
    slide("cover", "cover", "magazine-cover", { eyebrow: "PHOTO ESSAY · 01", title: "The shape of a place", body: "A closer look at the everyday." }),
    slide("opening", "introduction", "editorial", { eyebrow: "AN OBSERVATION", title: "Light finds a way in" }),
    slide("study", "gallery", "contact-sheet", { eyebrow: "A STUDY IN TEXTURE", title: "Stone, shadow, time", body: "Three small things that tell the larger story." }),
    slide("portrait", "experience", "fashion", { eyebrow: "IN CONTEXT", title: "Lives around the corner", body: "The people are what make a place feel like itself." }),
    slide("caption", "quote", "quote", { quote: "Look long enough and the ordinary begins to open.", eyebrow: "FIELD NOTE" }),
    slide("ending", "ending", "cta", { eyebrow: "END OF ESSAY", title: "What did you notice?", cta: "Save this story" }),
  ], ["Minimal"]),
  template("film-diary", "Minimal", "Film Diary", "Warm, tactile pacing for analogue-looking frames.", [
    slide("cover", "cover", "minimal", { eyebrow: "ROLL 07 · 36 EXPOSURES", title: "A film diary", body: "The frames I almost forgot I made." }),
    slide("first-light", "introduction", "full-bleed", { eyebrow: "01 / 36", title: "First light" }),
    slide("day", "journey", "film-strip", { eyebrow: "12 / 36", title: "An unplanned afternoon", body: "Soft focus, familiar streets." }),
    slide("close-up", "detail", "detail", { eyebrow: "21 / 36", title: "Things left in the frame", body: "A little grain, a lot of feeling." }),
    slide("last-frame", "highlight", "text-focus", { eyebrow: "36 / 36", title: "The last frame", body: "A reminder to bring another roll." }),
    slide("ending", "ending", "cta", { eyebrow: "END OF ROLL", title: "Keep the imperfect ones.", cta: "Save this diary" }),
  ], ["Photography", "Story / Narrative"]),
  template("photo-story", "Story / Narrative", "Photo Story", "A beginning, a detail, and a moment to remember.", [
    slide("cover", "cover", "full-bleed", { eyebrow: "A PHOTO STORY", title: "A day that stayed", body: "Told in the moments around it." }),
    slide("beginning", "introduction", "hero", { eyebrow: "THE SETTING", title: "Before anything happened", body: "The air held that just-before feeling." }),
    slide("sequence", "journey", "seamless", { eyebrow: "THE SEQUENCE", title: "Then the day unfolded" }),
    slide("details", "detail", "scrapbook", { eyebrow: "LOOK CLOSER", title: "Small things, kept", body: "The details are how memory finds its way back." }),
    slide("moment", "highlight", "quote", { quote: "Some days do not need a reason to be remembered.", eyebrow: "A NOTE TO SELF" }),
    slide("ending", "ending", "cta", { eyebrow: "THE END, FOR NOW", title: "Tell it your way.", cta: "Save this story" }),
  ], ["Photography"]),
  template("top-five", "List / Tips", "Top 5", "A clean countdown that gives every pick its own moment.", [
    slide("cover", "cover", "fashion", { eyebrow: "A SHORTLIST", title: "Five places I keep thinking about", body: "In no particular order—except the last one." }),
    slide("intro", "introduction", "text-focus", { eyebrow: "THE LIST", title: "Five worth the detour", body: "Save a few for the next time you are nearby." }),
    slide("pick-one", "list", "detail", { eyebrow: "05 / THE QUIET ONE", title: "A slower morning", body: "Good coffee and no reason to rush." }),
    slide("pick-two", "list", "two-photo", { eyebrow: "04 / THE VIEW", title: "Look up", body: "A corner that changes the whole walk." }),
    slide("pick-three", "list", "photo-dump", { eyebrow: "03 / THE TABLE", title: "Order for the middle", body: "The dishes everyone reaches for first." }),
    slide("pick-four", "list", "split", { eyebrow: "02 / THE STAY", title: "A room with a story", body: "The kind of place you remember by its windows." }),
    slide("ending", "ending", "cta", { eyebrow: "01 / YOUR TURN", title: "What would make your five?", cta: "Save this list" }),
  ], ["Creator"]),
  template("tips", "List / Tips", "Tips", "Useful, easy-to-scan advice with room for examples.", [
    slide("cover", "cover", "minimal", { eyebrow: "A FEW THOUGHTS", title: "Little things that help", body: "Five practical notes from doing it the long way." }),
    slide("setup", "introduction", "text-focus", { eyebrow: "FIRST", title: "Start with what you have", body: "A small beginning is still a beginning." }),
    slide("tip-one", "tip", "detail", { eyebrow: "01 / MAKE SPACE", title: "Leave room to notice", body: "A lighter plan gives good surprises somewhere to land." }),
    slide("tip-two", "tip", "two-photo", { eyebrow: "02 / KEEP IT SIMPLE", title: "Choose one good thing", body: "Let the rest of the frame breathe." }),
    slide("tip-three", "tip", "contact-sheet", { eyebrow: "03 / LOOK AGAIN", title: "Details tell the story", body: "Photograph the edges, not only the headline." }),
    slide("tip-four", "tip", "quote", { quote: "Make it useful, then make it yours.", eyebrow: "04 / A FINAL NOTE" }),
    slide("ending", "ending", "cta", { eyebrow: "PASS IT ALONG", title: "Which one will you try?", cta: "Save these tips" }),
  ], ["Creator"]),
  template("things-i-learned", "Story / Narrative", "Things I Learned", "An honest, reflective structure with room to breathe.", [
    slide("cover", "cover", "full-bleed", { eyebrow: "A PERSONAL NOTE", title: "Things I learned slowly", body: "A few thoughts I wish I had heard sooner." }),
    slide("beginning", "introduction", "text-focus", { eyebrow: "LOOKING BACK", title: "It rarely happens all at once", body: "Most of the change was made in small, ordinary steps." }),
    slide("lesson-one", "list", "cinematic", { quote: "You can begin before you feel ready.", eyebrow: "01 / BEGIN ANYWAY" }),
    slide("lesson-two", "list", "detail", { eyebrow: "02 / KEEP WHAT WORKS", title: "Make the process smaller", body: "A repeatable step beats a perfect plan." }),
    slide("lesson-three", "list", "fashion", { eyebrow: "03 / PAY ATTENTION", title: "Notice your own pace", body: "There is no prize for making it harder than it needs to be." }),
    slide("reflection", "highlight", "minimal", { eyebrow: "A LAST THOUGHT", title: "The lesson is still unfolding", body: "Take what helps and leave the rest." }),
    slide("ending", "ending", "cta", { eyebrow: "YOUR TURN", title: "What have you learned lately?", cta: "Keep this note" }),
  ], ["Creator", "List / Tips"]),
  template("before-after", "Creator", "Before / After", "A clear visual comparison with context and a takeaway.", [
    slide("cover", "cover", "minimal", { eyebrow: "A SMALL TRANSFORMATION", title: "Before & after", body: "What changed when I tried a different way." }),
    slide("before", "before-after", "split", { eyebrow: "BEFORE", title: "The starting point", body: "What was not working yet." }),
    slide("in-between", "journey", "text-focus", { eyebrow: "THE PROCESS", title: "A few thoughtful changes", body: "Less rushing, clearer choices, and one step at a time." }),
    slide("after", "highlight", "split", { eyebrow: "AFTER", title: "A more considered result", body: "Still a work in progress—and that is the point." }),
    slide("ending", "ending", "cta", { eyebrow: "SHARE YOUR PROCESS", title: "Progress has many versions.", cta: "Save this reminder" }),
  ], ["Story / Narrative"]),
  template("list-story", "List / Tips", "List Story", "A flexible listicle structure for thoughtful recommendations.", [
    slide("cover", "cover", "magazine-cover", { eyebrow: "A SHORT LIST", title: "Things worth making time for", body: "A few favourites, collected along the way." }),
    slide("intro", "introduction", "editorial", { eyebrow: "FIVE LITTLE REMINDERS", title: "Keep the good things close" }),
    slide("item-one", "list", "detail", { eyebrow: "01 / GO OUTSIDE", title: "A longer walk", body: "Take the route with the trees." }),
    slide("item-two", "list", "scrapbook", { eyebrow: "02 / MAKE SOMETHING", title: "Use your hands", body: "A small project is enough." }),
    slide("item-three", "list", "photo-dump", { eyebrow: "03 / NOTICE", title: "Keep a little record", body: "A photograph, a sentence, anything true." }),
    slide("ending", "ending", "cta", { eyebrow: "ADD YOUR OWN", title: "What belongs on your list?", cta: "Save this for later" }),
  ], ["Creator"]),
] satisfies CarouselStoryTemplateDefinition[];

export function getCarouselStoryLayout(id: CarouselStoryLayoutId) {
  return layoutById.get(id);
}

export function constrainCarouselTextPlacement<T extends CarouselStoryTextPlacement>(placement: T): T {
  const maxSize = 1;
  const width = Math.min(maxSize, Math.max(0.02, placement.width));
  const height = Math.min(maxSize, Math.max(0.02, placement.height));
  return {
    ...placement,
    width,
    height,
    x: Math.max(0, Math.min(1, placement.x)),
    y: Math.max(0, Math.min(1, placement.y)),
  };
}

export function getCarouselStoryTemplate(id: string) {
  return CAROUSEL_STORY_TEMPLATES.find((templateItem) => templateItem.id === id);
}
