# Adding local elements

1. Place the SVG, PNG, or WebP in `public/assets/elements/doodles/<category>/`.
2. Add one metadata entry to `ELEMENT_CATALOG` in `catalog.tsx` (use the `doodle` helper for an SVG doodle).
3. Set `supportsColor: true` only when a monochrome asset can safely be treated as a tintable silhouette. Use `false` to preserve its original colors.

Custom Redwell or AI-generated files belong in `public/assets/elements/doodles/custom/`. Register them with `category: "custom"`; they appear in both Doodles and Custom. Canvas rendering, transforms, selection, and history are driven by the shared metadata and do not need per-asset changes.

The package-backed Tabler symbols are metadata entries too; local artwork remains independent of that icon package.
