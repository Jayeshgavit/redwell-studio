"use client";

/* Hallmark · pre-emit critique: P4 H4 E4 S5 R5 V4 · Redwell editorial workbench */
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { IconChevronLeft, IconChevronRight, IconCopy, IconTrash, IconPlus, IconChevronUp, IconChevronDown, IconList, IconLayoutCollage } from "@tabler/icons-react";
import type { CarouselState, CarouselStorySlideType } from "@/types/editor";
import { CarouselSlideArtwork } from "./carousel-slide-artwork";
import { getCarouselSlideTitle } from "./carousel-slide-presets";

const actionClass = "flex h-8 shrink-0 items-center justify-center gap-1 rounded px-2 text-xs font-medium text-brand-muted hover:bg-brand-neutral hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent disabled:cursor-not-allowed disabled:opacity-30";

interface CarouselTimelineProps {
  carousel: CarouselState;
  onSelect: (slideId: string) => void;
  onAdd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onReorder: (slideId: string, targetSlideId: string, placement: "before" | "after") => void;
  onTemplates: () => void;
  templatesOpen?: boolean;
  addSlideOpen?: boolean;
}

export function CarouselTimeline({ carousel, onSelect, onAdd, onDuplicate, onDelete, onReorder, onTemplates, templatesOpen = false, addSlideOpen = false }: CarouselTimelineProps) {
  const slides = useMemo(() => [...carousel.slides].sort((a, b) => a.order - b.order), [carousel.slides]);
  const activeIndex = slides.findIndex((slide) => slide.id === carousel.activeSlideId);
  const [outline, setOutline] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; placement: "before" | "after" } | null>(null);
  const slideRefs = useRef(new Map<string, HTMLDivElement>());
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    slideRefs.current.get(carousel.activeSlideId)?.scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
  }, [carousel.activeSlideId, outline, collapsed]);

  const placement = (event: DragEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientX < rect.left + rect.width / 2 ? "before" : "after";
  };
  const finishDrag = () => { setDraggedId(null); setDropTarget(null); };
  const move = (id: string, direction: -1 | 1) => {
    const index = slides.findIndex((slide) => slide.id === id);
    const target = slides[index + direction];
    if (!target) return;
    onReorder(id, target.id, direction === -1 ? "before" : "after");
    setAnnouncement(`Slide moved to position ${index + direction + 1}.`);
  };

  return <section aria-label="Carousel story sequence" className="editor-timeline min-h-0 flex-none overflow-hidden border-t border-brand-border bg-brand-paper px-2 py-1.5">
    <div className={`${collapsed ? "" : "mb-1"} carousel-filmstrip-controls flex items-center justify-between gap-2 overflow-x-auto whitespace-nowrap [scrollbar-width:thin]`}>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" aria-label="Previous slide" disabled={activeIndex <= 0} onClick={() => onSelect(slides[activeIndex - 1].id)} className={actionClass}><IconChevronLeft size={16} /></button>
        <span aria-live="polite" className="whitespace-nowrap text-xs font-semibold tabular-nums">{activeIndex + 1} / {slides.length}</span>
        <button type="button" aria-label="Next slide" disabled={activeIndex >= slides.length - 1} onClick={() => onSelect(slides[activeIndex + 1].id)} className={actionClass}><IconChevronRight size={16} /></button>
        <button type="button" aria-label="Duplicate selected slide" title="Duplicate selected slide" onClick={onDuplicate} className={actionClass}><IconCopy size={16} /></button>
        <button type="button" aria-label="Delete selected slide" title="Delete selected slide · Undo to restore" disabled={slides.length <= 1} onClick={onDelete} className={actionClass}><IconTrash size={16} /></button>
        <div role="group" aria-label="Reorder selected slide" className="ml-1 flex items-center border-l border-brand-border pl-1">
          <button type="button" aria-label="Move selected slide earlier" title="Move earlier (Alt + ← on thumbnail)" disabled={activeIndex <= 0} onClick={() => move(carousel.activeSlideId, -1)} className={actionClass}><IconChevronLeft size={13} /></button>
          <button type="button" aria-label="Move selected slide later" title="Move later (Alt + → on thumbnail)" disabled={activeIndex < 0 || activeIndex >= slides.length - 1} onClick={() => move(carousel.activeSlideId, 1)} className={actionClass}><IconChevronRight size={13} /></button>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" aria-expanded={!collapsed} aria-controls="carousel-filmstrip" onClick={() => setCollapsed(!collapsed)} data-active={collapsed} className="carousel-action carousel-action-secondary">{collapsed ? <IconChevronUp size={15} aria-hidden="true" /> : <IconChevronDown size={15} aria-hidden="true" />}{collapsed ? "Show slides" : "Hide slides"}</button>
        <button type="button" aria-pressed={outline} onClick={() => { setOutline(!outline); setCollapsed(false); }} className="carousel-action carousel-action-secondary"><IconList size={15} aria-hidden="true" />{outline ? "Filmstrip" : "Outline"}</button>
        <button type="button" onClick={onTemplates} aria-haspopup="dialog" aria-expanded={templatesOpen} data-active={templatesOpen} className="carousel-action carousel-action-creative"><IconLayoutCollage size={15} aria-hidden="true" />Story templates</button>
        <button type="button" onClick={onAdd} aria-haspopup="dialog" aria-expanded={addSlideOpen} data-active={addSlideOpen} className="carousel-action carousel-action-primary"><IconPlus size={15} aria-hidden="true" /><span>Add slide</span></button>
      </div>
    </div>
    <p className="sr-only" role="status">{announcement}</p>
    <div id="carousel-filmstrip" hidden={collapsed} className={`${collapsed ? "hidden" : "flex"} min-h-0 flex-nowrap items-stretch gap-1.5 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [scrollbar-width:thin]`} aria-label={outline ? "Story outline" : "Slide filmstrip"}>
      {slides.map((slide, index) => {
        const active = slide.id === carousel.activeSlideId;
        const title = getCarouselSlideTitle(slide);
        return <div key={slide.id} ref={(node) => { if (node) slideRefs.current.set(slide.id, node); else slideRefs.current.delete(slide.id); }}
          draggable role="group" aria-label={`Slide ${index + 1} reorder area`}
          onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("application/x-redwell-slide", slide.id); setDraggedId(slide.id); }}
          onDragEnd={finishDrag}
          onDragOver={(event) => { if (!draggedId || draggedId === slide.id) return; event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropTarget({ id: slide.id, placement: placement(event) }); }}
          onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(null); }}
          onDrop={(event) => { event.preventDefault(); const source = event.dataTransfer.getData("application/x-redwell-slide"); if (source && source !== slide.id) { onReorder(source, slide.id, placement(event)); setAnnouncement("Slide order updated."); } finishDrag(); }}
          className={`relative flex-none rounded border p-1 ${outline ? "w-48" : "w-40"} ${active ? "border-brand-accent bg-brand-accent-soft ring-1 ring-brand-accent" : "border-brand-border bg-brand-surface"} ${draggedId === slide.id ? "opacity-40" : ""}`}>
          {dropTarget?.id === slide.id && <span aria-hidden="true" className={`pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-brand-accent ${dropTarget.placement === "before" ? "-left-1.5" : "-right-1.5"}`} />}
          <button type="button" aria-current={active ? "step" : undefined} aria-label={`Edit slide ${index + 1}: ${title}`} onClick={() => onSelect(slide.id)}
            onKeyDown={(event) => { if (event.altKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); move(slide.id, event.key === "ArrowLeft" ? -1 : 1); } }}
            className={`${outline ? "block" : "flex items-center gap-2"} w-full min-w-0 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent`}>
            {!outline && <span aria-hidden="true" className="carousel-filmstrip-preview flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden bg-brand-neutral" style={{ contentVisibility: "auto" }}><CarouselSlideArtwork slide={slide} maxWidth={56} maxHeight={56} className="shadow-none" /></span>}
            <span className="block min-w-0 flex-1 px-1">
              <span className="flex items-center gap-1 text-[10px]"><span className={`font-bold tabular-nums ${active ? "text-brand-accent-hover" : "text-brand-ink"}`}>{String(index + 1).padStart(2, "0")}</span><span className="truncate text-brand-muted">{getCarouselSlideRole(slide.storySlideType)}</span></span>
              <span className="mt-0.5 block truncate text-xs font-semibold" title={title}>{title}</span>
              {outline && <span className="mt-0.5 block truncate text-[10px] text-brand-muted">{slide.storyText?.find((item) => item.role === "body")?.text || `${slide.photos.length} photos · ${slide.elements.length} elements`}</span>}
            </span>
          </button>
        </div>;
      })}
    </div>
  </section>;
}

export function getCarouselSlideRole(type?: CarouselStorySlideType | null) {
  const roles: Record<CarouselStorySlideType, string> = {
    cover: "Cover", introduction: "Context", journey: "Story", detail: "Detail", experience: "Moment", highlight: "Highlight",
    ending: "Closing", gallery: "Photo", list: "List", tip: "Idea", "before-after": "Comparison", quote: "Quote", cta: "CTA",
  };
  return type ? roles[type] : "Freeform";
}
