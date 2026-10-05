"use client";

import type { CanvasElement } from "@/types/editor";
import type { HistoryBehavior } from "./photo-context";

interface ElementToolbarProps {
  element: CanvasElement;
  formatRatio: number;
  onUpdate: (id: string, updates: Partial<CanvasElement>, historyBehavior?: HistoryBehavior) => void;
  onDelete: (id: string) => void;
  onDuplicate: (element: CanvasElement) => void;
  onBeginTransaction: () => void;
  onFinishTransaction: () => void;
}

const COLOR_PRESETS = ["#ffffff", "#111827", "#ef4444", "#facc15"];

export function ElementToolbar({ element, formatRatio, onUpdate, onDelete, onDuplicate, onBeginTransaction, onFinishTransaction }: ElementToolbarProps) {
  const normalizedSize = Math.max(
    element.width / Math.min(1, formatRatio),
    element.height / Math.min(1, 1 / formatRatio)
  );
  const setSize = (size: number) => onUpdate(element.id, {
    width: size * Math.min(1, formatRatio),
    height: size * Math.min(1, 1 / formatRatio),
  }, "transient");

  return (
    <section aria-label="Element adjustments" className="w-full min-w-0">
      <div className="flex flex-col items-stretch gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-muted">Element</span>
        {element.supportsColor && (
          <div className="flex items-center gap-1.5" role="group" aria-label="Element color">
            <span className="text-[10px] font-medium uppercase tracking-wide text-brand-muted">Color</span>
            {COLOR_PRESETS.map((color) => (
              <button key={color} type="button" onClick={() => onUpdate(element.id, { color })} aria-label={`Set color ${color}`} aria-pressed={element.color === color} className={`h-7 w-7 rounded-full border ${element.color === color ? "ring-2 ring-brand-accent ring-offset-1" : "border-brand-border"}`} style={{ backgroundColor: color }} />
            ))}
            <input type="color" aria-label="Custom element color" value={element.color ?? "#111827"} onChange={(event) => onUpdate(element.id, { color: event.target.value })} className="h-8 w-9 cursor-pointer rounded border border-brand-border bg-brand-surface p-0.5" />
          </div>
        )}
        <Slider label="Opacity" min={0} max={1} step={0.01} value={element.opacity} display={`${Math.round(element.opacity * 100)}%`} onChange={(opacity) => onUpdate(element.id, { opacity }, "transient")} onBegin={onBeginTransaction} onFinish={onFinishTransaction} />
        <Slider label="Size" min={0.06} max={0.5} step={0.01} value={normalizedSize} display={`${Math.round(normalizedSize * 100)}%`} onChange={setSize} onBegin={onBeginTransaction} onFinish={onFinishTransaction} />
        <Slider label="Rotate" min={-180} max={180} step={1} value={normalizeAngle(element.rotation)} display={`${Math.round(normalizeAngle(element.rotation))}°`} onChange={(rotation) => onUpdate(element.id, { rotation }, "transient")} onBegin={onBeginTransaction} onFinish={onFinishTransaction} />
        <div className="flex flex-wrap items-center gap-1">
          <ActionButton pressed={element.flipX} onClick={() => onUpdate(element.id, { flipX: !element.flipX })}>Flip H</ActionButton>
          <ActionButton pressed={element.flipY} onClick={() => onUpdate(element.id, { flipY: !element.flipY })}>Flip V</ActionButton>
          <ActionButton onClick={() => onDuplicate(element)}>Duplicate</ActionButton>
        </div>
        <button
          type="button"
          onClick={() => onUpdate(element.id, {
            x: 0.5,
            y: 0.5,
            width: 0.18 * Math.min(1, formatRatio),
            height: 0.18 * Math.min(1, 1 / formatRatio),
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            color: element.supportsColor ? "#111827" : undefined,
            flipX: false,
            flipY: false,
          })}
          className="min-h-9 rounded-md border border-brand-border bg-brand-surface px-2.5 text-xs font-medium text-brand-ink hover:bg-brand-paper focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          Reset
        </button>
        <button type="button" onClick={() => onDelete(element.id)} className="min-h-9 self-end rounded-md border border-brand-accent/25 px-3 text-xs font-medium text-brand-accent-hover hover:bg-brand-accent-soft focus:outline-none focus:ring-2 focus:ring-brand-accent">Delete</button>
      </div>
    </section>
  );
}

function Slider({ label, min, max, step, value, display, onChange, onBegin, onFinish }: { label: string; min: number; max: number; step: number; value: number; display: string; onChange: (value: number) => void; onBegin: () => void; onFinish: () => void }) {
  return (
    <label className="flex w-full min-w-0 items-center gap-2">
      <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-brand-muted">{label}</span>
      <input type="range" min={min} max={max} step={step} value={Math.min(max, Math.max(min, value))} onChange={(event) => onChange(Number(event.target.value))} onPointerDown={onBegin} onPointerUp={onFinish} onPointerCancel={onFinish} onKeyDown={onBegin} onKeyUp={onFinish} onBlur={onFinish} className="h-1.5 min-w-12 flex-1 cursor-pointer accent-brand-accent" />
      <span className="w-10 text-right text-[11px] tabular-nums text-brand-muted">{display}</span>
    </label>
  );
}

function ActionButton({ children, onClick, title, pressed }: { children: import("react").ReactNode; onClick: () => void; title?: string; pressed?: boolean }) {
  return <button type="button" onClick={onClick} title={title} aria-pressed={pressed} className={`min-h-9 rounded-md border px-2.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent ${pressed ? "border-brand-accent/60 bg-brand-accent-soft text-brand-accent-hover" : "border-brand-border bg-brand-surface text-brand-ink hover:bg-brand-paper"}`}>{children}</button>;
}

function normalizeAngle(angle: number) {
  return ((angle % 360) + 540) % 360 - 180;
}
