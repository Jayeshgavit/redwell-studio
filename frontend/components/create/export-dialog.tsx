"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CANVAS_FORMATS, COLLAGE_LAYOUTS, type CanvasElement, type CanvasFormat, type CarouselState, type CarouselStoryTextItem, type CollageStyle, type DocumentMode, type LayoutDefinition } from "@/types/editor";
import type { Photo } from "./photo-context";
import {
  createCollageExport,
  createZipExport,
  downloadExport,
  getCarouselSlideFilename,
  getCarouselZipFilename,
  getExportFilename,
  type ExportImageFormat,
  type ExportScale,
  type ExportSnapshot,
} from "./export-service";

interface ExportDialogProps {
  documentMode: DocumentMode;
  carousel: CarouselState | null;
  format: CanvasFormat;
  layout: LayoutDefinition;
  photos: Photo[];
  slotAssignments: Record<number, string>;
  collageStyle: CollageStyle;
  elements: CanvasElement[];
  storyText: CarouselStoryTextItem[];
  onClose: () => void;
}

const IMAGE_FORMATS: { id: ExportImageFormat; label: string }[] = [
  { id: "png", label: "PNG" },
  { id: "jpg", label: "JPG" },
];
const EXPORT_SCALES: ExportScale[] = [1, 2, 3];

