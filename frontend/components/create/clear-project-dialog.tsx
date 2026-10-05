"use client";

interface ClearProjectDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ClearProjectDialog({ open, onCancel, onConfirm }: ClearProjectDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center bg-brand-ink/45 p-2 backdrop-blur-[1px] sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-project-title"
        className="w-full max-w-md rounded-lg border border-brand-border bg-brand-surface p-5 shadow-lg sm:rounded-lg sm:p-6"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-accent-hover">Project reset</p>
        <h2 id="clear-project-title" className="mt-1 font-sans text-2xl tracking-tight text-brand-ink">Clear project?</h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-muted">
          This will remove all photos, slides, text, elements, and current edits from this project. This action cannot be undone.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="h-10 rounded-lg border border-brand-border px-4 text-sm font-medium text-brand-ink transition-colors hover:bg-brand-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="h-10 rounded-lg bg-brand-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2">
            Clear project
          </button>
        </div>
      </section>
    </div>
  );
}
