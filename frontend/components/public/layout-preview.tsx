import type { LayoutDefinition } from "@/types/editor";

// Read-only illustration of the existing preset geometry; no editor behavior.
export function LayoutPreview({ layout }: { layout: LayoutDefinition }) {
  return <div className="site-layout-art" aria-hidden="true">
    {layout.cells.map((cell, index) => <span key={index} className={`site-layout-cell site-cell-tone-${index % 4}`} style={{ left: `${cell.x * 100}%`, top: `${cell.y * 100}%`, width: `${cell.width * 100}%`, height: `${cell.height * 100}%`, zIndex: cell.zIndex ?? 0 }} />)}
  </div>;
}
