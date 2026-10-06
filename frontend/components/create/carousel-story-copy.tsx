"use client";

import { useState } from "react";
import type { CarouselStoryTextItem, CarouselStoryTextRole } from "@/types/editor";

interface CarouselStoryCopyProps {
  isCollage?: boolean;
  items: CarouselStoryTextItem[];
  selectedItemId: string | null;
  canAdd: boolean;
  onSelect: (id: string | null) => void;
  onBrowseElements: () => void;
  onUpdate: (
    id: string,
    updates: Partial<Omit<CarouselStoryTextItem, "id">>,
    historyBehavior: "commit" | "transient"
  ) => void;
  onAdd: (role?: CarouselStoryTextRole) => void;
  onRemove: (id: string) => void;
  onBeginTransaction: () => void;
  onFinishTransaction: () => void;
}

const ROLE_LABELS: Record<CarouselStoryTextItem["role"], string> = {
  eyebrow: "Small label",
  title: "Headline",
  subtitle: "Subtitle",
  body: "Caption",
  metadata: "Date",
  location: "Location",
  quote: "Quote",
  cta: "Badge",
};

const WEIGHTS = [300, 400, 500, 600, 700];

export function CarouselStoryCopy({
  isCollage = false,
  items,
  selectedItemId,
  canAdd,
  onSelect,
  onBrowseElements,
  onUpdate,
  onAdd,
  onRemove,
  onBeginTransaction,
  onFinishTransaction,
}: CarouselStoryCopyProps) {
  const [newRole, setNewRole] = useState<CarouselStoryTextRole>("body");
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;
  const roleLabel = (role: CarouselStoryTextRole) => !isCollage && role === "body" ? "Body text" : !isCollage && role === "cta" ? "Call to action" : ROLE_LABELS[role];

  return (
    <section aria-label={isCollage ? "Collage text editing" : "Slide text editing"} className="space-y-3 border-b border-brand-border pb-4">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-accent-hover">{isCollage ? "Text blocks" : "Slide text"}</p>
          <p className="mt-1 text-xs leading-relaxed text-brand-muted">Select copy to adjust its wording and placement.</p>
        </div>
        {selectedItemId && (
          <button
            type="button"
            onClick={onBrowseElements}
            className="shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold text-brand-accent-hover hover:bg-brand-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
          >
            Elements
          </button>
        )}
      </header>

      {items.length > 0 ? (
        <div className="space-y-1.5" role="list" aria-label={isCollage ? "Text blocks on this collage" : "Text blocks on this slide"}>
          {items.map((item) => (
            <div
              key={item.id}
              role="listitem"
              className={selectedItemId === item.id
                ? "flex min-w-0 items-center gap-2 rounded-md border border-brand-accent/40 bg-brand-accent-soft px-2 py-1.5"
                : "flex min-w-0 items-center gap-2 rounded-md border border-brand-border bg-brand-surface px-2 py-1.5"}
            >
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-pressed={selectedItemId === item.id}
                className="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
              >
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                  {roleLabel(item.role)}
                </span>
                <span className="block truncate text-xs text-brand-ink">
                  {item.text || "Add your wording"}
                </span>
              </button>
              <button
                type="button"
                disabled={item.locked === true}
                onClick={() => {
                  onRemove(item.id);
                  if (selectedItemId === item.id) onSelect(null);
                }}
                aria-label={"Delete " + ROLE_LABELS[item.role] + " text"}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-sm text-brand-muted/70 transition-colors hover:bg-brand-accent-soft hover:text-brand-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-md bg-brand-paper px-3 py-2 text-xs leading-relaxed text-brand-muted">
          {isCollage ? "Add a headline, caption, date, or label. Select text to edit it; drag it on the canvas to place it." : "This slide has no copy yet. Add a text field to begin."}
        </p>
      )}

      {selectedItem && (
        selectedItem.locked ? (
          <p className="border-l-2 border-brand-accent pl-3 py-2 text-xs leading-relaxed text-brand-muted">
            This text is locked. Unlock it in Layers to edit or move it.
          </p>
        ) : (
        <div className="space-y-3 rounded-lg border border-brand-border bg-brand-surface p-3">
          <label className="block space-y-1.5">
            <span className="text-[11px] font-semibold text-brand-muted">{roleLabel(selectedItem.role)}</span>
            <textarea
              value={selectedItem.text}
              rows={selectedItem.role === "body" || selectedItem.role === "quote" ? 3 : 2}
              maxLength={isCollage ? 180 : 1200}
              onFocus={() => {
                onSelect(selectedItem.id);
                onBeginTransaction();
              }}
              onBlur={onFinishTransaction}
              onChange={(event) => onUpdate(selectedItem.id, { text: event.target.value }, "transient")}
              className="w-full resize-y rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm leading-relaxed text-brand-ink outline-none transition-colors placeholder:text-brand-muted/70 focus:border-brand-accent/60 focus:ring-2 focus:ring-brand-accent-soft"
            />
          </label>

          {!isCollage && <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1 text-[10px] text-brand-muted"><span className="block">Typeface</span><select value={selectedItem.fontFamily} onChange={(event) => onUpdate(selectedItem.id, { fontFamily: event.target.value as "serif" | "sans" }, "commit")} className="h-9 w-full rounded border border-brand-border bg-brand-surface px-2 text-xs text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"><option value="serif">Editorial serif</option><option value="sans">Clean sans</option></select></label>
            <label className="space-y-1 text-[10px] text-brand-muted"><span className="block">Line height</span><input type="number" min={0.8} max={2.5} step={0.05} value={selectedItem.lineHeight} onFocus={onBeginTransaction} onBlur={onFinishTransaction} onChange={(event) => onUpdate(selectedItem.id, { lineHeight: Math.max(0.8, Math.min(2.5, Number(event.target.value) || 1)) }, "transient")} className="h-9 w-full rounded border border-brand-border px-2 text-xs text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent" /></label>
            <label className="space-y-1 text-[10px] text-brand-muted"><span className="block">Text width (%)</span><input type="number" min={5} max={100} value={Math.round(selectedItem.width * 100)} onFocus={onBeginTransaction} onBlur={onFinishTransaction} onChange={(event) => onUpdate(selectedItem.id, { width: Math.max(0.05, Math.min(1, Number(event.target.value) / 100)) }, "transient")} className="h-9 w-full rounded border border-brand-border px-2 text-xs text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent" /></label>
            <label className="space-y-1 text-[10px] text-brand-muted"><span className="block">Letter spacing (px)</span><input type="number" min={-4} max={12} step={0.5} value={selectedItem.letterSpacing} onFocus={onBeginTransaction} onBlur={onFinishTransaction} onChange={(event) => onUpdate(selectedItem.id, { letterSpacing: Math.max(-4, Math.min(12, Number(event.target.value))) }, "transient")} className="h-9 w-full rounded border border-brand-border px-2 text-xs text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent" /></label>
          </div>}

          <label className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-[10px] font-medium uppercase tracking-wide text-brand-muted">Size</span>
            <input
              type="range"
              min="12"
              max="140"
              step="1"
              value={selectedItem.fontSize}
              onPointerDown={onBeginTransaction}
              onPointerUp={onFinishTransaction}
              onPointerCancel={onFinishTransaction}
              onKeyDown={onBeginTransaction}
              onKeyUp={onFinishTransaction}
              onBlur={onFinishTransaction}
              onChange={(event) =>
                onUpdate(selectedItem.id, { fontSize: Number(event.target.value) }, "transient")
              }
              className="h-1.5 min-w-12 flex-1 cursor-pointer accent-brand-accent"
            />
            <span className="w-10 text-right text-[11px] tabular-nums text-brand-muted">
              {Math.round(selectedItem.fontSize)}px
            </span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-[10px] font-medium uppercase tracking-wide text-brand-muted">Weight</span>
              <select
                value={selectedItem.fontWeight}
                onChange={(event) =>
                  onUpdate(selectedItem.id, { fontWeight: Number(event.target.value) }, "commit")
                }
                className="h-9 min-w-0 rounded-md border border-brand-border bg-brand-surface px-2 text-xs text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent"
              >
                {WEIGHTS.map((weight) => (
                  <option key={weight} value={weight}>{weight}</option>
                ))}
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-[10px] font-medium uppercase tracking-wide text-brand-muted">Color</span>
              <input
                type="color"
                value={toHexColor(selectedItem.color)}
                onPointerDown={onBeginTransaction}
                onPointerUp={onFinishTransaction}
                onPointerCancel={onFinishTransaction}
                onKeyDown={onBeginTransaction}
                onKeyUp={onFinishTransaction}
                onBlur={onFinishTransaction}
                onChange={(event) =>
                  onUpdate(selectedItem.id, { color: event.target.value }, "transient")
                }
                className="h-9 w-full cursor-pointer rounded-md border border-brand-border bg-brand-surface p-1"
              />
            </label>
          </div>

          <div>
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-brand-muted">Alignment</span>
            <div className="flex gap-1" role="group" aria-label="Text alignment">
              {(["left", "center", "right"] as const).map((alignment) => (
                <button
                  key={alignment}
                  type="button"
                  aria-pressed={selectedItem.textAlign === alignment}
                  onClick={() => onUpdate(selectedItem.id, { textAlign: alignment }, "commit")}
                  className={selectedItem.textAlign === alignment
                    ? "h-8 flex-1 rounded-md border border-brand-accent/60 bg-brand-accent-soft text-xs capitalize text-brand-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                    : "h-8 flex-1 rounded-md border border-brand-border text-xs capitalize text-brand-muted hover:bg-brand-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"}
                >
                  {alignment}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-brand-muted">Position</span>
            <div className="grid grid-cols-2 gap-2">
              {(["x", "y"] as const).map((axis) => (
                <label key={axis} className="flex min-w-0 items-center gap-1.5">
                  <span className="w-3 text-[10px] font-semibold uppercase text-brand-muted">{axis}</span>
                  <input
                    type="number"
                    min={0}
                    max={Math.floor((1 - selectedItem[axis === "x" ? "width" : "height"]) * 100)}
                    step="1"
                    value={Math.round(Math.max(
                      0,
                      Math.min(
                        1 - selectedItem[axis === "x" ? "width" : "height"],
                        selectedItem[axis]
                      )
                    ) * 100)}
                    onFocus={onBeginTransaction}
                    onBlur={onFinishTransaction}
                    onChange={(event) => {
                      const size = selectedItem[axis === "x" ? "width" : "height"];
                      const maxPosition = 1 - size;
                      const requested = Number(event.target.value) / 100;
                      const position = Math.max(0, Math.min(maxPosition, requested));
                      onUpdate(selectedItem.id, { [axis]: position }, "transient");
                    }}
                    className="h-8 min-w-0 flex-1 rounded-md border border-brand-border px-2 text-xs text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </label>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-brand-muted/70">{isCollage ? "Drag text on the canvas or enter its position here." : "The dashed guide is optional; text can move to any canvas edge."}</p>
          </div>
        </div>
        )
      )}

      {!isCollage && <label className="flex items-center gap-2 text-xs text-brand-muted"><span>New block</span><select aria-label="New text block type" value={newRole} onChange={(event) => setNewRole(event.target.value as CarouselStoryTextRole)} className="h-9 min-w-0 flex-1 rounded border border-brand-border bg-brand-surface px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">{(Object.keys(ROLE_LABELS) as CarouselStoryTextRole[]).map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select></label>}
      <button
        type="button"
        disabled={!canAdd}
        onClick={() => onAdd(isCollage ? undefined : newRole)}
        className="w-full rounded-md border border-dashed border-brand-border px-3 py-2 text-xs font-medium text-brand-muted transition-colors hover:border-brand-accent/60 hover:bg-brand-accent-soft hover:text-brand-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent disabled:cursor-not-allowed disabled:text-brand-muted/50 disabled:hover:border-brand-border disabled:hover:bg-transparent"
      >
        {isCollage ? "+ Add text" : "+ Add text field"}
      </button>
    </section>
  );
}

function toHexColor(color: string) {
  if (/^#[\da-f]{6}$/i.test(color)) return color;
  if (/^#[\da-f]{3}$/i.test(color)) {
    return "#" + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  }
  return "#29251f";
}
