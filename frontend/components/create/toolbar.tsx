import { EDITOR_TOOLS, type EditorTool } from "@/types/editor";
import { IconPhoto, IconLayoutCollage, IconSparkles, IconStack2, IconTypography, IconPalette, type TablerIcon } from "@tabler/icons-react";

const TOOL_ICONS: Record<EditorTool, TablerIcon> = { photos: IconPhoto, layouts: IconLayoutCollage, elements: IconSparkles, layers: IconStack2, design: IconTypography, style: IconPalette };

interface ToolbarProps {
  focusedChrome?: boolean;
  activeTool: EditorTool | null;
  onToolSelect: (tool: EditorTool) => void;
}

export function Toolbar({ focusedChrome = false, activeTool, onToolSelect }: ToolbarProps) {
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
            className={`flex ${focusedChrome ? "min-w-0 flex-1 rounded-md px-1" : "min-w-12 rounded-lg px-2"} flex-col items-center gap-1 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-redwell-500 ${
              activeTool === tool.id
                ? "text-redwell-700"
                : "text-brand-muted hover:text-brand-ink"
            }`}
          >
            <ToolIcon tool={tool.id} focusedChrome={focusedChrome} />
            <span className="text-[10px] font-medium">{tool.label}</span>
          </button>
        ))}
      </nav>

      {/* Desktop: side toolbar */}
      <nav aria-label="Editor tools" className="editor-tool-rail fixed bottom-0 left-0 top-14 z-40 hidden w-16 flex-col items-center gap-2 overflow-y-auto border-r border-brand-border bg-brand-paper py-4 md:flex">
        {EDITOR_TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            draggable
            onClick={() => onToolSelect(tool.id)}
            onDragStart={(event) => startPanelDrag(event, tool.id)}
            aria-pressed={activeTool === tool.id}
            title={`Open or drag ${tool.label} to the workspace dock`}
            className={`flex ${focusedChrome ? "h-14 shrink-0 gap-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent" : "h-12 gap-0.5 rounded-lg"} w-12 flex-col items-center justify-center transition-colors ${
              activeTool === tool.id
                ? "bg-brand-accent-soft text-redwell-700"
                : "text-brand-muted hover:bg-brand-neutral hover:text-brand-ink"
            }`}
          >
            <ToolIcon tool={tool.id} focusedChrome={focusedChrome} />
            <span className={`${focusedChrome ? "text-[10px]" : "text-[9px]"} font-medium`}>{tool.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

function ToolIcon({ tool, focusedChrome }: { tool: EditorTool; focusedChrome: boolean }) {
  const Icon = TOOL_ICONS[tool];
  return focusedChrome ? <Icon size={21} stroke={1.6} aria-hidden="true" /> : <span className="text-xl">{EDITOR_TOOLS.find((item) => item.id === tool)?.icon}</span>;
}

function startPanelDrag(event: React.DragEvent<HTMLButtonElement>, toolId: EditorTool) {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("application/x-redwell-editor-tool", toolId);
}
