"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import {
  type CarouselSlide,
  type CarouselState,
  type CarouselStorySlideType,
} from "@/types/editor";
import { CarouselSlideArtwork } from "./carousel-slide-artwork";

interface CarouselControlsProps {
  carousel: CarouselState;
  onSelect: (slideId: string) => void;
  onAdd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onPreview: () => void;
}

export function CarouselNavigation({
  carousel,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onPreview,
}: CarouselControlsProps) {
  const slides = [...carousel.slides].sort((first, second) => first.order - second.order);
  const activeIndex = slides.findIndex((slide) => slide.id === carousel.activeSlideId);
  const activeSlide = slides[activeIndex];

  if (!activeSlide) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-lg border border-brand-border bg-brand-paper px-2 py-1.5">
      <button
        type="button"
        aria-label="Previous slide"
        disabled={activeIndex <= 0}
        onClick={() => onSelect(slides[activeIndex - 1].id)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-lg leading-none text-brand-muted transition-colors hover:bg-brand-neutral focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500 disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent"
      >
        ‹
      </button>
      <span aria-live="polite" className="min-w-[5.4rem] text-center text-xs font-semibold text-brand-ink">
        Slide {activeIndex + 1} / {slides.length}
      </span>
      <button
        type="button"
        aria-label="Next slide"
        disabled={activeIndex < 0 || activeIndex >= slides.length - 1}
        onClick={() => onSelect(slides[activeIndex + 1].id)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-lg leading-none text-brand-muted transition-colors hover:bg-brand-neutral focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500 disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent"
      >
        ›
      </button>
      <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-brand-border" />
      <button
        type="button"
        onClick={onAdd}
        className="h-7 rounded-md bg-redwell-600 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-redwell-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500 focus-visible:ring-offset-1"
      >
        + Add
      </button>
      <button
        type="button"
        onClick={onDuplicate}
        className="h-7 rounded-md px-2 text-xs font-medium text-brand-muted transition-colors hover:bg-brand-neutral hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500"
      >
        Duplicate
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={slides.length <= 1}
        className="h-7 rounded-md px-2 text-xs font-medium text-brand-muted transition-colors hover:bg-brand-accent-soft hover:text-redwell-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
      >
        Delete
      </button>
      <button
        type="button"
        onClick={onPreview}
        className="h-7 rounded-md border border-brand-border px-2.5 text-xs font-semibold text-brand-ink transition-colors hover:border-redwell-300 hover:bg-brand-accent-soft hover:text-redwell-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500"
      >
        Preview
      </button>
    </div>
  );
}

interface CarouselTimelineProps {
  carousel: CarouselState;
  onSelect: (slideId: string) => void;
  onAdd: () => void;
  onReorder: (slideId: string, targetSlideId: string, placement: "before" | "after") => void;
  onTemplates: () => void;
}

export function CarouselTimeline({ carousel, onSelect, onAdd, onReorder, onTemplates }: CarouselTimelineProps) {
  const slides = [...carousel.slides].sort((first, second) => first.order - second.order);
  const [draggedSlideId, setDraggedSlideId] = useState<string | null>(null);
  const slideRefs = useRef(new Map<string, HTMLDivElement>());
  const [dropTarget, setDropTarget] = useState<{
    slideId: string;
    placement: "before" | "after";
  } | null>(null);

  useEffect(() => {
    slideRefs.current.get(carousel.activeSlideId)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [carousel.activeSlideId]);

  const getDropPlacement = (event: DragEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientX < rect.left + rect.width / 2 ? "before" : "after";
  };

  const finishDrag = () => {
    setDraggedSlideId(null);
    setDropTarget(null);
  };

  const moveSlide = (slideId: string, direction: "left" | "right") => {
    const index = slides.findIndex((slide) => slide.id === slideId);
    const targetIndex = index + (direction === "left" ? -1 : 1);
    const target = slides[targetIndex];
    if (!target) return;
    onReorder(slideId, target.id, direction === "left" ? "before" : "after");
  };

  return (
    <section aria-label="Carousel slides" className="shrink-0 border-t border-brand-border bg-brand-paper px-2.5 py-1 sm:px-4">
      <div className="mb-0.5 flex items-center justify-between gap-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Slide sequence</p>
        <button
          type="button"
          onClick={onTemplates}
          className="rounded-md px-2 py-0.5 text-[9px] font-semibold text-redwell-700 transition-colors hover:bg-brand-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500"
        >
          Story templates
        </button>
      </div>
      <div
        aria-label="Slide thumbnails, horizontally scrollable"
        className="flex flex-nowrap items-stretch gap-1.5 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-color:#deddda_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-brand-border"
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            ref={(node) => {
              if (node) slideRefs.current.set(slide.id, node);
              else slideRefs.current.delete(slide.id);
            }}
            role="group"
            draggable
            aria-roledescription="Draggable slide thumbnail"
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", slide.id);
              setDraggedSlideId(slide.id);
            }}
            onDragEnd={finishDrag}
            onDragOver={(event) => {
              if (!draggedSlideId || draggedSlideId === slide.id) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDropTarget({ slideId: slide.id, placement: getDropPlacement(event) });
            }}
            onDragLeave={(event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node)) return;
              setDropTarget((current) => current?.slideId === slide.id ? null : current);
            }}
            onDrop={(event) => {
              event.preventDefault();
              const sourceSlideId = event.dataTransfer.getData("text/plain") || draggedSlideId;
              if (sourceSlideId && sourceSlideId !== slide.id) {
                onReorder(sourceSlideId, slide.id, getDropPlacement(event));
              }
              finishDrag();
            }}
            aria-label={`Slide ${index + 1} reorder area`}
            className={`group/card relative flex w-[96px] shrink-0 snap-start flex-col gap-0.5 rounded-md border p-1 text-left transition-colors sm:w-[104px] xl:w-[112px] ${
              slide.id === carousel.activeSlideId
                ? "border-redwell-600 bg-brand-accent-soft ring-1 ring-redwell-600"
                : "border-brand-border bg-brand-surface hover:border-redwell-300 hover:bg-brand-neutral"
            } ${draggedSlideId === slide.id ? "cursor-grabbing opacity-50" : "cursor-grab"} ${dropTarget?.slideId === slide.id ? "bg-brand-accent-soft" : ""}`}
          >
            {dropTarget?.slideId === slide.id && (
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-y-2 z-20 w-[3px] rounded-full bg-redwell-600 ${
                  dropTarget.placement === "before" ? "-left-2" : "-right-2"
                }`}
              />
            )}
            <button
              type="button"
              aria-label={`Select slide ${index + 1}${slide.id === carousel.activeSlideId ? ", active" : ""}`}
              aria-current={slide.id === carousel.activeSlideId ? "page" : undefined}
              onClick={() => onSelect(slide.id)}
              className="flex w-full min-w-0 flex-col gap-1 rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500"
            >
              <span className={`flex items-center justify-between px-0.5 text-[9px] font-bold tabular-nums ${slide.id === carousel.activeSlideId ? "text-redwell-700" : "text-brand-ink"}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {slide.storySlideType && (
                  <span className="truncate text-[7px] font-medium uppercase tracking-wide text-brand-muted">
                    {getCarouselSlideRole(slide.storySlideType)}
                  </span>
                )}
              </span>
              <SlidePreview slide={slide} />
              <span className="flex min-w-0 items-center justify-between gap-1 px-0.5">
                <span className="truncate text-[8px] font-medium text-brand-muted">
                  {slide.photos.length} {slide.photos.length === 1 ? "photo" : "photos"}
                </span>
                {getSlideTitle(slide) && (
                  <span className="min-w-0 truncate text-[7px] text-brand-muted" title={getSlideTitle(slide)}>
                    {getSlideTitle(slide)}
                  </span>
                )}
              </span>
            </button>
            <div className="absolute right-1 top-1 flex gap-0.5 opacity-70 transition-opacity group-hover/card:opacity-100 focus-within:opacity-100" aria-label={`Move slide ${index + 1}`}>
              <button
                type="button"
                aria-label={`Move slide ${index + 1} left`}
                title="Move left"
                disabled={index === 0}
                onClick={() => moveSlide(slide.id, "left")}
                className="flex h-5 w-5 items-center justify-center rounded bg-brand-paper text-xs text-brand-muted transition-colors hover:bg-brand-neutral hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label={`Move slide ${index + 1} right`}
                title="Move right"
                disabled={index === slides.length - 1}
                onClick={() => moveSlide(slide.id, "right")}
                className="flex h-5 w-5 items-center justify-center rounded bg-brand-paper text-xs text-brand-muted transition-colors hover:bg-brand-neutral hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
              >
                ›
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="flex min-h-[66px] w-[72px] shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-md border border-dashed border-brand-border bg-brand-surface px-2 text-[10px] font-medium text-brand-muted transition-colors hover:border-redwell-400 hover:bg-brand-accent-soft hover:text-redwell-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500"
        >
          <span aria-hidden="true" className="text-lg leading-none">+</span>
          <span>Add slide</span>
        </button>
      </div>
    </section>
  );
}

function SlidePreview({ slide }: { slide: CarouselSlide }) {
  return (
    <div className="flex h-8 w-full items-center justify-center overflow-hidden rounded-sm bg-brand-neutral p-0.5">
      <CarouselSlideArtwork slide={slide} maxWidth={52} maxHeight={28} className="rounded-sm" />
    </div>
  );
}

function getSlideTitle(slide: CarouselSlide) {
  return slide.storyText?.find((item) => item.role === "title")?.text.trim();
}

function getCarouselSlideRole(type: CarouselStorySlideType) {
  const roles: Record<CarouselStorySlideType, string> = {
    cover: "Hook",
    introduction: "Introduction",
    journey: "Main moment",
    detail: "Detail",
    experience: "Experience",
    highlight: "Highlight",
    ending: "Closing / CTA",
    gallery: "Gallery",
    list: "Information",
    tip: "Tip",
    "before-after": "Before / After",
    quote: "Story / Quote",
    cta: "Closing / CTA",
  };
  return roles[type];
}
