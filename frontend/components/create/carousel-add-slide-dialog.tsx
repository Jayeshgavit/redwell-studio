"use client";

import { CAROUSEL_SLIDE_PRESETS } from "./carousel-slide-presets";
import { useDialogFocus } from "./use-dialog-focus";

export function CarouselAddSlideDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (presetId?: string) => void }) {
  const dialogRef = useDialogFocus(true, onClose);
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-brand-ink/45 p-2 sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="add-slide-title" className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-md border border-brand-border bg-brand-paper p-5 outline-none sm:p-6">
      <header className="flex items-start justify-between gap-3">
        <div><h2 id="add-slide-title" className="text-xl font-semibold tracking-tight">What comes next?</h2><p className="mt-1 text-xs text-brand-muted">Insert a slide after the selected one. Every composition is editable.</p></div>
        <button type="button" onClick={onClose} aria-label="Close add slide" className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-xl text-brand-muted hover:bg-brand-neutral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">×</button>
      </header>
      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {CAROUSEL_SLIDE_PRESETS.map((preset) => <button key={preset.id} type="button" onClick={() => onAdd(preset.id)} className="min-w-0 rounded border border-brand-border bg-brand-surface p-4 text-left hover:border-brand-accent hover:bg-brand-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">
          <span className="block text-sm font-semibold">{preset.name}</span><span className="mt-1 block text-xs leading-relaxed text-brand-muted">{preset.description}</span>
        </button>)}
      </div>
      <button type="button" onClick={() => onAdd()} className="mt-4 h-10 w-full rounded border border-dashed border-brand-border text-xs font-semibold text-brand-muted hover:bg-brand-neutral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">Start with a blank slide</button>
    </section>
  </div>;
}
