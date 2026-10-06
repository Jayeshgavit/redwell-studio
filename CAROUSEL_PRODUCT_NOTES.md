# Carousel product and architecture — first major upgrade

This implementation uses the recovered working tree as its source of truth. It
extends the existing `/create` editor; it introduces no new editor route, backend,
dependency, AI copy service, or alternative canvas library. Photo Editing remains
preserved. Collage keeps its own document and history.

## Audit of the previous product

- Each slide already contained a complete composition: photos, slot assignments,
  format, layout, style, elements, and text. The active slide already used the same
  DOM editor as Collage. A second slide editor would duplicate working infrastructure.
- The filmstrip reduced artwork to roughly 52 × 28 pixels and hid useful story
  information. Management controls competed with mode, Design, format, and zoom
  controls above the canvas. Adding a slide used a template overflow definition or
  an empty composition; there was no clear choice of slide purpose.
- Templates offered many travel/photo narratives but few useful text-first
  structures. Several supposed text compositions still required photo slots.
  Template replacement preserved photos/elements but replaced text and styling;
  that consequence was not clearly explained.
- Formats belonged to individual slides, so slides in one story could drift apart.
  Templates could also change the current format. There was no Carousel theme model
  or record of which styles were generated versus customized.
- Text was limited to one block per semantic role and 180 characters in the panel.
  Font family, width, line height, and tracking were not exposed there. Intrinsic
  DOM text width made centered/right alignment differ from export. Raster export
  silently truncated text to its placement height and did not honor tracking.
- Add, duplicate, and delete did not create document undo entries. Reordering used
  a separate history stack; template undo compared slide history lengths, which
  become unreliable once the 100-snapshot cap is reached. Changes on another slide
  could block a document undo without making the relevant slide active.
- Carousel export required an assigned photo, silently omitting quote, text, and
  element compositions. Filtering also changed filename numbering. The shared
  rasterizer itself was already capable of rendering these compositions.
- Carousel's photo panel did not use Collage's improved uploaded-photo library.
  Asynchronous uploads/replacements applied to whichever document was active on
  completion rather than reliably returning to the document where they started.
- The active canvas is DOM/CSS, despite its Fabric name. The separate Fabric.js
  implementation is not used by `/create` or `/preview` and remains preserved.

## Resulting workflow and product decisions

1. Select Carousel in the existing editor. An empty Carousel starts in portrait
   with Redwell styling; entering from a composed Collage clones that composition
   with independent layer IDs and shared image source URLs.
2. Choose a complete story structure or begin with photos. Template selection shows
   the entire proposed sequence before application. Replacing an existing story
   explicitly says that copy/styling will be replaced and Undo restores the story.
3. Add Cover, Content, Photo + note, Quote, Comparison, Closing/CTA, or a blank slide.
   New slides are inserted after the selected slide; duplication preserves its
   content and styling. Slide insertion does not depend on a hidden overflow rule.
4. Edit one slide with the shared photo, layout, text, element, layer, style, and
   viewport systems. Both story compositions and Collage's photo layouts are
   accessible. New text blocks are selected immediately for editing.
5. Use the bottom filmstrip to navigate, duplicate, delete, or reorder. It shows
   readable artwork, order, role, and active state. Outline mode emphasizes titles
   and copy and uses less vertical space. Move buttons work with touch/keyboard;
   Alt + Left/Right on a thumbnail provides another reorder path.
6. Apply one visual theme and one format across the story. Style controls below the
   theme picker affect only the selected slide. Existing local styling survives
   subsequent theme changes.
7. Batch-upload photos, then turn unplaced photos into individual editable photo
   slides after the selected slide. This moves existing photo records and retains
   source copy rather than re-importing image binaries or rebuilding a template.
8. Review the story in an in-editor sequence preview or an overview grid. Done
   retains the editing context; Edit slide jumps to the reviewed slide. Dialogs
   contain focus, support Escape, and restore their trigger.
9. Export the complete ordered story by default as a ZIP of PNG/JPG images, or
   choose separate files/current slide. Existing 1×/2×/3× quality/resolution controls
   and local Canvas 2D/ZIP generation remain. Blank/background-only, text-only, and
   element-only slides participate in export.

