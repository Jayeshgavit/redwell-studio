Before performing any task, read and follow RULES.md.
RULES.md contains mandatory repository safety and tooling restrictions.

# Redwell Studio agent guidance

Redwell Studio is a recovered project. The CURRENT working tree is authoritative:
the files currently on disk are the source of truth. Never restore, synchronize,
update, or replace them from Git history, another branch, or a remote unless the
user explicitly requests that operation. Read and follow RULES.md before working.

## Working process

1. Understand the requested task before modifying code.
2. Inspect only files relevant to that task.
3. Make the smallest necessary changes.
4. Preserve existing functionality unless explicitly asked to change it.
5. Never perform unrelated refactors.
6. Never remove existing features merely because they look unused.
7. After changes, run appropriate safe validation, such as TypeScript checks,
   lint, or a build, when useful. Avoid regenerating output for documentation-only
   work; validate the documentation and cleanup directly instead.
8. Report exactly which files were changed, created, or deleted, and which
   validation was performed.

## Existing product scope

Collage is the active product. Photo Editing and Carousel are temporarily
disabled, and their implementations must remain preserved for possible future
reactivation. Do not expose or reactivate them unless explicitly asked.

Protect shared dependencies and preserve the existing UI, editor behavior,
Collage, Carousel, and image editor functionality unless the task explicitly
requires a change. Inspect shared usage before changing shared components.

Before cleanup, verify each target is generated, debug, or obsolete material.
Do not delete application source, assets, package files, or configuration merely
because they appear unused.

## Project Architecture Map

This is a navigation guide derived from the current source, not an architectural
contract. Current source code remains authoritative if the architecture changes.
Paths below are relative to `frontend/`; editor filenames are relative to
`frontend/components/create/` unless otherwise indicated.

### Routes and editor entry points

- `app/page.tsx`: Collage landing page; links to `/create`. `app/layout.tsx`
  supplies root metadata and global CSS.
- `app/create/page.tsx`: `/create` mounts `EditorShell` from `editor-shell.tsx`.
  There are no separate Photo Editing or Carousel route entry points.
- `app/preview/page.tsx`: `/preview` mounts `LivePreviewWorkspace`; the editor
  opens it with a `channel` query parameter for a live preview session.
- `editor-shell.tsx`: Wraps the editor in `PhotoProvider`, wires tools, selection,
  shortcuts, canvas, dialogs, and preview; persists dock preferences in localStorage.
- `toolbar.tsx`, `top-bar.tsx`, `resizable-dock.tsx`, `context-panel.tsx`:
  Tool navigation, project actions, and responsive resizable/tabbed tool panels.

### Collage, canvas, and shared state

- `photo-context.tsx`: `PhotoProvider` / `usePhotos` own the shared document reducer:
  photos, slot assignments, layout/format/style, elements, text, and undo/redo transactions.
  Also manages image object URLs, a separate Collage timeline, Carousel slide timelines,
  slide operations, and template history; it is required by Collage, not just photo tools.
- `types/editor.ts`: Shared photo/filter, element, layout, style, text, and Carousel
  types; also defines `CANVAS_FORMATS`, `COLLAGE_LAYOUTS`, defaults, and editor tools.
- `fabric-canvas.tsx`: Active `FabricCanvasComponent` is a DOM/CSS artwork renderer,
  not a Fabric.js canvas; handles photo focus/slot swaps, element transforms, text editing,
  selection, visibility/locks, and history transactions. Preview uses its read-only mode.
- `canvas.tsx`: Separate Fabric.js implementation using `Canvas` and `FabricImage`
  on a fixed 500×500 canvas; currently not imported by the editor or preview routes.
- `use-viewport.ts`, `canvas-viewport.tsx`, `canvas-viewport-controls.tsx`:
  Workspace zoom, pan, and fit controls; CSS viewport transforms stay outside document state.

### Photos, layouts, layers, elements, and design

- `photo-toolbar.tsx`: Hidden native image picker exposed through a ref for uploads,
  filling a slot, and replacing a photo; required by Collage's photo actions.
- `image-adjustment-toolbar.tsx`, `photo-filters.ts`: Photo fit/fill/stretch, focus,
  zoom, rotation/flips, and filter controls; filter resolution/effects are shared by
  the editor renderer, layout/slide previews, and export.
- `layout-picker.tsx`: Collage layout filtering/thumbnails and Carousel story-layout
  selection. Cell geometry comes from `types/editor.ts`; `photo-context.tsx` applies
  layouts and assigns photos to slots, retaining photos beyond the available slots.
- `artwork-composition.ts`: `ArtworkComposition` is the preview/export snapshot;
  `getArtworkLayerStack` resolves common photo/text/element ordering using cell z-order,
  element z-index, and explicit layer orders for editor, previews, export, and history.
- `artwork-layers-panel.tsx`, `layer-order-controls.tsx`: Unified layer selection,
  visibility, locks, and front/back controls; shell callbacks update the shared provider.
- `elements-panel.tsx`, `element-toolbar.tsx`: Search/browse and create normalized
  elements; edit transforms, opacity/color, duplicate, and delete through shell callbacks.
- `elements/catalog.tsx`, `elements/element-artwork.tsx`, `public/assets/elements/`:
  Tabler icon/local artwork catalog and shared icon/mask/image rendering; export resolves
  the same catalog separately into rasterizable images.
- `carousel-story-copy.tsx`: Shared editorial text controls used by Collage's Design
  panel as well as Carousel; its Carousel name does not make it safe to remove for Collage.
- `collage-style-toolbar.tsx`: Document spacing, corner radius, background, and border
  controls; shared style state affects Collage and Carousel rendering/export.
- `app/globals.css`, `tailwind.config.ts`: Global UI theme variables and Tailwind
  brand tokens; distinct from the editable artwork's `CollageStyle` state.

### Carousel and output

- `carousel-workspace.tsx`: Slide navigation and draggable timeline; document/slide
  mutations live in `photo-context.tsx` and reuse the same editor canvas and tools.
- `carousel-story-templates.ts`, `carousel-template-picker.tsx`: Story layout/text
  placements and multi-slide templates; provider applies them using shared photo layouts.
- `carousel-slide-artwork.tsx`, `carousel-preview-dialog.tsx`: DOM artwork thumbnails
  for timeline/layout/template pickers and slideshow preview; reuse layer, filter, and
  element helpers, but are separate rendering paths from the main editor canvas.
- `export-dialog.tsx`, `export-service.ts`: PNG/JPG/WebP at 1×/2×/3×; Canvas 2D
  rasterization from composition snapshots, plus current/all Carousel slides as files
  or ZIP. Export renders artwork independently of viewport zoom and editor controls.
- `live-preview-workspace.tsx`, `live-preview-protocol.ts`: BroadcastChannel state,
  photo Blob transfer, and slide-selection messages between editor and `/preview`;
  preview uses `PhotoProvider` presentation state and the read-only active renderer.

### Coupling and scope caveats

- Collage and Carousel share the provider, types, canvas, photo/layout/element/layer/
  style tools, editorial text controls, and export. Changes to geometry, filters, layers,
  or assets must account for main-canvas, thumbnail, and Canvas 2D export rendering.
- The existing product-scope guidance above still applies. Current `editor-shell.tsx`
  nevertheless renders Collage/Carousel mode buttons and conditional Carousel UI;
  do not assume Carousel is gated off merely from the scope description.
