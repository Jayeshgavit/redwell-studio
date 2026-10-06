"use client";

import type { Photo } from "@/types/editor";
import { useEffect, useRef, useState } from "react";

interface CollagePhotoLibraryProps {
  photos: Photo[];
  slotAssignments: Record<number, string>;
  slotCount: number;
  selectedPhotoId: string | null;
  onSelect: (id: string) => void;
  onBrowseLayouts: () => void;
}

/** A view of the existing photo collection; slot assignments remain provider-owned. */
export function CollagePhotoLibrary({
  photos,
  slotAssignments,
  slotCount,
  selectedPhotoId,
  onSelect,
  onBrowseLayouts,
}: CollagePhotoLibraryProps) {
  const [isExpanded, setIsExpanded] = useState(selectedPhotoId === null);
  const browseButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setIsExpanded(selectedPhotoId === null);
  }, [selectedPhotoId]);
  const slots = new Map(Object.entries(slotAssignments).map(([slot, id]) => [id, Number(slot)]));
  const assignedCount = photos.filter((photo) => slots.has(photo.id)).length;
  const unplacedCount = photos.length - assignedCount;
  const emptyCount = Math.max(0, slotCount - assignedCount);
  const selectedPhoto = photos.find((photo) => photo.id === selectedPhotoId);

  if (photos.length === 0) {
    return (
      <div className="border-t border-brand-border pt-4 text-xs leading-relaxed text-brand-muted">
        <p>Select several images in the file picker to upload them together.</p>
        <button
          type="button"
          onClick={onBrowseLayouts}
          className="mt-3 rounded-sm py-1 font-semibold text-brand-ink underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
        >
          Or choose a layout first →
        </button>
      </div>
    );
  }

  return (
    <section aria-label="Uploaded photos" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-brand-ink">Your photos</h3>
        <button
          ref={browseButtonRef}
          type="button"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          aria-expanded={isExpanded}
          aria-controls="collage-photo-tray"
          className="rounded-sm py-1 text-[11px] font-semibold text-brand-ink underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
        >
          {isExpanded ? "Hide photos" : `Browse photos (${photos.length})`}
        </button>
      </div>
      <p className="text-[11px] tabular-nums text-brand-muted">{assignedCount} of {slotCount} slots filled</p>
      <div id="collage-photo-tray" hidden={!isExpanded} className={isExpanded ? "grid max-h-48 grid-cols-3 gap-2 overflow-y-auto overscroll-contain p-0.5" : "hidden"}>
        {photos.map((photo, index) => {
          const slot = slots.get(photo.id);
          const isSelected = selectedPhotoId === photo.id;
          const status = slot === undefined ? "Not in layout" : photo.visible === false ? `Slot ${slot + 1} · hidden` : `Slot ${slot + 1}`;
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => {
                onSelect(photo.id);
                browseButtonRef.current?.focus({ preventScroll: true });
              }}
              aria-pressed={isSelected}
              aria-label={`Select photo ${index + 1}, ${status}${photo.locked ? ", locked" : ""}`}
              className={`min-w-0 rounded-md border p-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent ${isSelected ? "border-brand-accent bg-brand-accent-soft" : "border-brand-border hover:border-brand-muted"}`}
            >
              <img src={photo.src} alt="" loading="lazy" draggable={false} className="aspect-square w-full rounded-sm bg-brand-neutral object-cover" />
              <span className="mt-1 block truncate text-[10px] font-medium text-brand-muted" title={status}>{status}</span>
            </button>
          );
        })}
      </div>
      {selectedPhoto && !isExpanded && (
        <div className="flex items-center gap-3 border-t border-brand-border pt-3">
          <img src={selectedPhoto.src} alt="" className="h-10 w-10 shrink-0 rounded-sm object-cover" />
          <div className="min-w-0 text-xs">
            <p className="font-semibold text-brand-ink">Editing photo {photos.indexOf(selectedPhoto) + 1}</p>
            <p className="mt-1 text-[11px] text-brand-muted">
              {slots.has(selectedPhoto.id)
                ? `Slot ${(slots.get(selectedPhoto.id) ?? 0) + 1}${selectedPhoto.visible === false ? " · hidden" : ""}`
                : "Not in layout"}
            </p>
          </div>
        </div>
      )}
      {unplacedCount > 0 && <div className="border-l-2 border-brand-accent pl-3 text-xs leading-relaxed text-brand-muted">
        <p>{unplacedCount} uploaded {unplacedCount === 1 ? "photo is" : "photos are"} outside this layout and will not appear in preview or export. Switching layouts fills slots in upload order.</p>
        <button type="button" onClick={onBrowseLayouts} className="mt-2 rounded-sm py-1 font-semibold text-brand-ink underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">Review layouts →</button>
      </div>}
      {emptyCount > 0 && <p className="text-xs leading-relaxed text-brand-muted">{emptyCount} empty {emptyCount === 1 ? "slot" : "slots"}. Add more photos or use the + button in a slot.</p>}
      {selectedPhotoId === null && <p className="text-[11px] leading-relaxed text-brand-muted">Select a photo to adjust it. Drag inside a filled photo to change its crop; use its dotted handle to move or swap slots.</p>}
    </section>
  );
}