The application chrome adopts Collage's warm paper, charcoal, restrained red,
Tabler icons, compact mode/format controls, and scrolling dock tabs. No new display
font, shadow-heavy chrome, decorative animation, or generic dashboard surface is
introduced.

## State ownership and boundaries

| Owner | Responsibility |
| --- | --- |
| `PhotoProvider` / shared reducer | One active composition, isolated Collage timeline, slide timelines, Carousel document commands, object URL lifetime |
| `CarouselState` | Document ID, ordered slide collection, active slide ID, template/theme IDs, common format |
| `CarouselSlide` | Complete editable composition and optional generated style defaults; no second photo assignment store |
| Text item | Wording, geometry, typography, layer order, visibility/lock, optional generated theme defaults and flowing `textBox` behavior |
| `EditorShell` | Selection, panels/dialogs, preview wiring, upload picker, viewport; no duplicated document state |
| Carousel data modules | Slide starters, sequence templates, reserved-copy compositions, theme definitions and merging |
| Renderers/export | Read composition values; themes are materialized into those values, not global CSS overrides |

Reused from Collage: the active DOM artwork renderer; shared photo state/import,
fit/crop/focus/rotation/filter controls; uploaded-photo library; layout geometry;
normalized text/elements; unified layers; visibility/locks; style controls;
transaction-based editing; viewport zoom/pan/fit; responsive dock; live preview
protocol; and Canvas 2D/ZIP export.

Carousel-specific: ordered slide/document commands, filmstrip/outline, slide
starters, reserved-copy compositions, storytelling templates, theme application,
photo distribution, and sequence/overview preview. Carousel-only photo geometries
live outside `COLLAGE_LAYOUTS`; `resolveCreativeLayout` resolves either catalog.

The old template snapshot mechanism now records all Carousel document commands.
The separate reorder stack has been replaced by that mechanism. Each command
finishes a pending transaction, clears redo branches, and captures before/after
slide data and timelines. Snapshots share immutable image URLs/records; duplication
allocates independent layer IDs. Local slide editing remains local history. When
newer edits on another slide must be undone before a document command, that slide
is selected. This is not a universal chronological history of every cross-slide
keystroke.

Theme updates compare each field with its last generated default. Fields that still
match are updated; changed fields remain local overrides. Geometry, copy, photo
transforms/filters, and element styling are not recolored or repositioned by themes.
Locked text is preserved. Legacy layout styles opt in only where they still match
known layout defaults. Equality is value-based: a custom value deliberately equal
to a generated value follows that value on the next theme update. Future explicit
binding controls can make this distinction visible to users.

## Template and theme foundations

Six new structures lead the existing library: Editorial Story, Practical Guide,
Photo Journal, Show the Process, Selected Work, and Something New. Existing travel,
photography, and narrative templates remain available. Structures define slide
roles and copy independently of visual compositions and themes. New text-first
compositions have zero photo slots; photo-note/comparison compositions reserve
space for headlines and captions.

Four themes define coherent color roles, heading/body font pairing, heading weight,
and image spacing: Redwell, Contrast, Field notes, and Blueprint. A theme can retain
dark covers and light content slides. Individual slide customization stays possible.
To add a future template, add a typed sequence and overflow definition referencing
existing compositions and an optional theme ID. Add a composition separately when
new photo/text geometry is needed; do not build a new slide editor.

## Collage impact

Collage's canvas, layout catalog, source image behavior, typography defaults,
180-character text control, eight-role limit, viewport, and dock behavior remain.
Shared chrome props are generalized from `isCollage` to `focusedChrome`; the same
Collage branch remains selected. The photo transaction change detector now includes
source URL, visibility, lock, and layer order, so these changes are correctly
recognized by shared history. Pending imports/replacements retain their originating
document. The photo-upload empty-state overlay no longer obscures an existing
text/element-only composition. These are small shared correctness changes, not a
Collage rewrite.

Carousel flowing text uses an optional `textBox` flag. Existing Collage text keeps
its intrinsic-width DOM behavior and legacy raster text path. The preserved
Fabric.js implementation, Carousel live preview protocol, routes, public pages,
assets, package files, and build configuration are not replaced.

## Performance and remaining risks

- Only the selected slide mounts the interactive editor. Other slides use memoized
  DOM artwork, lazy/async images, and offscreen content visibility in the filmstrip
  and overview. Outline mode omits artwork. Very large stories still have one DOM
  thumbnail per slide; virtualization and profiling should precede further scale.
