"use client";

import { CAROUSEL_THEMES } from "./carousel-themes";
import type { CarouselState } from "@/types/editor";

export function CarouselDesignPanel({ carousel, onTheme }: { carousel: CarouselState; onTheme: (themeId: string) => void }) {
  return <section aria-label="Carousel theme" className="mb-5 space-y-3 border-b border-brand-border pb-5">
    <div><h2 className="text-base font-semibold tracking-tight">One story. One visual language.</h2><p className="mt-2 text-xs leading-relaxed text-brand-muted">Apply colors, font pairing, and image spacing across your story. Local styling and locked text keep their changes.</p></div>
    <div className="grid grid-cols-2 gap-2">
      {CAROUSEL_THEMES.map((theme) => <button key={theme.id} type="button" aria-pressed={carousel.themeId === theme.id} onClick={() => onTheme(theme.id)} className={`min-w-0 rounded border p-3 text-left hover:border-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${carousel.themeId === theme.id ? "border-brand-accent bg-brand-accent-soft" : "border-brand-border bg-brand-surface"}`}>
        <span aria-hidden="true" className="mb-2 flex h-9 overflow-hidden border border-brand-border"><span className="flex flex-1 items-center justify-center text-lg" style={{ backgroundColor: theme.paper, color: theme.ink, fontFamily: theme.headingFont === "serif" ? "Georgia, serif" : "inherit", fontWeight: theme.headingWeight }}>Aa</span><span className="w-5" style={{ backgroundColor: theme.ink }} /><span className="w-5" style={{ backgroundColor: theme.accent }} /></span>
        <span className="block text-xs font-semibold">{theme.name}</span><span className="mt-1 block text-[10px] leading-relaxed text-brand-muted">{theme.description}</span>
      </button>)}
    </div>
    <p className="text-[11px] leading-relaxed text-brand-muted">The controls below style the selected slide. Use Undo to reverse a theme change.</p>
  </section>;
}
