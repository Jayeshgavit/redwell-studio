"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { EDITOR_TOOLS, type EditorTool } from "@/types/editor";
import { ContextPanel } from "./context-panel";

export interface DockPanelContent {
  id: EditorTool;
  content: React.ReactNode;
}

interface ResizableDockProps {
  compact?: boolean;
  focusedChrome?: boolean;
  panels: DockPanelContent[];
  openPanelIds: EditorTool[];
  activePanelId: EditorTool;
  width: number | null;
  onWidthChange: (width: number) => void;
  onSelectPanel: (panelId: EditorTool) => void;
  onClosePanel: (panelId: EditorTool) => void;
  onCollapse?: () => void;
  onDockPanel: (panelId: EditorTool) => void;
}

const PANEL_DRAG_TYPE = "application/x-redwell-editor-tool";
const MIN_DOCK_WIDTH = 260;
const MIN_CAROUSEL_DOCK_WIDTH = 320;
const MAX_DOCK_WIDTH = 520;
const LEFT_TOOLBAR_WIDTH = 64;
const MIN_CANVAS_WIDTH = 300;

interface ResizeDrag {
  pointerId: number;
  startX: number;
  startWidth: number;
}

export function ResizableDock({
  compact = false,
  focusedChrome = false,
  panels,
  openPanelIds,
  activePanelId,
  width,
  onWidthChange,
  onSelectPanel,
  onClosePanel,
  onCollapse,
  onDockPanel,
}: ResizableDockProps) {
  const resizeDragRef = useRef<ResizeDrag | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1024);
  const [resizeWidth, setResizeWidth] = useState<number | null>(null);
  const pendingWidthRef = useRef<number | null>(null);
  const resizeFrameRef = useRef<number | null>(null);
  const activeTool = EDITOR_TOOLS.find((tool) => tool.id === activePanelId) ?? EDITOR_TOOLS[0];
  const isOpen = openPanelIds.length > 0;
  const resolveWidth = (requested = width, screenWidth = viewportWidth) => clampDockWidth(
    requested ?? getAutoDockWidth(screenWidth, activePanelId), screenWidth, compact, activePanelId
  );
  const displayedWidth = resolveWidth(resizeWidth ?? width);

  useEffect(() => () => {
    if (resizeFrameRef.current !== null) window.cancelAnimationFrame(resizeFrameRef.current);
  }, []);

  useEffect(() => {
    if (focusedChrome) document.getElementById(`dock-tab-${activePanelId}`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activePanelId, focusedChrome, openPanelIds]);

  useEffect(() => {
    const clampToViewport = () => {
      setViewportWidth(window.innerWidth);
    };

    clampToViewport();
    window.addEventListener("resize", clampToViewport);
    return () => window.removeEventListener("resize", clampToViewport);
  }, []);

  const beginResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    resizeDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: resolveWidth(width, window.innerWidth),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsResizing(true);
  };

  const resize = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = resizeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const nextWidth = resolveWidth(
      drag.startWidth + drag.startX - event.clientX,
      window.innerWidth
    );
    if (!compact) {
      onWidthChange(nextWidth);
      return;
    }
    // Keep transient drag state in the dock; persist the choice on release.
    pendingWidthRef.current = nextWidth;
    if (resizeFrameRef.current !== null) return;
    resizeFrameRef.current = window.requestAnimationFrame(() => {
      resizeFrameRef.current = null;
      setResizeWidth(pendingWidthRef.current);
    });
  };

  const endResize = () => {
    if (!resizeDragRef.current) return;
    if (resizeFrameRef.current !== null) window.cancelAnimationFrame(resizeFrameRef.current);
    resizeFrameRef.current = null;
    if (compact && pendingWidthRef.current !== null) onWidthChange(pendingWidthRef.current);
    pendingWidthRef.current = null;
    resizeDragRef.current = null;
    setResizeWidth(null);
    setIsResizing(false);
  };

  const finishResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (resizeDragRef.current?.pointerId !== event.pointerId) return;
    endResize();
  };

  const handleResizeKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowLeft" ? 1 : -1;
    onWidthChange(resolveWidth(resolveWidth(width, window.innerWidth) + direction * 16, window.innerWidth));
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

  const dockStyle = { "--dock-width": `${displayedWidth}px` } as CSSProperties;
  const tabColumns = { gridTemplateColumns: "repeat(auto-fit, minmax(4.25rem, 1fr))" };

  return (
    <aside
      id="redwell-right-dock"
      data-compact={compact}
      aria-label="Right workspace dock"
      aria-hidden={!isOpen}
      onDragOver={handleDragOver}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsDropTarget(false);
        }
      }}
      onDrop={handleDrop}
      className={`${isOpen ? "flex" : "hidden"} editor-dock relative min-h-0 ${focusedChrome ? "max-h-[34dvh] sm:max-h-[44dvh]" : "max-h-[44dvh]"} w-full shrink-0 flex-col overflow-hidden border-t border-brand-border bg-brand-surface md:h-full md:max-h-none md:w-[var(--dock-width)] md:max-w-[min(48vw,520px)] md:border-l md:border-t-0 ${isDropTarget ? "ring-2 ring-inset ring-redwell-500" : ""} ${isResizing ? "select-none" : ""}`}
      style={dockStyle}
    >
      <div
        role="separator"
        aria-label="Resize right dock"
        aria-orientation="vertical"
        aria-valuemin={compact ? MIN_CAROUSEL_DOCK_WIDTH : MIN_DOCK_WIDTH}
        aria-valuemax={getMaxDockWidth(viewportWidth, compact, activePanelId)}
        aria-valuenow={Math.round(displayedWidth)}
        aria-valuetext={`${Math.round(displayedWidth)} pixels wide`}
        aria-controls="redwell-right-dock"
        tabIndex={0}
        onPointerDown={beginResize}
        onPointerMove={resize}
        onPointerUp={finishResize}
        onPointerCancel={finishResize}
        onLostPointerCapture={endResize}
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
          className={focusedChrome ? "flex min-w-0 flex-1 gap-1 overflow-x-auto" : "grid min-w-0 flex-1 gap-1"}
          style={focusedChrome ? undefined : tabColumns}
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
                tabIndex={focusedChrome && !isActive ? -1 : 0}
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
                className={`flex min-h-9 min-w-0 ${focusedChrome ? "shrink-0 px-3" : "px-1.5"} items-center justify-center gap-1 rounded-md text-xs font-medium whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500 ${isActive ? "bg-brand-accent-soft text-redwell-700" : "text-brand-muted hover:bg-brand-neutral hover:text-brand-ink"}`}
              >
                {!focusedChrome && <span aria-hidden="true">{tool.icon}</span>}
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-lg text-brand-muted hover:bg-brand-neutral hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500"
        >
          ×
        </button>
        {onCollapse && <button type="button" onClick={onCollapse} aria-label="Collapse tool dock" title="Collapse tool dock · reopen from the tool rail" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-brand-muted hover:bg-brand-neutral hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-redwell-500">→</button>}
      </div>

      {activeTool && (
        <div className="flex min-h-0 flex-1 flex-col">
          {panels.map((panel) => (
            <ContextPanel key={panel.id} panelId={panel.id} isActive={panel.id === activePanelId && isOpen} focusedChrome={focusedChrome}>
              {panel.content}
            </ContextPanel>
          ))}
        </div>
      )}
    </aside>
  );
}

