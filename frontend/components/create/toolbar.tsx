import { EDITOR_TOOLS, type EditorTool } from "@/types/editor";

interface ToolbarProps {
  activeTool: EditorTool | null;
  onToolSelect: (tool: EditorTool) => void;
}

export function Toolbar({ activeTool, onToolSelect }: ToolbarProps) {
  return (
    <>
      {/* Mobile: bottom bar */}
      <nav aria-label="Editor tools" className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-brand-border bg-brand-paper px-1 md:hidden">
        {EDITOR_TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            draggable
            onClick={() => onToolSelect(tool.id)}
            onDragStart={(event) => startPanelDrag(event, tool.id)}
            aria-pressed={activeTool === tool.id}
            title={`Open or drag ${tool.label} to the workspace dock`}
            className={`flex min-w-12 flex-col items-center gap-1 rounded-lg px-2 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-redwell-500 ${
              activeTool === tool.id
                ? "text-redwell-700"
                : "text-brand-muted hover:text-brand-ink"
            }`}
          >
            <span className="text-xl">{tool.icon}</span>
            <span className="text-[10px] font-medium">{tool.label}</span>
          </button>
        ))}
      </nav>

      {/* Desktop: side toolbar */}
      <nav aria-label="Editor tools" className="fixed bottom-0 left-0 top-14 z-40 hidden w-16 flex-col items-center gap-2 overflow-y-auto border-r border-brand-border bg-brand-paper py-4 md:flex">
        {EDITOR_TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            draggable
            onClick={() => onToolSelect(tool.id)}
            onDragStart={(event) => startPanelDrag(event, tool.id)}
            aria-pressed={activeTool === tool.id}
            title={`Open or drag ${tool.label} to the workspace dock`}
            className={`flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-lg transition-colors ${
              activeTool === tool.id
                ? "bg-brand-accent-soft text-redwell-700"
                : "text-brand-muted hover:bg-brand-neutral hover:text-brand-ink"
            }`}
          >
            <span className="text-xl">{tool.icon}</span>
            <span className="text-[9px] font-medium">{tool.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

function startPanelDrag(event: React.DragEvent<HTMLButtonElement>, toolId: EditorTool) {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("application/x-redwell-editor-tool", toolId);
}