export function ExportDialog({
  documentMode,
  carousel,
  format,
  layout,
  photos,
  slotAssignments,
  collageStyle,
  elements,
  storyText,
  onClose,
}: ExportDialogProps) {
  const [imageFormat, setImageFormat] = useState<ExportImageFormat>("png");
  const [scale, setScale] = useState<ExportScale>(1);
  const [quality, setQuality] = useState(90);
  const [carouselScope, setCarouselScope] = useState<"current" | "all">("current");
  const [allSlidesDelivery, setAllSlidesDelivery] = useState<"files" | "zip">("zip");
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const isExportingRef = useRef(isExporting);
  onCloseRef.current = onClose;
  isExportingRef.current = isExporting;
  const filename = useMemo(
    () => getExportFilename(imageFormat, documentMode === "carousel" ? "carousel-slide" : "collage"),
    [documentMode, imageFormat]
  );
  const carouselSlides = useMemo(
    () => [...(carousel?.slides ?? [])].sort((first, second) => first.order - second.order),
    [carousel?.slides]
  );
  const carouselSlidesWithPhotos = useMemo(
    () => carouselSlides.filter((slide) => {
      const assignedIds = new Set(Object.values(slide.slotAssignments));
      return slide.photos.some((photo) => assignedIds.has(photo.id));
    }),
    [carouselSlides]
  );
  const activeSlideIndex = Math.max(0, carouselSlides.findIndex((slide) => slide.id === carousel?.activeSlideId));

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const dialog = dialogRef.current;
    const firstControl = dialog?.querySelector<HTMLElement>("button:not(:disabled), input:not(:disabled)");
    firstControl?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!isExportingRef.current) onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const controls = [...dialog.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled)")];
      if (controls.length === 0) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, []);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setError(null);
    setProgress("Preparing export...");

    const collageSnapshot: ExportSnapshot = {
      format,
      layout,
      photos,
      slotAssignments,
      collageStyle,
      elements,
      storyText,
    };

    try {
      const options = { imageFormat, scale, quality };
      if (documentMode === "collage") {
        const blob = await createCollageExport(collageSnapshot, options, setProgress);
        downloadExport(blob, filename);
      } else {
        const slides = carouselScope === "all"
          ? carouselSlidesWithPhotos
          : carouselSlides.slice(activeSlideIndex, activeSlideIndex + 1);
        if (slides.length === 0) throw new Error("No slides contain an assigned photo to export.");
        if (carouselScope === "current" && !carouselSlidesWithPhotos.some((slide) => slide.id === slides[0].id)) {
          throw new Error("The current slide has no assigned photo to export.");
        }
        const exports = [] as { filename: string; blob: Blob }[];
        for (const [index, slide] of slides.entries()) {
          const sourceIndex = carouselScope === "all" ? index : activeSlideIndex;
          setProgress(`Rendering slide ${index + 1} of ${slides.length}...`);
          const slideFormat = CANVAS_FORMATS.find((candidate) => candidate.id === slide.canvasFormatId) ?? format;
          const slideLayout = COLLAGE_LAYOUTS.find((candidate) => candidate.id === slide.selectedLayoutId) ?? layout;
          const blob = await createCollageExport({
            format: slideFormat,
            layout: slideLayout,
            photos: slide.photos,
            slotAssignments: slide.slotAssignments,
            collageStyle: slide.collageStyle,
            elements: slide.elements,
            storyText: slide.storyText,
          }, options, setProgress);
          exports.push({ filename: getCarouselSlideFilename(sourceIndex, imageFormat), blob });
        }
        if (carouselScope === "all" && allSlidesDelivery === "zip") {
          downloadExport(await createZipExport(exports), getCarouselZipFilename());
        } else {
          exports.forEach((item) => downloadExport(item.blob, item.filename));
        }
      }
      setProgress("Download ready — your artwork is being saved.");
      onClose();
    } catch (exportError) {
      setProgress(null);
      setError(
        exportError instanceof Error
          ? exportError.message
          : "The artwork could not be exported. Please try again."
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-brand-ink/45 p-2 sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isExporting) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
        tabIndex={-1}
        className="max-h-[min(92dvh,48rem)] w-full max-w-lg overflow-y-auto rounded-lg border border-brand-border bg-brand-surface p-5 shadow-lg outline-none sm:rounded-lg sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="export-dialog-title" className="text-lg font-semibold tracking-tight text-brand-ink">
              Export {documentMode === "carousel" ? "carousel" : "collage"}
            </h2>
            <p className="mt-1 text-xs text-brand-muted">Download the finished artwork at its final document dimensions.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            aria-label="Close export dialog"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg text-brand-muted hover:bg-brand-neutral focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:opacity-40"
          >
            ×
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {documentMode === "carousel" && (
            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">Slides</legend>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Carousel export scope">
                {(["current", "all"] as const).map((scope) => (
                  <button key={scope} type="button" disabled={isExporting} onClick={() => setCarouselScope(scope)} aria-pressed={carouselScope === scope}
                    className={`min-h-10 rounded-lg border px-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent ${carouselScope === scope ? "border-brand-accent bg-brand-accent-soft text-brand-accent-hover" : "border-brand-border bg-brand-surface text-brand-ink hover:bg-brand-paper"}`}>
            {scope === "current" ? `Current slide · ${activeSlideIndex + 1}` : `All slides · ${carouselSlidesWithPhotos.length}`}
                  </button>
                ))}
              </div>
              {carouselScope === "all" && (
                <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="All slides download type">
                  <button type="button" disabled={isExporting} onClick={() => setAllSlidesDelivery("zip")} aria-pressed={allSlidesDelivery === "zip"} className={`min-h-9 rounded-lg border px-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-accent ${allSlidesDelivery === "zip" ? "border-brand-accent bg-brand-accent-soft text-brand-accent-hover" : "border-brand-border text-brand-muted"}`}>ZIP download</button>
                  <button type="button" disabled={isExporting} onClick={() => setAllSlidesDelivery("files")} aria-pressed={allSlidesDelivery === "files"} className={`min-h-9 rounded-lg border px-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-accent ${allSlidesDelivery === "files" ? "border-brand-accent bg-brand-accent-soft text-brand-accent-hover" : "border-brand-border text-brand-muted"}`}>Separate files</button>
                </div>
              )}
            </fieldset>
          )}
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">Format</legend>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Export image format">
              {IMAGE_FORMATS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setImageFormat(option.id)}
                  disabled={isExporting}
                  aria-pressed={imageFormat === option.id}
                  className={`min-h-10 rounded-lg border px-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent ${
                    imageFormat === option.id
                      ? "border-brand-accent bg-brand-accent-soft text-brand-accent-hover"
                      : "border-brand-border bg-brand-surface text-brand-ink hover:bg-brand-paper"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          {imageFormat !== "png" ? (
            <label className="block">
              <span className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-brand-muted">
                <span>Quality</span>
                <span className="font-medium normal-case tracking-normal text-brand-muted">{quality}%</span>
              </span>
              <input
                type="range"
                min="50"
                max="100"
                step="1"
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
                disabled={isExporting}
                aria-label="Image quality"
                className="h-2 w-full cursor-pointer accent-brand-accent"
              />
            </label>
          ) : (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Quality</p>
              <p className="mt-1 text-xs text-brand-muted">PNG is lossless; quality is not adjustable.</p>
            </div>
          )}

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">Resolution</legend>
            <div className="grid grid-cols-3 gap-2">
              {EXPORT_SCALES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setScale(option)}
                  disabled={isExporting}
                  aria-pressed={scale === option}
                  className={`min-h-10 rounded-lg border px-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent ${
                    scale === option
                      ? "border-brand-accent bg-brand-accent-soft text-brand-accent-hover"
                      : "border-brand-border bg-brand-surface text-brand-ink hover:bg-brand-paper"
                  }`}
                >
                  {option}×
                </button>
              ))}
            </div>
          </fieldset>

          <div className="rounded-lg bg-brand-paper p-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Output size</span>
              <span className="text-sm font-semibold tabular-nums text-brand-ink">
                {format.width * scale} × {format.height * scale} px
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-brand-muted" title={filename}>{filename}</p>
          </div>

          {progress && (
            <p className="text-sm text-brand-ink" role="status" aria-live="polite">
              {isExporting && <span aria-hidden="true" className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-brand-border border-t-brand-accent align-[-2px]" />}
              {progress}
            </p>
          )}
          {error && <p className="rounded-lg bg-brand-accent-soft px-3 py-2 text-sm text-brand-accent-hover" role="alert">{error}</p>}

          <div className="flex flex-col-reverse gap-2 border-t border-brand-border pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="min-h-10 rounded-lg border border-brand-border bg-brand-surface px-4 text-sm font-medium text-brand-ink hover:bg-brand-paper focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="min-h-10 rounded-lg bg-brand-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              {isExporting ? "Exporting…" : "Download"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