function clampDockWidth(width: number, viewportWidth: number, compact = false, panelId?: EditorTool) {
  return Math.max(compact ? MIN_CAROUSEL_DOCK_WIDTH : MIN_DOCK_WIDTH, Math.min(getMaxDockWidth(viewportWidth, compact, panelId), width));
}

function getMaxDockWidth(viewportWidth: number, compact = false, panelId?: EditorTool) {
  const hasCardGrid = panelId === "photos" || panelId === "layouts" || panelId === "elements";
  return Math.max(
    compact ? MIN_CAROUSEL_DOCK_WIDTH : MIN_DOCK_WIDTH,
    Math.min(
      compact ? (hasCardGrid ? 520 : 420) : MAX_DOCK_WIDTH,
      Math.floor(viewportWidth * 0.32),
      viewportWidth - LEFT_TOOLBAR_WIDTH - (compact ? 380 : MIN_CANVAS_WIDTH)
    )
  );
}

function getAutoDockWidth(viewportWidth: number, panelId: EditorTool) {
  if (viewportWidth < 1440) return 360;
  const hasCardGrid = panelId === "photos" || panelId === "layouts" || panelId === "elements";
  return Math.floor(viewportWidth * (hasCardGrid ? 0.24 : 0.2));
}

function isEditorTool(value: string): value is EditorTool {
  return EDITOR_TOOLS.some((tool) => tool.id === value);
}