- History remains capped at 100 entries and retains in-memory composition/image
  references. There is no durable save/recovery or cross-tab persisted document.
- DOM editor, DOM thumbnails, and Canvas 2D export still implement some geometry,
  text metrics, effects, and framing separately. Fixed-width flowing Carousel text
  improves alignment/wrapping and avoids height truncation, but actual font metrics,
  shadows, grapheme wrapping, and raster tracking need manual browser verification.
- Text flows naturally and clips at the canvas edge. Automatic overflow/overlap
  warnings and responsive type fitting are not implemented. Long edited copy may
  require resizing/repositioning. Photo overlays in legacy photo-first templates
  still depend on the user's images and chosen filter/contrast treatment.
- Template application is a deliberate rebuild of sequence, text, and styling.
  Photos/elements are retained; excess photos in a text-only structure remain in
  the final slide's library until placed or distributed.
- Failed/unsupported image imports still use the existing quiet skip behavior.
  Import status, cancellation, memory limits, and user-facing error details deserve
  a focused follow-up.
- Reorder updates filmstrip numbering and export filenames. Numbers typed into
  template copy are editable content and do not automatically renumber.
- Theme defaults cover palette, font pairing/weight, and spacing. A user-defined
  global typography scale, custom palettes, reusable brand kits, image treatment,
  automatic numbering, linked slide masters, and theme-binding UI are deferred.

## Validation

- `tsc --noEmit --incremental false` for the current frontend.
- `node scripts/test-carousel.cjs`: 17 passing checks covering all template references,
  slide commands and undo/redo, image sharing, local theme overrides/locks,
  story-wide formats, Collage isolation, template photo retention, delayed imports,
  text wrapping/raster calls, SSR text controls, cross-slide undo, capped history,
  shared photo transactions, photo distribution, text-only export selection,
  imported layer ordering, and Carousel clear/Collage document preservation.
- Production build against a temporary copy of the current source, using existing
  dependencies and without writing to the existing `.next` output. The temporary
  validation copy is removed after review.
- Source and whitespace checks. No browser automation, dev-server restart, browser
  screenshot, or actual interactive/download verification was performed.

Manual review should cover 320/375/414/768px and desktop widths; templates and blank
starts; long copy/centered text; dark/light theme switching with overrides; many
photos; slide moves and undo/redo; preview overview and Edit slide; dialog focus;
and actual PNG/JPG/ZIP output including text-only slides. Check Collage photo
replace/visibility/lock/layer changes and switching modes with an upload pending.

## Recommended next work

1. Durable local project save/recovery, with a versioned document format and image
   asset references.
2. Text overflow/overlap feedback, better font metrics, and common render geometry
   after manual export comparison across all three rendering paths.
3. Explicit theme bindings, a user-defined palette/type scale, and optional generated
   slide-number fields that survive reorder without changing authored copy.
4. Slide-thumbnail virtualization, bulk selection/management, import progress and
   limits, and performance measurements with larger stories.
5. More purpose-specific compositions and improved photo placement; genuine
   cross-slide panoramic continuity after the foundational workflows are validated.

## Files changed in this pass

Modified under `frontend/components/create/`:
`carousel-workspace.tsx`, `carousel-template-picker.tsx`,
`carousel-story-templates.ts`, `carousel-story-copy.tsx`,
`carousel-slide-artwork.tsx`, `carousel-preview-dialog.tsx`, `photo-context.tsx`,
`editor-shell.tsx`, `layout-picker.tsx`, `fabric-canvas.tsx`, `export-dialog.tsx`,
`export-service.ts`, `toolbar.tsx`, `top-bar.tsx`, `resizable-dock.tsx`,
`context-panel.tsx`. Also modified `frontend/types/editor.ts`.

Created under `frontend/components/create/`:
`carousel-composition.ts`, `carousel-slide-presets.ts`, `carousel-themes.ts`,
`carousel-text-layout.ts`, `carousel-add-slide-dialog.tsx`,
`carousel-design-panel.tsx`, `use-dialog-focus.ts`.
Also created `frontend/scripts/test-carousel.cjs` and this document.

No application files were deleted. No dependencies were installed, package/lock
files changed, or source restored from Git history. No commit or push was performed.
