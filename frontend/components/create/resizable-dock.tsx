"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { EDITOR_TOOLS, type EditorTool } from "@/types/editor";
import { ContextPanel } from "./context-panel";

export interface DockPanelContent {
  id: EditorTool;
  content: React.ReactNode;
}

interface ResizableDockProps {
  panels: DockPanelContent[];
  openPanelIds: EditorTool[];
  activePanelId: EditorTool;
  width: number;
  onWidthChange: (width: number) => void;
  onSelectPanel: (panelId: EditorTool) => void;
  onClosePanel: (panelId: EditorTool) => void;
  onDockPanel: (panelId: EditorTool) => void;
}

const PANEL_DRAG_TYPE = "application/x-redwell-editor-tool";
const MIN_DOCK_WIDTH = 260;
const MAX_DOCK_WIDTH = 520;
const LEFT_TOOLBAR_WIDTH = 64;
const MIN_CANVAS_WIDTH = 300;

interface ResizeDrag {
  pointerId: number;
  startX: number;
  startWidth: number;
}

export function ResizableDock({
  panels,
  openPanelIds,
  activePanelId,
  width,
  onWidthChange,
  onSelectPanel,
  onClosePanel,
  onDockPanel,
}: ResizableDockProps) {
  const resizeDragRef = useRef<ResizeDrag | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1024);
  const activeTool = EDITOR_TOOLS.find((tool) => tool.id === activePanelId) ?? EDITOR_TOOLS[0];
  const isOpen = openPanelIds.length > 0;

  useEffect(() => {
    const clampToViewport = () => {
      setViewportWidth(window.innerWidth);
      const nextWidth = clampDockWidth(width, window.innerWidth);
      if (nextWidth !== width) onWidthChange(nextWidth);
    };

    clampToViewport();
    window.addEventListener("resize", clampToViewport);
    return () => window.removeEventListener("resize", clampToViewport);
  }, [onWidthChange, width]);

  const beginResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    resizeDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: width,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsResizing(true);
  };

  const resize = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = resizeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    onWidthChange(clampDockWidth(
      drag.startWidth + drag.startX - event.clientX,
      window.innerWidth
    ));
  };

  const finishResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (resizeDragRef.current?.pointerId !== event.pointerId) return;
    resizeDragRef.current = null;
    setIsResizing(false);
  };

  const handleResizeKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowLeft" ? 1 : -1;
    onWidthChange(clampDockWidth(width + direction * 16, window.innerWidth));
  };

  const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
    if (!Array.from(event.dataTransfer.types).includes(PANEL_DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setIsDropTarget(true);
  };

  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    const panelId = event.dataTransfer.getData(PANEL_DRAG_TYPE);
    event.preventDefault();
    setIsDropTarget(false);
    if (isEditorTool(panelId)) onDockPanel(panelId);
  };

  const dockStyle = { "--dock-width": `${width}px` } as CSSProperties;
  const tabColumns = { gridTemplateColumns: "repeat(auto-fit, minmax(4.25rem, 1fr))" };

  return (
    <aside
      id="redwell-right-dock"
      aria-label="Right workspace dock"
      aria-hidden={!isOpen}
      onDragOver={handleDragOver}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsDropTarget(false);
        }
      }}
      onDrop={handleDrop}
      className={`${isOpen ? "flex" : "hidden"} relative min-h-0 max-h-[44dvh] w-full shrink-0 flex-col overflow-hidden border-t border-brand-border bg-brand-surface md:h-full md:max-h-none md:w-[var(--dock-width)] md:max-w-[min(48vw,520px)] md:border-l md:border-t-0 ${isDropTarget ? "ring-2 ring-inset ring-redwell-500" : ""} ${isResizing ? "select-none" : ""}`}
      style={dockStyle}
    >
      <div
        role="separator"
        aria-label="Resize right dock"
        aria-orientation="vertical"
        aria-valuemin={MIN_DOCK_WIDTH}
        aria-valuemax={getMaxDockWidth(viewportWidth)}
        aria-valuenow={Math.round(width)}
        aria-valuetext={`${Math.round(width)} pixels wide`}
        aria-controls="redwell-right-dock"
        tabIndex={0}
        onPointerDown={beginResize}
        onPointerMove={resize}
        onPointerUp={finishResize}
        onPointerCancel={finishResize}
        onLostPointerCapture={() => {
          resizeDragRef.current = null;
          setIsResizing(false);
        }}
        onKeyDown={handleResizeKeyDown}
        title="Drag to resize the dock"
        className="group absolute inset-y-0 left-0 z-20 hidden w-2 touch-none cursor-col-resize items-center justify-center bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-redwell-600 md:flex"
      >
        <span className="h-10 w-px rounded-full bg-brand-border transition-colors group-hover:bg-redwell-500 group-focus-visible:bg-redwell-600" />
      </div>

      {isDropTarget && (
        <div className="shrink-0 border-b border-brand-border bg-brand-accent-soft px-3 py-1.5 text-center text-xs font-medium text-redwell-700" aria-live="polite">
          Release to dock this tool
        </div>
      )}

      <div className="flex shrink-0 items-start gap-2 border-b border-brand-border bg-brand-paper px-2 py-2 md:pl-3">
        <nav
          role="tablist"
          aria-label="Docked editor panels"
          className="grid min-w-0 flex-1 gap-1"
          style={tabColumns}
        >
          {openPanelIds.map((panelId) => {
            const tool = EDITOR_TOOLS.find((item) => item.id === panelId);
            if (!tool) return null;
            const isActive = panelId === activePanelId;

            return (
              <button
                key={panelId}
                id={`dock-tab-${panelId}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`dock-panel-${panelId}`}
                onClick={() => onSelectPanel(panelId)}
                onKeyDown={(event) => {
                  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                  event.preventDefault();
                  const currentIndex = openPanelIds.indexOf(panelId);
                  const nextIndex = event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? openPanelIds.length - 1
                      : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + openPanelIds.length) % openPanelIds.length;
                  const nextPanelId = openPanelIds[nextIndex];
                  onSelectPanel(nextPanelId);
                  document.getElementById(`dock-tab-${nextPanelId}`)?.focus();
                }}
                className={`flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-md px-1.5 text-xs font-medium whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500 ${isActive ? "bg-brand-accent-soft text-redwell-700" : "text-brand-muted hover:bg-brand-neutral hover:text-brand-ink"}`}
              >
                <span aria-hidden="true">{tool.icon}</span>
                <span className="truncate">{tool.label}</span>
              </button>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => onClosePanel(activePanelId)}
          aria-label={`Close ${activeTool.label} panel`}
          title={`Close ${activeTool.label}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-lg text-brand-muted hover:bg-brand-neutral hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500"
        >
          ×
        </button>
      </div>

      {activeTool && (
        <div className="flex min-h-0 flex-1 flex-col">
          {panels.map((panel) => (
            <ContextPanel key={panel.id} panelId={panel.id} isActive={panel.id === activePanelId && isOpen}>
              {panel.content}
            </ContextPanel>
          ))}
        </div>
      )}
    </aside>
  );
}

function clampDockWidth(width: number, viewportWidth: number) {
  return Math.max(MIN_DOCK_WIDTH, Math.min(getMaxDockWidth(viewportWidth), width));
}

function getMaxDockWidth(viewportWidth: number) {
  return Math.max(
    MIN_DOCK_WIDTH,
    Math.min(
      MAX_DOCK_WIDTH,
      Math.floor(viewportWidth * 0.48),
      viewportWidth - LEFT_TOOLBAR_WIDTH - MIN_CANVAS_WIDTH
    )
  );
}

function isEditorTool(value: string): value is EditorTool {
  return EDITOR_TOOLS.some((tool) => tool.id === value);
}
