"use client";

import { useState } from "react";
import type { PhotoFilters } from "@/types/editor";
import type { HistoryBehavior, Photo, PhotoDisplayMode, PhotoRotation } from "./photo-context";
import {
  createPhotoFilterPreset,
  FILTER_PRESETS,
  getPhotoColorOverlay,
  getPhotoCssFilter,
  getPhotoGradientOverlay,
  resolvePhotoFilters,
} from "./photo-filters";

interface ImageAdjustmentToolbarProps {
  photo: Photo | null;
  onReplacePhoto?: () => void;
  onRemovePhoto?: () => void;
  onUpdate: (id: string, updates: Partial<Photo>, historyBehavior?: HistoryBehavior) => void;
  onBeginTransaction: () => void;
  onFinishTransaction: () => void;
}

const MODES: { id: PhotoDisplayMode; label: string }[] = [
  { id: "fill", label: "Fill" },
  { id: "fit", label: "Fit" },
  { id: "stretch", label: "Stretch" },
];

const FILTER_CATEGORIES = [
  { id: "all", label: "All", presets: FILTER_PRESETS.map((preset) => preset.id) },
  { id: "basic", label: "Basic", presets: ["original", "vivid", "soft", "high-contrast"] },
  { id: "cinematic", label: "Cinematic", presets: ["cinematic", "moody", "dramatic"] },
  { id: "vintage", label: "Vintage", presets: ["film", "vintage", "matte", "faded"] },
  { id: "bw", label: "Black & White", presets: ["bw", "noir"] },
  { id: "nature", label: "Nature", presets: ["golden", "forest", "mist"] },
  { id: "mood", label: "Mood", presets: ["warm", "cool", "sunset"] },
] as const;

