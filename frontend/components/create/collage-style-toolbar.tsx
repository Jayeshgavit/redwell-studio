"use client";

import { useRef, useState } from "react";
import type { CanvasBackgroundImage } from "@/types/editor";
import { usePhotos } from "./photo-context";

const BACKGROUND_PRESETS = [
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#000000" },
  { name: "Light gray", value: "#e5e7eb" },
  { name: "Dark gray", value: "#374151" },
];

export function CollageStyleToolbar() {
  const {
    collageStyle,
    updateCollageStyle,
    beginHistoryTransaction,
    finishHistoryTransaction,
  } = usePhotos();

  return (
    <section
      aria-label="Collage styling"
      className="w-full min-w-0"
    >
      <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-muted">
        Collage
      </h2>

      <div className="grid grid-cols-1 gap-y-4">
        <StyleSlider
          id="collage-spacing"
          label="Spacing"
          min={0}
          max={32}
          value={collageStyle.spacing}
          onChange={(spacing, historyBehavior) =>
            updateCollageStyle({ spacing }, historyBehavior)
          }
          onBegin={beginHistoryTransaction}
          onFinish={finishHistoryTransaction}
        />

        <StyleSlider
          id="collage-corners"
          label="Corners"
          min={0}
          max={40}
          value={collageStyle.cornerRadius}
          onChange={(cornerRadius, historyBehavior) =>
            updateCollageStyle({ cornerRadius }, historyBehavior)
          }
          onBegin={beginHistoryTransaction}
          onFinish={finishHistoryTransaction}
        />

        <BackgroundControls />

        <div className="min-w-0">
          <span className="mb-1.5 block text-xs font-medium text-brand-ink">Border</span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-brand-neutral p-0.5" role="group" aria-label="Collage border">
              <button
                type="button"
                onClick={() => updateCollageStyle({ borderEnabled: false })}
                aria-pressed={!collageStyle.borderEnabled}
                className={toggleClass(!collageStyle.borderEnabled)}
              >
                Off
              </button>
              <button
                type="button"
                onClick={() => updateCollageStyle({ borderEnabled: true })}
                aria-pressed={collageStyle.borderEnabled}
                className={toggleClass(collageStyle.borderEnabled)}
              >
                On
              </button>
            </div>
            {collageStyle.borderEnabled && (
              <>
                <StyleSlider
                  id="collage-border-width"
                  label="Width"
                  min={1}
                  max={10}
                  value={collageStyle.borderWidth}
                  compact
                  onChange={(borderWidth, historyBehavior) =>
                    updateCollageStyle({ borderWidth }, historyBehavior)
                  }
                  onBegin={beginHistoryTransaction}
                  onFinish={finishHistoryTransaction}
                />
                <label className="flex h-8 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-brand-border bg-brand-surface p-0.5">
                  <span className="sr-only">Border color</span>
                  <input
                    type="color"
                    value={collageStyle.borderColor}
                    onChange={(event) =>
                      updateCollageStyle({ borderColor: event.target.value })
                    }
                    aria-label="Choose collage border color"
                    className="h-full w-full cursor-pointer rounded-sm"
                  />
                </label>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function BackgroundControls() {
  const { collageStyle, updateCollageStyle, uploadBackgroundImage, beginHistoryTransaction, finishHistoryTransaction } = usePhotos();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageMode = collageStyle.backgroundType === "image";
  const image = collageStyle.backgroundImage;
  const updateImage = (updates: Partial<CanvasBackgroundImage>, historyBehavior: "commit" | "transient" = "commit") => {
    if (image) updateCollageStyle({ backgroundImage: { ...image, ...updates } }, historyBehavior);
  };
  const actionClass = "min-h-8 rounded-md border border-brand-border px-2.5 py-1 text-xs font-medium text-brand-ink hover:bg-brand-neutral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent disabled:cursor-not-allowed disabled:opacity-40";
  return <div className="space-y-3 border-t border-brand-border pt-3" aria-label="Canvas background">
    <h3 className="text-xs font-semibold text-brand-ink">Background</h3>
    <div className="flex w-fit rounded-lg bg-brand-neutral p-0.5" role="group" aria-label="Background type">
      <button type="button" disabled={loading} aria-pressed={!imageMode} onClick={() => updateCollageStyle({ backgroundType: "color" })} className={toggleClass(!imageMode)}>Color</button>
      <button type="button" disabled={loading} aria-pressed={imageMode} onClick={() => updateCollageStyle({ backgroundType: "image" })} className={toggleClass(imageMode)}>Image</button>
    </div>
    <div className="min-w-0">
      <label
        htmlFor="collage-background"
        className="mb-1.5 block text-xs font-medium text-brand-ink"
      >
        Background color
      </label>
      <div className="flex items-center gap-2">
        <input
          id="collage-background"
          type="color"
          value={collageStyle.backgroundColor}
          onChange={(event) =>
            updateCollageStyle({ backgroundColor: event.target.value })
          }
          aria-label="Choose custom collage background color"
          className="h-8 w-9 shrink-0 cursor-pointer rounded-md border border-brand-border bg-brand-surface p-0.5"
        />
        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-1">
          {BACKGROUND_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => updateCollageStyle({ backgroundColor: preset.value })}
              aria-label={`${preset.name} background`}
              aria-pressed={collageStyle.backgroundColor.toLowerCase() === preset.value}
              title={preset.name}
              className={`h-6 w-6 shrink-0 rounded-full border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-accent ${
                collageStyle.backgroundColor.toLowerCase() === preset.value
                  ? "ring-2 ring-brand-accent ring-offset-1"
                  : ""
              }`}
              style={{ backgroundColor: preset.value }}
            />
          ))}
        </div>
      </div>
    </div>

    {imageMode && <div className="space-y-3">
      <input ref={inputRef} type="file" accept="image/*" disabled={loading} className="sr-only" aria-label="Choose canvas background image"
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (!file) return;
          setLoading(true); setError(null);
          try { await uploadBackgroundImage(file); }
          catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "The image could not be loaded."); }
          finally { setLoading(false); }
        }} />
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={loading} onClick={() => inputRef.current?.click()} className={actionClass}>{loading ? "Loading image…" : image ? "Replace image" : "Upload background image"}</button>
        {image && <button type="button" disabled={loading} onClick={() => { updateCollageStyle({ backgroundType: "color", backgroundImage: null }); setError(null); }} className={actionClass}>Remove image</button>}
      </div>
      {error && <p role="alert" className="text-xs text-redwell-700">{error}</p>}
      {image && <>
        <p className="truncate text-xs text-brand-muted" title={image.name}>{image.name}</p>
        <div className="flex w-fit rounded-lg bg-brand-neutral p-0.5" role="group" aria-label="Background image sizing">
          <button type="button" aria-pressed={image.fit === "cover"} onClick={() => updateImage({ fit: "cover" })} className={toggleClass(image.fit === "cover")}>Fill / Cover</button>
          <button type="button" aria-pressed={image.fit === "contain"} onClick={() => updateImage({ fit: "contain" })} className={toggleClass(image.fit === "contain")}>Fit / Contain</button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium">Position</span>
          <button type="button" onClick={() => updateImage({ positionX: 0.5, positionY: 0.5 })} className={actionClass}>Center</button>
        </div>
        {([
          ["background-position-x", "Horizontal position", "positionX", 0, 100],
          ["background-position-y", "Vertical position", "positionY", 0, 100],
          ["background-zoom", "Background zoom", "zoom", 100, 300],
          ["background-opacity", "Background opacity", "opacity", 0, 100],
        ] as const).map(([id, label, key, min, max]) => <StyleSlider key={id} id={id} label={label} min={min} max={max} unit="%" value={Math.round(image[key] * 100)}
          onChange={(value, behavior) => updateImage({ [key]: value / 100 }, behavior)} onBegin={beginHistoryTransaction} onFinish={finishHistoryTransaction} />)}
        <p className="text-[11px] leading-relaxed text-brand-muted">Position controls choose the visible part of the image. Color remains underneath for transparent areas and reduced opacity.</p>
      </>}
    </div>}
  </div>;
}

