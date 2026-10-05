"use client";

import type { CollageStyle } from "@/types/editor";
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

        <div className="min-w-0">
          <label
            htmlFor="collage-background"
            className="mb-1.5 block text-xs font-medium text-brand-ink"
          >
            Background
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

interface StyleSliderProps {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
  compact?: boolean;
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
        <span className="text-[11px] tabular-nums text-brand-muted">{value}px</span>
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
        aria-label={`${label} in pixels`}
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
