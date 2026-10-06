# Collage editor follow-up notes

This pass improves the existing Collage workflow and UI without changing document
state, renderer ownership, Carousel architecture, or the preserved Fabric implementation.

## Decisions

- Use the homepage's existing warm paper, charcoal, typography, and restrained red.
- Keep the canvas central; consolidate Collage mode/format controls and remove its
  duplicate Design shortcut. Keep mode switching and all six tools accessible.
- Keep resizable/tabbed docking and stored workspace preferences. Collage tabs use
  one scrollable row; small screens reserve more space for the canvas.
- Separate layout photo-count and composition-family filters. Featured compositions
  span photo counts; selected layouts do not leak into unrelated filter results.
- Use larger, format-aware layout thumbnails with opaque numbered empty slots.
  Preview photos follow upload order, matching the provider's layout-switch behavior.
- Show all uploaded photos, including those outside the layout; expose existing
  Replace/Remove actions in Collage, and explain occupancy before export. The photo
  tray collapses on selection to make room for adjustments and can be reopened.
- Keep shared-component defaults for Carousel; apply Collage variants explicitly.

## Deferred work

- Unplaced photos can be selected, adjusted, replaced, or removed, but placing an
  existing unassigned upload into an arbitrary slot needs a provider-level action.
  Changing layout currently reassigns photos in upload order; layouts support up to
  eight slots. Do not add a second assignment store in the photo library.
- The main DOM renderer, layout/slide thumbnails, and Canvas 2D export separately
  implement crop/frame/effect geometry. Layout thumbnails are composition previews,
  not exact export proofs (especially rotation, overlays, and border/corner styling).
  Consolidating render geometry deserves a separate, shared-feature review.
- Empty slots have dashed outlines in exported artwork, while read-only live preview
  treats them differently. Decide the desired output behavior before changing the
  shared export renderer; this pass warns that empty slots remain in the download.
- Only workspace panel preferences persist across reloads; there is no durable
  document save/recovery workflow. Photo sources and history live in memory.
- Unsupported/failed image loads are skipped by the existing upload path without
  detailed user feedback. Add explicit import status/error reporting in a focused pass.
- Export service supports WebP, but the existing dialog offers PNG/JPG only. Adding
  another output format is separate from this Collage UI pass.

## Validation and manual review

Baseline and updated TypeScript checks use `tsc --noEmit --incremental false`.
Node/React server-render smoke checks cover the empty editor, layout discovery and
format ratio, unplaced photo notices/selection, export notices, and Carousel defaults.
These checks do not exercise browser layout, pointer gestures, uploads, downloads,
BroadcastChannel, or focus effects.

Manual review should cover 320/375/414/768px and desktop widths; several-photo upload;
layout changes with fewer/more slots; crop/swap; replace/remove with undo/redo;
text/elements and hidden/locked layers; dock resizing/tab switching; and live preview
and PNG/JPG export. No browser automation or production build is used for this pass.