export function ImageAdjustmentToolbar({
  photo,
  onReplacePhoto,
  onRemovePhoto,
  onUpdate,
  onBeginTransaction,
  onFinishTransaction,
}: ImageAdjustmentToolbarProps) {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  if (!photo) return null;
  const filters = resolvePhotoFilters(photo.filters);

  const updateFilter = <K extends keyof PhotoFilters>(key: K, value: PhotoFilters[K]) => {
    onUpdate(photo.id, {
      filters: { ...filters, [key]: value },
    }, "transient");
  };

  const nudge = (x: number, y: number) => {
    onUpdate(photo.id, {
      positionX: clampFocus(photo.positionX + x),
      positionY: clampFocus(photo.positionY + y),
    });
  };

  return (
    <section
      aria-label="Image adjustments"
      className="w-full min-w-0"
    >
      <div className="flex flex-col items-stretch gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-muted">
            Image
          </span>
          <div className="flex rounded-lg bg-brand-neutral p-0.5" role="group" aria-label="Image display mode">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                aria-pressed={photo.displayMode === mode.id}
                onClick={() => onUpdate(photo.id, { displayMode: mode.id })}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent ${
                  photo.displayMode === mode.id
                    ? "bg-brand-surface text-brand-ink"
                    : "text-brand-muted hover:text-brand-ink"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1" role="group" aria-label="Move image">
          <span className="mr-1 text-[10px] font-medium uppercase tracking-wide text-brand-muted">
            Position
          </span>
          <button type="button" onClick={() => nudge(0.08, 0)} disabled={photo.displayMode !== "fill"} aria-label="Move image left" className={positionButtonClass}>
            ←
          </button>
          <button type="button" onClick={() => nudge(0, 0.08)} disabled={photo.displayMode !== "fill"} aria-label="Move image up" className={positionButtonClass}>
            ↑
          </button>
          <button type="button" onClick={() => nudge(0, -0.08)} disabled={photo.displayMode !== "fill"} aria-label="Move image down" className={positionButtonClass}>
            ↓
          </button>
          <button type="button" onClick={() => nudge(-0.08, 0)} disabled={photo.displayMode !== "fill"} aria-label="Move image right" className={positionButtonClass}>
            →
          </button>
        </div>

        <div className="flex w-full min-w-0 items-center gap-2">
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-brand-muted">Zoom</span>
          <button type="button" onClick={() => onUpdate(photo.id, { zoom: clampZoom(photo.zoom - 0.1) })} aria-label="Zoom out" className={positionButtonClass}>
            −
          </button>
          <input
            aria-label="Image zoom"
            type="range"
            min="0.8"
            max="3"
            step="0.05"
            value={photo.zoom}
            onChange={(event) =>
              onUpdate(photo.id, { zoom: clampZoom(Number(event.target.value)) }, "transient")
            }
            onPointerDown={onBeginTransaction}
            onPointerUp={onFinishTransaction}
            onPointerCancel={onFinishTransaction}
            onKeyDown={(event) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End", "PageDown", "PageUp"].includes(event.key)) {
                onBeginTransaction();
              }
            }}
            onKeyUp={onFinishTransaction}
            onBlur={onFinishTransaction}
            className="h-1.5 min-w-16 flex-1 cursor-pointer accent-brand-accent"
          />
          <button type="button" onClick={() => onUpdate(photo.id, { zoom: clampZoom(photo.zoom + 0.1) })} aria-label="Zoom in" className={positionButtonClass}>
            +
          </button>
          <span className="w-9 text-right text-[11px] tabular-nums text-brand-muted">{photo.zoom.toFixed(1)}×</span>
        </div>

        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Image transform">
          <span className="mr-1 text-[10px] font-medium uppercase tracking-wide text-brand-muted">Transform</span>
          <button
            type="button"
            onClick={() => onUpdate(photo.id, { rotation: rotate(photo.rotation, -90) })}
            aria-label="Rotate left"
            title="Rotate left"
            className={transformButtonClass}
          >
            ↶ <span className="hidden sm:inline">Rotate</span>
          </button>
          <button
            type="button"
            onClick={() => onUpdate(photo.id, { rotation: rotate(photo.rotation, 90) })}
            aria-label="Rotate right"
            title="Rotate right"
            className={transformButtonClass}
          >
            ↷ <span className="hidden sm:inline">Rotate</span>
          </button>
          <button
            type="button"
            aria-pressed={photo.flipX}
            onClick={() => onUpdate(photo.id, { flipX: !photo.flipX })}
            aria-label="Flip horizontally"
            title="Flip horizontally"
            className={`${transformButtonClass} ${photo.flipX ? activeTransformClass : ""}`}
          >
            Flip H
          </button>
          <button
            type="button"
            aria-pressed={photo.flipY}
            onClick={() => onUpdate(photo.id, { flipY: !photo.flipY })}
            aria-label="Flip vertically"
            title="Flip vertically"
            className={`${transformButtonClass} ${photo.flipY ? activeTransformClass : ""}`}
          >
            Flip V
          </button>
        </div>

        <section aria-label="Photo filters" className="space-y-3 border-t border-brand-border pt-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-muted">
              Filters
            </h3>
            <button
              type="button"
              onClick={() => onUpdate(photo.id, { filters: undefined })}
              className="rounded-md px-2 py-1 text-[11px] font-medium text-brand-muted hover:bg-brand-neutral hover:text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              Reset filters
            </button>
          </div>
          <nav aria-label="Filter categories" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
            {FILTER_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                aria-pressed={filterCategory === category.id}
                onClick={() => setFilterCategory(category.id)}
                className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${
                  filterCategory === category.id
                    ? "bg-brand-accent text-white"
                    : "bg-brand-neutral text-brand-muted hover:bg-brand-border"
                }`}
              >
                {category.label}
              </button>
            ))}
          </nav>
          <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter presets">
            {FILTER_PRESETS
              .filter((preset) =>
                FILTER_CATEGORIES
                  .find((category) => category.id === filterCategory)
                  ?.presets.some((categoryPreset) => categoryPreset === preset.id)
              )
              .map((preset) => (
                <FilterPresetButton
                  key={preset.id}
                  photoSrc={photo.src}
                  presetId={preset.id}
                  label={preset.label}
                  isSelected={filters.preset === preset.id}
                  onSelect={() => onUpdate(photo.id, { filters: createPhotoFilterPreset(preset.id) })}
                />
              ))}
          </div>
          <div className="space-y-1.5">
            <details open className="group rounded-lg border border-brand-border px-2.5">
              <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-muted [&::-webkit-details-marker]:hidden">
                Light
                <span aria-hidden="true" className="text-sm leading-none transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <div className="space-y-2.5 pb-3">
                <FilterSlider id="photo-brightness" label="Brightness" min={0} max={200} value={filters.brightness} onChange={(value) => updateFilter("brightness", value)} onBegin={onBeginTransaction} onFinish={onFinishTransaction} />
                <FilterSlider id="photo-contrast" label="Contrast" min={0} max={200} value={filters.contrast} onChange={(value) => updateFilter("contrast", value)} onBegin={onBeginTransaction} onFinish={onFinishTransaction} />
                <FilterSlider id="photo-exposure" label="Exposure" min={-100} max={100} value={filters.exposure} onChange={(value) => updateFilter("exposure", value)} onBegin={onBeginTransaction} onFinish={onFinishTransaction} />
              </div>
            </details>
            <details className="group rounded-lg border border-brand-border px-2.5">
              <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-muted [&::-webkit-details-marker]:hidden">
                Color
                <span aria-hidden="true" className="text-sm leading-none transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <div className="space-y-2.5 pb-3">
                <FilterSlider id="photo-saturation" label="Saturation" min={0} max={200} value={filters.saturation} onChange={(value) => updateFilter("saturation", value)} onBegin={onBeginTransaction} onFinish={onFinishTransaction} />
                <FilterSlider id="photo-temperature" label="Temperature" min={-100} max={100} value={filters.temperature} onChange={(value) => updateFilter("temperature", value)} onBegin={onBeginTransaction} onFinish={onFinishTransaction} />
                <FilterSlider id="photo-tint" label="Tint" min={-100} max={100} value={filters.tint} onChange={(value) => updateFilter("tint", value)} onBegin={onBeginTransaction} onFinish={onFinishTransaction} />
              </div>
            </details>
            <details className="group rounded-lg border border-brand-border px-2.5">
              <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-muted [&::-webkit-details-marker]:hidden">
                Effects
                <span aria-hidden="true" className="text-sm leading-none transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <div className="space-y-2.5 pb-3">
                <FilterSlider id="photo-blur" label="Blur" min={0} max={10} value={filters.blur} onChange={(value) => updateFilter("blur", value)} onBegin={onBeginTransaction} onFinish={onFinishTransaction} suffix="px" />
                <FilterSlider id="photo-grain" label="Grain" min={0} max={100} value={filters.grain} onChange={(value) => updateFilter("grain", value)} onBegin={onBeginTransaction} onFinish={onFinishTransaction} suffix="%" />
                <FilterSlider id="photo-vignette" label="Vignette" min={0} max={100} value={filters.vignette ?? 0} onChange={(value) => updateFilter("vignette", value)} onBegin={onBeginTransaction} onFinish={onFinishTransaction} suffix="%" />
                <FilterSlider id="photo-opacity" label="Opacity" min={0} max={100} value={filters.opacity} onChange={(value) => updateFilter("opacity", value)} onBegin={onBeginTransaction} onFinish={onFinishTransaction} suffix="%" />
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-medium text-brand-ink">Gradient overlay</span>
                  <select
                    value={filters.gradientOverlay ?? ""}
                    onChange={(event) => updateFilter(
                      "gradientOverlay",
                      event.target.value === "dark-fade" || event.target.value === "warm-fade"
                        ? event.target.value
                        : undefined
                    )}
                    className="h-8 w-full rounded-md border border-brand-border bg-brand-surface px-2 text-xs text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  >
                    <option value="">None</option>
                    <option value="dark-fade">Dark fade</option>
                    <option value="warm-fade">Warm fade</option>
                  </select>
                </label>
              </div>
            </details>
          </div>
        </section>

        <button
          type="button"
          onClick={() =>
            onUpdate(photo.id, {
              displayMode: "fill",
              positionX: 0.5,
              positionY: 0.5,
              zoom: 1,
              rotation: 0,
              flipX: false,
              flipY: false,
            })
          }
          className="self-end rounded-md px-2.5 py-1.5 text-xs font-medium text-brand-muted transition-colors hover:bg-brand-neutral hover:text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          Reset
        </button>
        {(onReplacePhoto || onRemovePhoto) && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-brand-border pt-3">
            {onReplacePhoto && (
              <button
                type="button"
                onClick={onReplacePhoto}
                className="min-h-9 rounded-md border border-brand-border bg-brand-surface px-3 text-xs font-medium text-brand-ink transition-colors hover:bg-brand-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
              >
                Replace photo
              </button>
            )}
            {onRemovePhoto && (
              <button
                type="button"
                onClick={onRemovePhoto}
                className="min-h-9 rounded-md border border-brand-accent/25 px-3 text-xs font-medium text-brand-accent-hover transition-colors hover:bg-brand-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
              >
                Remove photo
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

interface FilterPresetButtonProps {
  photoSrc: string;
  presetId: (typeof FILTER_PRESETS)[number]["id"];
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}

function FilterPresetButton({
  photoSrc,
  presetId,
  label,
  isSelected,
  onSelect,
}: FilterPresetButtonProps) {
  const filters = createPhotoFilterPreset(presetId);
  const colorOverlay = getPhotoColorOverlay(filters);
  const gradientOverlay = getPhotoGradientOverlay(filters);

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      aria-label={`Apply ${label} filter`}
      title={label}
      onClick={onSelect}
      className={`w-[68px] shrink-0 snap-start overflow-hidden rounded-lg border bg-brand-surface text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${
        isSelected ? "border-brand-accent ring-2 ring-brand-accent ring-offset-1" : "border-brand-border hover:border-brand-muted/50"
      }`}
    >
      <span className="relative block h-11 overflow-hidden bg-brand-neutral">
        <img
          src={photoSrc}
          alt=""
          draggable={false}
          className="h-full w-full object-cover"
          style={{
            filter: getPhotoCssFilter(filters),
            opacity: filters.opacity / 100,
          }}
        />
        {colorOverlay && (
          <span
            aria-hidden="true"
            className="absolute inset-0 mix-blend-soft-light"
            style={{ backgroundColor: colorOverlay.color, opacity: colorOverlay.opacity }}
          />
        )}
        {gradientOverlay && <span aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: gradientOverlay }} />}
        {(filters.vignette ?? 0) > 0 && (
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,${(filters.vignette ?? 0) / 100 * 0.65}) 100%)`,
            }}
          />
        )}
        {filters.grain > 0 && (
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              opacity: filters.grain / 100 * 0.3,
              backgroundImage: "repeating-radial-gradient(circle at 20% 30%, rgba(0,0,0,.65) 0 0.45px, transparent .8px 2px), repeating-radial-gradient(circle at 70% 65%, rgba(255,255,255,.65) 0 0.45px, transparent .8px 2px)",
              backgroundSize: "4px 4px, 5px 5px",
            }}
          />
        )}
      </span>
      <span className="block min-h-7 whitespace-normal px-1 py-1 text-center text-[9px] font-medium leading-tight text-brand-ink">
        {label}
      </span>
    </button>
  );
}

