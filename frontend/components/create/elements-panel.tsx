"use client";

import { useMemo, useState } from "react";
import type { CanvasFormat, CanvasElement } from "@/types/editor";
import { ELEMENT_CATEGORIES, ELEMENT_CATALOG, type CatalogElement, type ElementCategoryFilter } from "./elements/catalog";
import { ElementArtwork } from "./elements/element-artwork";

interface ElementsPanelProps {
  format: CanvasFormat;
  selectedAssetId?: string | null;
  onAdd: (element: CanvasElement) => void;
}

export function ElementsPanel({ format, selectedAssetId = null, onAdd }: ElementsPanelProps) {
  const [category, setCategory] = useState<ElementCategoryFilter>("all");
  const [query, setQuery] = useState("");
  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return ELEMENT_CATALOG.filter((asset) => {
      const inCategory = category === "all" ||
        (category === "icons" ? asset.type === "icon" :
          category === "doodles" ? asset.type === "doodle" : asset.category === category);
      const matchesQuery = !normalizedQuery || [asset.name, asset.category, ...asset.tags]
        .some((value) => value.toLowerCase().includes(normalizedQuery));
      return inCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <section aria-label="Elements library" className="w-full min-w-0">
      <div className="space-y-1.5">
        <label htmlFor="element-search" className="block text-xs font-medium text-brand-ink">
          Search elements
        </label>
        <input
          id="element-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search elements..."
          className="h-10 w-full min-w-0 rounded-md border border-brand-border px-3 text-sm outline-none placeholder:text-brand-muted/70 focus:border-brand-accent/60 focus:ring-2 focus:ring-brand-accent-soft"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Element categories">
        {ELEMENT_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={category === item.id}
            onClick={() => setCategory(item.id)}
            className={`min-h-8 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${category === item.id ? "bg-brand-accent text-white" : "bg-brand-neutral text-brand-muted hover:bg-brand-border"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        className="mt-3 grid min-w-0 gap-2"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))" }}
        aria-live="polite"
      >
        {filteredAssets.map((asset) => (
          <ElementTile
            key={asset.id}
            asset={asset}
            isSelected={asset.id === selectedAssetId}
            onClick={() => onAdd(createCanvasElement(asset, format.ratio))}
          />
        ))}
        {filteredAssets.length === 0 && <p className="col-span-full py-4 text-center text-xs text-brand-muted">No elements found.</p>}
      </div>
    </section>
  );
}

function ElementTile({ asset, isSelected, onClick }: { asset: CatalogElement; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Add ${asset.name}`}
      aria-pressed={isSelected}
      title={asset.name}
      className={`flex h-[84px] min-w-0 flex-col items-center justify-center gap-1 rounded-lg border p-1.5 text-brand-ink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${isSelected ? "border-brand-accent/60 bg-brand-accent-soft ring-1 ring-brand-accent" : "border-brand-border bg-brand-surface hover:border-brand-accent/40 hover:bg-brand-accent-soft"}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center text-brand-ink">
        <ElementArtwork assetId={asset.id} className="h-full w-full object-contain" />
      </span>
      <span className="w-full truncate text-center text-[10px] font-medium">{asset.name}</span>
    </button>
  );
}

function createCanvasElement(asset: CatalogElement, ratio: number): CanvasElement {
  const size = 0.18;
  return {
    id: crypto.randomUUID(),
    type: asset.type,
    assetId: asset.id,
    src: asset.src,
    x: 0.5,
    y: 0.5,
    width: size * Math.min(1, ratio),
    height: size * Math.min(1, 1 / ratio),
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    color: asset.supportsColor ? "#111827" : undefined,
    flipX: false,
    flipY: false,
    zIndex: Date.now(),
    supportsColor: asset.supportsColor,
  };
}
