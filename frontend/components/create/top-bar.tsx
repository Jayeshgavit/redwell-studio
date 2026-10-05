interface TopBarProps {
  onPreview: () => void;
  onExport: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function TopBar({ onPreview, onExport, onClear, canUndo, canRedo, onUndo, onRedo }: TopBarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-brand-border bg-brand-paper px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <div aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-redwell-600">
          <span className="h-3.5 w-3.5 rounded-[3px] border-2 border-white" />
        </div>
        <div className="min-w-0">
          <span className="block truncate text-sm font-bold tracking-[-0.02em] text-brand-ink sm:text-base">Redwell Studio</span>
          <span className="hidden text-[8px] font-semibold uppercase tracking-[0.22em] text-brand-muted sm:block">Collage editor</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="mr-1 flex items-center gap-1 sm:mr-2" role="group" aria-label="Undo and redo">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo (Ctrl/⌘ Z)"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-brand-border bg-brand-surface text-base text-brand-muted transition-colors hover:bg-brand-neutral focus:outline-none focus:ring-2 focus:ring-redwell-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:gap-1.5 sm:px-2.5 sm:text-xs sm:font-medium"
          >
            ↶<span className="hidden sm:inline">Undo</span>
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo (Ctrl/⌘ Shift Z)"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-brand-border bg-brand-surface text-base text-brand-muted transition-colors hover:bg-brand-neutral focus:outline-none focus:ring-2 focus:ring-redwell-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:gap-1.5 sm:px-2.5 sm:text-xs sm:font-medium"
          >
            ↷<span className="hidden sm:inline">Redo</span>
          </button>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-md px-2.5 py-2 text-xs font-semibold text-brand-muted transition-colors hover:bg-brand-accent-soft hover:text-redwell-700 focus:outline-none focus:ring-2 focus:ring-redwell-500 sm:px-3 sm:text-sm"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onPreview}
          className="rounded-md border border-brand-border px-3 py-2 text-xs font-semibold text-brand-ink transition-colors hover:border-redwell-300 hover:bg-brand-accent-soft hover:text-redwell-700 focus:outline-none focus:ring-2 focus:ring-redwell-500 sm:px-3.5 sm:text-sm"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={onExport}
          className="rounded-md bg-brand-ink px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-black/85 focus:outline-none focus:ring-2 focus:ring-redwell-500 focus:ring-offset-2 focus:ring-offset-brand-paper sm:px-4 sm:text-sm"
        >
          Export
        </button>
      </div>
    </header>
  );
}
