"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDialogFocus } from "./use-dialog-focus";
import { getCarouselSlideTitle } from "./carousel-slide-presets";
import { CANVAS_FORMATS, type CarouselState } from "@/types/editor";
import { CarouselSlideArtwork } from "./carousel-slide-artwork";

interface CarouselPreviewDialogProps {
  carousel: CarouselState;
  onClose: () => void;
  onEdit: (slideId: string) => void;
}

export function CarouselPreviewDialog({ carousel, onClose, onEdit }: CarouselPreviewDialogProps) {
  const slides = useMemo(
    () => [...carousel.slides].sort((first, second) => first.order - second.order),
    [carousel.slides]
  );
  const [previewSlideId, setPreviewSlideId] = useState(carousel.activeSlideId);
  const [overview, setOverview] = useState(false);
  const dialogRef = useDialogFocus(true, onClose);
  const [stageSize, setStageSize] = useState({ width: 1, height: 1 });
  const stageRef = useRef<HTMLDivElement>(null);
  const activeIndex = Math.max(0, slides.findIndex((slide) => slide.id === previewSlideId));
  const activeSlide = slides[activeIndex] ?? slides[0];
  const format = CANVAS_FORMATS.find((candidate) => candidate.id === activeSlide?.canvasFormatId) ?? CANVAS_FORMATS[0];

  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.contains(document.activeElement)) dialogRef.current.focus();
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(() => {
      setStageSize({
        width: Math.max(1, stage.clientWidth),
        height: Math.max(1, stage.clientHeight),
      });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [overview, dialogRef]);

  if (!activeSlide) return null;

  const selectOffset = (offset: number) => {
    const nextSlide = slides[activeIndex + offset];
    if (nextSlide) setPreviewSlideId(nextSlide.id);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-brand-ink/85 p-3 backdrop-blur-sm sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          selectOffset(-1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          selectOffset(1);
        }
      }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Carousel preview"
        className="flex h-[min(96dvh,1100px)] w-full max-w-[min(96vw,1600px)] flex-col overflow-hidden rounded-xl border border-brand-border bg-brand-paper shadow-lg sm:rounded-lg"
      >
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-brand-border px-4 py-3 sm:flex-nowrap sm:px-6 sm:py-4">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-accent-hover">Story preview</p>
            <h2 className="mt-0.5 truncate font-sans text-lg text-brand-ink sm:text-xl">
              {overview ? "The complete story" : getCarouselSlideTitle(activeSlide)} <span className="font-sans text-sm font-normal text-brand-muted/70">{overview ? `${slides.length} slides` : `${activeIndex + 1} / ${slides.length}`}</span>
            </h2>
          </div>
          <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
            <button type="button" aria-pressed={overview} onClick={() => setOverview(!overview)} className="h-9 rounded border border-brand-border px-3 text-xs font-semibold hover:bg-brand-neutral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">{overview ? "Sequence" : "Overview"}</button>
            <button
              type="button"
              onClick={() => { setOverview(false); selectOffset(-1); }}
              disabled={activeIndex <= 0}
              aria-label="Previous preview slide"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-border bg-brand-surface text-lg text-brand-ink transition-colors hover:border-brand-accent/40 hover:text-brand-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent disabled:text-brand-muted/50"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => { setOverview(false); selectOffset(1); }}
              disabled={activeIndex >= slides.length - 1}
              aria-label="Next preview slide"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-border bg-brand-surface text-lg text-brand-ink transition-colors hover:border-brand-accent/40 hover:text-brand-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent disabled:text-brand-muted/50"
            >
              ›
            </button>
            <button type="button" onClick={() => onEdit(activeSlide.id)} className="hidden h-9 rounded border border-brand-border px-3 text-xs font-semibold hover:bg-brand-neutral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent sm:block">Edit slide</button>
            <button
              type="button"
              onClick={onClose}
              className="ml-1 h-9 rounded-lg bg-brand-accent px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              Done
            </button>
          </div>
        </header>

        {overview ? <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 overflow-y-auto bg-brand-neutral p-4 md:grid-cols-3 xl:grid-cols-4">
          {slides.map((slide, index) => <button key={slide.id} type="button" onClick={() => { setPreviewSlideId(slide.id); setOverview(false); }} aria-label={`Review slide ${index + 1}: ${getCarouselSlideTitle(slide)}`} className="flex min-w-0 flex-col items-center gap-2 rounded p-2 text-left hover:bg-brand-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">
            <span className="flex w-full min-w-0 justify-center overflow-hidden" style={{ contentVisibility: "auto" }}><CarouselSlideArtwork slide={slide} maxWidth={180} maxHeight={225} fitContainer className="shadow-none" /></span>
            <span className="w-full text-xs font-semibold">{index + 1} · {getCarouselSlideTitle(slide)}</span>
          </button>)}
        </div> : <div className="flex min-h-0 flex-1 overflow-hidden bg-brand-neutral p-3 sm:p-5">
          <div
            ref={stageRef}
            className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden"
          >
            <CarouselSlideArtwork
              key={activeSlide.id}
              slide={activeSlide}
              maxWidth={stageSize.width}
              maxHeight={stageSize.height}
              className="rounded-sm shadow-md"
            />
          </div>
        </div>}

        <footer className="shrink-0 border-t border-brand-border bg-brand-surface px-3 py-3 sm:px-6">
          {!overview && <div className="mx-auto flex max-w-full items-start gap-2 overflow-x-auto pb-1" aria-label="Preview slide sequence">
            {slides.map((slide, index) => {
              const slideFormat = CANVAS_FORMATS.find((candidate) => candidate.id === slide.canvasFormatId) ?? CANVAS_FORMATS[0];
              const title = getCarouselSlideTitle(slide);
              const width = Math.min(104, 62 * slideFormat.ratio);
              const height = width / slideFormat.ratio;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setPreviewSlideId(slide.id)}
                  aria-label={`Preview slide ${index + 1}${title ? `: ${title}` : ""}`}
                  aria-current={slide.id === activeSlide.id ? "step" : undefined}
                  className={`flex w-[112px] shrink-0 flex-col items-center gap-1.5 rounded-lg border p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${
                    slide.id === activeSlide.id
                      ? "border-brand-accent bg-brand-accent-soft ring-1 ring-brand-accent"
                      : "border-brand-border bg-brand-surface hover:border-brand-muted/50"
                  }`}
                >
                  <CarouselSlideArtwork
                    slide={slide}
                    maxWidth={width}
                    maxHeight={height}
                    className="rounded-sm shadow-none"
                  />
                  <span className={`max-w-full truncate text-[10px] font-semibold ${slide.id === activeSlide.id ? "text-brand-accent-hover" : "text-brand-muted"}`}>
                    {String(index + 1).padStart(2, "0")} {title || "Untitled"}
                  </span>
                </button>
              );
            })}
          </div>}
          <button type="button" onClick={() => onEdit(activeSlide.id)} className="mb-2 h-9 w-full rounded border border-brand-border text-xs font-semibold hover:bg-brand-neutral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent sm:hidden">Edit slide {activeIndex + 1}</button>
          <p className="mt-1 text-center text-[10px] text-brand-muted/70">Use ← and → to review the sequence · {format.name}</p>
        </footer>
      </section>
    </div>
  );
}
