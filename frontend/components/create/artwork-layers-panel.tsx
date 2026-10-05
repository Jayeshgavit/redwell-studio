"use client";

import type { ArtworkLayerEntry } from "./artwork-composition";
import { LayerOrderControls } from "./layer-order-controls";

export interface ArtworkLayerItem extends ArtworkLayerEntry {
  typeLabel: "IMAGE" | "TEXT" | "ELEMENT";
  label: string;
  detail: string;
  visible: boolean;
  locked: boolean;
}

interface ArtworkLayersPanelProps {
  items: ArtworkLayerItem[];
  selectedLayer: Pick<ArtworkLayerEntry, "kind" | "id"> | null;
  onSelect: (kind: ArtworkLayerEntry["kind"], id: string) => void;
  onToggleVisibility: (kind: ArtworkLayerEntry["kind"], id: string) => void;
  onToggleLock: (kind: ArtworkLayerEntry["kind"], id: string) => void;
  onReorder: (direction: "forward" | "backward" | "front" | "back") => void;
}

export function ArtworkLayersPanel({
  items,
  selectedLayer,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onReorder,
}: ArtworkLayersPanelProps) {
  return (
    <section aria-label="Layers on this canvas" className="flex min-h-0 flex-col gap-3">
      {items.length > 0 ? (
        <>
          <p className="text-[10px] text-brand-muted">Top of list is the front of the canvas.</p>
          <ol className="space-y-1">
          {[...items].reverse().map((item) => {
            const isSelected = selectedLayer?.kind === item.kind && selectedLayer.id === item.id;
            return (
              <li key={`${item.kind}:${item.id}`}>
                <div
                  className={`flex min-w-0 items-center gap-1 rounded-sm border px-1.5 py-1.5 ${
                    isSelected
                      ? "border-brand-accent/40 bg-brand-accent-soft"
                      : "border-transparent hover:border-brand-border hover:bg-brand-surface"
                  }`}
                >
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onSelect(item.kind, item.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-sm px-1 py-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500"
                  >
                    <span aria-hidden="true" className="w-4 shrink-0 text-center text-[10px] font-semibold text-brand-muted">
                      {item.kind === "photo" ? "▧" : item.kind === "storyText" ? "T" : "◇"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="shrink-0 text-[8px] font-semibold tracking-wide text-brand-muted">{item.typeLabel}</span>
                        <span className="truncate text-xs font-medium text-brand-ink">{item.label}</span>
                      </span>
                      {item.detail && <span className="block truncate text-[10px] text-brand-muted">{item.detail}</span>}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`${item.visible ? "Hide" : "Show"} ${item.label}`}
                    aria-pressed={item.visible}
                    title={item.visible ? "Hide layer" : "Show layer"}
                    onClick={() => onToggleVisibility(item.kind, item.id)}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500 ${
                      item.visible ? "text-brand-muted hover:bg-brand-paper hover:text-brand-ink" : "bg-brand-paper text-brand-accent-hover"
                    }`}
                  >
                    {item.visible ? "◉" : "○"}
                  </button>
                  <button
                    type="button"
                    aria-label={`${item.locked ? "Unlock" : "Lock"} ${item.label}`}
                    aria-pressed={item.locked}
                    title={item.locked ? "Unlock layer" : "Lock layer"}
                    onClick={() => onToggleLock(item.kind, item.id)}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500 ${
                      item.locked ? "bg-brand-paper text-brand-accent-hover" : "text-brand-muted hover:bg-brand-paper hover:text-brand-ink"
                    }`}
                  >
                    {item.locked ? "▣" : "▢"}
                  </button>
                </div>
              </li>
            );
          })}
          </ol>
          <LayerOrderControls
            hasSelection={selectedLayer !== null}
            onReorder={onReorder}
          />
        </>
      ) : (
        <p className="border-l-2 border-brand-accent pl-3 py-2 text-xs leading-relaxed text-brand-muted">
          Layers help you select, reorder, hide, and lock objects. Add a photo, text, or element to begin.
        </p>
      )}
    </section>
  );
}