interface StyleSliderProps {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
  compact?: boolean;
  unit?: "px" | "%";
  onChange: (value: number, historyBehavior: "transient") => void;
  onBegin: () => void;
  onFinish: () => void;
}

function StyleSlider({
  id,
  label,
  min,
  max,
  value,
  compact = false,
  unit = "px",
  onChange,
  onBegin,
  onFinish,
}: StyleSliderProps) {
  return (
    <div className={`min-w-0 ${compact ? "w-28" : ""}`}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-brand-ink">
          {label}
        </label>
        <span className="text-[11px] tabular-nums text-brand-muted">{value}{unit}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value), "transient")}
        onPointerDown={onBegin}
        onPointerUp={onFinish}
        onPointerCancel={onFinish}
        onKeyDown={(event) => {
          if (["ArrowLeft", "ArrowRight", "Home", "End", "PageDown", "PageUp"].includes(event.key)) {
            onBegin();
          }
        }}
        onKeyUp={onFinish}
        onBlur={onFinish}
        aria-label={`${label} in ${unit === "%" ? "percent" : "pixels"}`}
        className={`h-1.5 w-full cursor-pointer accent-brand-accent ${compact ? "max-w-28" : ""}`}
      />
    </div>
  );
}

function toggleClass(isSelected: boolean) {
  return `rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent ${
    isSelected ? "bg-brand-surface text-brand-ink" : "text-brand-muted hover:text-brand-ink"
  }`;
}
