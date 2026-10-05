import type { LayerDirection } from "./artwork-composition";

interface LayerOrderControlsProps {
  onReorder: (direction: LayerDirection) => void;
  hasSelection: boolean;
}

const actions: Array<{ label: string; direction: LayerDirection; icon: string }> = [
  { label: "Bring forward", direction: "forward", icon: "↑" },
  { label: "Send backward", direction: "backward", icon: "↓" },
  { label: "Bring to front", direction: "front", icon: "⇈" },
  { label: "Send to back", direction: "back", icon: "⇊" },
];

export function LayerOrderControls({ onReorder, hasSelection }: LayerOrderControlsProps) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 border-t border-brand-border pt-3">
      <span className="mr-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Order</span>
      <div className="flex items-center gap-0.5" role="group" aria-label="Arrange selected layer">
        {actions.map(({ label, direction, icon }) => (
          <button
            key={direction}
            type="button"
            aria-label={label}
            title={label}
            disabled={!hasSelection}
            onClick={() => onReorder(direction)}
            className="flex h-7 min-w-7 items-center justify-center rounded-sm border border-transparent px-1 text-xs font-semibold text-brand-ink transition-colors hover:border-brand-border hover:bg-brand-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500 disabled:cursor-not-allowed disabled:text-brand-muted/50 disabled:hover:border-transparent disabled:hover:bg-transparent"
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
