"use client";

import { resolveCreativeLayout } from "./carousel-composition";

import { useMemo, useState } from "react";
import {
  COLLAGE_LAYOUTS,
  DEFAULT_COLLAGE_STYLE,
  type CarouselSlide,
  type CarouselStoryCategory,
  type CarouselStoryTemplateDefinition,
  type CollageStyle,
  type Photo,
} from "@/types/editor";
import { useDialogFocus } from "./use-dialog-focus";
import { getCarouselTheme, themeCarouselSlide } from "./carousel-themes";
import { getCarouselSlideRole } from "./carousel-workspace";
import { CarouselSlideArtwork } from "./carousel-slide-artwork";
import {
  CAROUSEL_STORY_LAYOUTS,
  CAROUSEL_STORY_TEMPLATES,
  constrainCarouselTextPlacement,
} from "./carousel-story-templates";

const TEMPLATE_CATEGORIES: CarouselStoryCategory[] = [
  "Travel / Journey",
  "Photography",
  "Creator",
  "Story / Narrative",
  "List / Tips",
  "Minimal",
];

function categoryTabId(category: CarouselStoryCategory) {
  return `story-category-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

interface CarouselTemplatePickerProps {
  open: boolean;
  previewPhotos: Photo[];
  previewStyle: CollageStyle;
  onClose: () => void;
  onApply: (templateId: string) => void;
  hasExistingStory: boolean;
}

export function CarouselTemplatePicker({ open, previewPhotos, previewStyle, onClose, onApply, hasExistingStory }: CarouselTemplatePickerProps) {
  const [category, setCategory] = useState<CarouselStoryCategory>("Story / Narrative");
  const [selectedTemplateId, setSelectedTemplateId] = useState("editorial-story");
  const templates = useMemo(
    () => CAROUSEL_STORY_TEMPLATES.filter((templateItem) =>
      templateItem.category === category || templateItem.relatedCategories?.includes(category)
    ),
    [category]
  );
  const selectedTemplate = CAROUSEL_STORY_TEMPLATES.find((item) => item.id === selectedTemplateId);

  const dialogRef = useDialogFocus(open, onClose);
  if (!open) return null;

  const applyTemplate = () => {
    if (!selectedTemplate) return;
    onApply(selectedTemplate.id);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-brand-ink/45 p-0 backdrop-blur-[1px] md:items-center md:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="carousel-template-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-brand-border bg-brand-paper shadow-lg md:rounded-lg"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-brand-border px-5 py-4 sm:px-7 sm:py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-accent-hover">Redwell Story Studio</p>
            <h2 id="carousel-template-title" className="mt-1 font-sans text-2xl tracking-tight text-brand-ink sm:text-3xl">
              Start with a story
            </h2>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-brand-muted sm:text-sm">
              Start with a hook, carry the idea through, and give the story a proper ending. Every slide stays editable.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close story templates"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-lg text-brand-muted transition-colors hover:bg-brand-neutral hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
          >
            ×
          </button>
        </header>

        <div className="shrink-0 px-5 pt-3 sm:px-7">
          <nav role="tablist" aria-label="Template categories" className="flex flex-wrap gap-1 border-b border-brand-border">
            {TEMPLATE_CATEGORIES.map((item) => (
              <button
                key={item}
                id={categoryTabId(item)}
                type="button"
                role="tab"
                aria-selected={category === item}
                onClick={() => {
                  setCategory(item);
                  const firstTemplate = CAROUSEL_STORY_TEMPLATES.find((templateItem) =>
                    templateItem.category === item || templateItem.relatedCategories?.includes(item)
                  );
                  if (firstTemplate) setSelectedTemplateId(firstTemplate.id);
                }}
                className={`relative px-2.5 py-2.5 text-[11px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent sm:px-3 sm:text-xs ${
                  category === item ? "text-brand-accent-hover" : "text-brand-muted hover:text-brand-ink"
                }`}
              >
                {item}
                {category === item && <span className="absolute inset-x-2 -bottom-px h-0.5 bg-brand-accent sm:inset-x-3" />}
              </button>
            ))}
          </nav>
        </div>

        <div
          role="tabpanel"
          aria-labelledby={categoryTabId(category)}
          className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-7 sm:py-5"
        >
          {selectedTemplate && <div className="mb-5 border-b border-brand-border pb-4"><h3 className="mb-3 text-sm font-semibold">{selectedTemplate.name} · The complete sequence</h3><TemplatePreview template={selectedTemplate} previewPhotos={previewPhotos} previewStyle={previewStyle} complete /></div>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((templateItem) => (
              <TemplateCard
                key={templateItem.id}
                template={templateItem}
                previewPhotos={previewPhotos}
                previewStyle={previewStyle}
                selected={templateItem.id === selectedTemplateId}
                onSelect={() => setSelectedTemplateId(templateItem.id)}
              />
            ))}
          </div>
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-brand-border bg-brand-surface/80 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="max-w-xl text-[11px] leading-relaxed text-brand-muted sm:text-xs">
            {hasExistingStory ? "Applying a template rebuilds the slide sequence and replaces its copy and styling. Photos and elements carry forward. Undo restores your previous story." : "Choose a complete story structure, then edit the copy, photos, and composition of each slide."}
          </p>
          <div className="flex shrink-0 items-center justify-end gap-2">
            <span className="mr-1 hidden text-xs text-brand-muted sm:inline">
              {selectedTemplate ? `${selectedTemplate.slides.length} slides` : ""}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg px-3 text-xs font-medium text-brand-muted transition-colors hover:bg-brand-neutral focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedTemplate}
              onClick={applyTemplate}
              className="h-9 rounded-lg bg-brand-accent px-4 text-xs font-semibold text-white transition-colors hover:bg-brand-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-brand-border"
            >
              {hasExistingStory ? "Replace story" : "Use template"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function TemplateCard({
  template,
  previewPhotos,
  previewStyle,
  selected,
  onSelect,
}: {
  template: CarouselStoryTemplateDefinition;
  previewPhotos: Photo[];
  previewStyle: CollageStyle;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`group flex min-w-0 flex-col rounded-lg border bg-brand-surface p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${
        selected ? "border-brand-accent ring-1 ring-brand-accent" : "border-brand-border hover:border-brand-muted/50"
      }`}
    >
      <TemplatePreview template={template} previewPhotos={previewPhotos} previewStyle={previewStyle} />
      <span className="mt-2 flex w-full items-baseline justify-between gap-2">
        <span className="font-sans text-base text-brand-ink">{template.name}</span>
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.12em] text-brand-muted/70">
          {template.slides.length} slides
        </span>
      </span>
      <span className="mt-1 text-[11px] leading-relaxed text-brand-muted">{template.description}</span>
      <span className={`mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${selected ? "text-brand-accent-hover" : "text-brand-muted/70 group-hover:text-brand-muted"}`}>
        {selected ? "Selected" : template.category}
      </span>
    </button>
  );
}

function TemplatePreview({
  template,
  previewPhotos,
  previewStyle,
  complete = false,
}: {
  template: CarouselStoryTemplateDefinition;
  previewPhotos: Photo[];
  previewStyle: CollageStyle;
  complete?: boolean;
}) {
  const previewSlides = complete ? template.slides : template.slides.slice(0, 3);
  let photoOffset = 0;

  return (
    <div aria-hidden="true" className={`flex min-h-[112px] items-start gap-2 py-2 ${complete ? "overflow-x-auto" : "justify-center overflow-hidden border-b border-brand-border"}`}>
      {previewSlides.map((storySlide, index) => {
        const storyLayout = CAROUSEL_STORY_LAYOUTS.find((candidate) => candidate.id === storySlide.layoutId);
        const photoLayout = resolveCreativeLayout(storyLayout?.photoLayoutId);
        if (!storyLayout || !photoLayout) return null;
        const slidePhotos = previewPhotos.slice(photoOffset, photoOffset + photoLayout.cells.length).map((photo, index) => ({ ...photo, layerOrder: index }));
        photoOffset += slidePhotos.length;
        const previewState: CarouselSlide = {
          id: `template-preview-${template.id}-${index}`,
          order: index,
          photos: slidePhotos,
          slotAssignments: Object.fromEntries(
            slidePhotos.map((photo, photoIndex) => [photoIndex, photo.id])
          ),
          canvasFormatId: storyLayout.formatId,
          selectedLayoutId: storyLayout.photoLayoutId,
          elements: [],
          collageStyle: { ...DEFAULT_COLLAGE_STYLE, ...previewStyle, backgroundColor: storyLayout.backgroundColor },
          storyLayoutId: storyLayout.id,
          storySlideType: storySlide.type,
          storyText: storyLayout.textPlacements.flatMap((placement, placementIndex) => {
            const text = storySlide[placement.role];
            if (!text?.trim()) return [];
            return [{
              ...constrainCarouselTextPlacement(placement),
              id: `template-preview-${template.id}-${index}-${placementIndex}`,
              text, textBox: true,
            }];
          }),
        };

        return (
          <div
            key={storySlide.id}
            className="relative shrink-0"
          >
            <CarouselSlideArtwork
              slide={themeCarouselSlide(previewState, getCarouselTheme(template.themeId ?? "redwell")!, true)}
              maxWidth={complete ? 92 : 60}
              maxHeight={complete ? 115 : 75}
              className="rounded-none shadow-none"
            />
            {complete && <span className="mt-1 block text-[10px] text-brand-muted">{index + 1} · {getCarouselSlideRole(storySlide.type)}</span>}
          </div>
        );
      })}
      {template.slides.length > previewSlides.length && (
        <span className="pb-2 text-[9px] font-medium tracking-wide text-brand-muted/70">+{template.slides.length - previewSlides.length}</span>
      )}
    </div>
  );
}