interface FilterSliderProps {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
  suffix?: string;
  onChange: (value: number) => void;
  onBegin: () => void;
  onFinish: () => void;
}

function FilterSlider({
  id,
  label,
  min,
  max,
  value,
  suffix = "",
  onChange,
  onBegin,
  onFinish,
}: FilterSliderProps) {
  return (
    <div className="grid grid-cols-[5.25rem_minmax(0,1fr)_2.5rem] items-center gap-2">
      <label htmlFor={id} className="truncate text-[11px] font-medium text-brand-muted">{label}</label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        onPointerDown={onBegin}
        onPointerUp={onFinish}
        onPointerCancel={onFinish}
        onKeyDown={(event) => {
          if (["ArrowLeft", "ArrowRight", "Home", "End", "PageDown", "PageUp"].includes(event.key)) onBegin();
        }}
        onKeyUp={onFinish}
        onBlur={onFinish}
        className="h-1.5 w-full cursor-pointer accent-brand-accent"
      />
      <span className="text-right text-[10px] tabular-nums text-brand-muted">{value}{suffix}</span>
    </div>
  );
}

const positionButtonClass =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-brand-border bg-brand-surface text-sm text-brand-ink transition-colors hover:bg-brand-paper focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:cursor-not-allowed disabled:opacity-35";

const transformButtonClass =
  "flex h-7 shrink-0 items-center justify-center gap-1 rounded-md border border-brand-border bg-brand-surface px-2 text-xs font-medium text-brand-ink transition-colors hover:bg-brand-paper focus:outline-none focus:ring-2 focus:ring-brand-accent";
const activeTransformClass = "border-brand-accent/60 bg-brand-accent-soft text-brand-accent-hover";

function clampFocus(value: number) {
  return Math.max(0, Math.min(1, value));
}

function clampZoom(value: number) {
  return Math.max(0.8, Math.min(3, value));
}

function rotate(rotation: PhotoRotation, degrees: -90 | 90): PhotoRotation {
  return (((rotation + degrees + 360) % 360) as PhotoRotation);
}
