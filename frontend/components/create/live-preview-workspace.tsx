"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import {
  parseLivePreviewMessage,
  type LivePreviewMessage,
  type LivePreviewState,
} from "./live-preview-protocol";
import { getArtworkImageSources, remapArtworkImageSources } from "./artwork-composition";
import { PhotoProvider } from "./photo-context";
import { FabricCanvasComponent } from "./fabric-canvas";

const CHANNEL_PREFIX = "redwell-studio-preview:";

export function LivePreviewWorkspace() {
  const [previewState, setPreviewState] = useState<LivePreviewState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({ width: 1, height: 1 });
  const channelRef = useRef<BroadcastChannel | null>(null);
  const previewStateRef = useRef<LivePreviewState | null>(null);
  const photoAssetUrlsRef = useRef(new Map<string, string>());
  const stageRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  previewStateRef.current = previewState;

  const slides = useMemo(
    () => [...(previewState?.slides ?? [])].sort((first, second) => first.order - second.order),
    [previewState?.slides]
  );
  const activeIndex = slides.findIndex((slide) => slide.id === previewState?.activeSlideId);
  const format = previewState?.composition.format ?? null;

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("channel");
    if (!id) {
      setError("Open Preview from the Redwell Studio editor to start a live session.");
      return;
    }
    if (typeof BroadcastChannel === "undefined") {
      setError("Live Preview requires a browser with BroadcastChannel support.");
      return;
    }

    const channel = new BroadcastChannel(`${CHANNEL_PREFIX}${id}`);
    channelRef.current = channel;
    channel.onmessage = (event: MessageEvent<unknown>) => {
      const message = parseLivePreviewMessage(event.data);
      if (!message) return;
      if (message.type === "photo-asset") {
        if (!photoAssetUrlsRef.current.has(message.source)) {
          photoAssetUrlsRef.current.set(message.source, URL.createObjectURL(message.blob));
        }
      } else if (message.type === "state") {
        const missingSource = getArtworkImageSources(message.state.composition).find(
          (source) => source.startsWith("blob:") && !photoAssetUrlsRef.current.has(source)
        );
        if (missingSource) {
          setError("An image asset is missing from the live preview. Reopen Preview to resync it.");
          return;
        }
        setPreviewState({
          ...message.state,
          composition: remapArtworkImageSources(message.state.composition, photoAssetUrlsRef.current),
        });
        setIsConnected(true);
        setError(null);
      } else if (message.type === "editor-disconnected") {
        setIsConnected(false);
      }
    };
    channel.postMessage({ type: "ready" } satisfies LivePreviewMessage);

    return () => {
      channel.close();
      if (channelRef.current === channel) channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(() => {
      setStageSize({
        width: Math.max(1, stage.clientWidth),
        height: Math.max(1, stage.clientHeight),
      });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const activeObjectUrls = new Set(previewState ? getArtworkImageSources(previewState.composition) : []);
    photoAssetUrlsRef.current.forEach((url, source) => {
      if (activeObjectUrls.has(url)) return;
      URL.revokeObjectURL(url);
      photoAssetUrlsRef.current.delete(source);
    });
  }, [previewState]);

  useEffect(() => () => {
    photoAssetUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    photoAssetUrlsRef.current.clear();
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement !== null);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const requestSlide = useCallback((index: number) => {
    const slide = slides[index];
    if (!slide) return;
    channelRef.current?.postMessage({
      type: "select-slide",
      slideId: slide.id,
    } satisfies LivePreviewMessage);
  }, [slides]);

  const moveSlide = useCallback((offset: number) => {
    if (activeIndex < 0) return;
    requestSlide(activeIndex + offset);
  }, [activeIndex, requestSlide]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveSlide(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        moveSlide(1);
      } else if (event.key === "Escape" && document.fullscreenElement) {
        void document.exitFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveSlide]);

  useEffect(() => {
    if (!isPlaying || previewState?.documentMode !== "carousel") return;
    const timer = window.setInterval(() => {
      const current = previewStateRef.current;
      if (!current) return;
      const orderedSlides = [...current.slides].sort((first, second) => first.order - second.order);
      const currentIndex = orderedSlides.findIndex((slide) => slide.id === current.activeSlideId);
      const nextIndex = currentIndex < 0 || currentIndex >= orderedSlides.length - 1
        ? 0
        : currentIndex + 1;
      const nextSlide = orderedSlides[nextIndex];
      if (nextSlide) {
        channelRef.current?.postMessage({
          type: "select-slide",
          slideId: nextSlide.id,
        } satisfies LivePreviewMessage);
      }
    }, 3500);
    return () => window.clearInterval(timer);
  }, [isPlaying, previewState?.documentMode]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setError("Fullscreen mode is unavailable in this browser or tab.");
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartXRef.current = null;
    if (startX === null || endX === undefined || Math.abs(endX - startX) < 48) return;
    moveSlide(endX < startX ? 1 : -1);
  };

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-brand-paper text-brand-ink">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-brand-border bg-brand-paper px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${isConnected ? "bg-brand-accent" : "bg-brand-muted/40"}`} />
          <span className="truncate text-xs font-semibold tracking-wide">Redwell Studio</span>
          <span className={`hidden rounded-full px-2 py-0.5 text-[10px] sm:inline ${isConnected ? "bg-brand-accent-soft text-brand-accent" : "bg-brand-neutral text-brand-muted"}`}>
            {isConnected ? "Live" : "Disconnected"}
          </span>
          {format && <span className="hidden text-[10px] text-brand-muted sm:inline">{format.name}</span>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {previewState?.documentMode === "carousel" && (
            <span className="min-w-14 text-center text-xs tabular-nums text-brand-muted">
              {Math.max(0, activeIndex) + 1} / {slides.length}
            </span>
          )}
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="flex h-8 w-8 items-center justify-center rounded-md text-sm text-brand-muted transition-colors hover:bg-brand-neutral hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
          >
            {isFullscreen ? "⤢" : "⛶"}
          </button>
          <button
            type="button"
            onClick={() => window.close()}
            className="rounded-md px-2 py-1.5 text-xs font-medium text-brand-muted transition-colors hover:bg-brand-neutral hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
          >
            Close
          </button>
        </div>
      </header>

      <section
        aria-label="Live artwork preview"
        className="flex min-h-0 flex-1 overflow-hidden p-3 sm:p-5"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={stageRef}
          className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-md border border-brand-border bg-brand-neutral"
        >
          {previewState ? (
            <LivePreviewArtwork state={previewState} containerSize={stageSize} />
          ) : (
            <div className="max-w-sm px-6 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-pulse rounded-full bg-brand-accent/30" />
              <p className="text-sm font-medium text-brand-muted">
                {error ?? "Waiting for the editor…"}
              </p>
            </div>
          )}
        </div>
        {error && previewState && (
          <p role="status" className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-xs text-brand-ink">
            {error}
          </p>
        )}
      </section>

      {previewState?.documentMode === "carousel" && (
        <footer className="flex h-14 shrink-0 items-center justify-center gap-4 border-t border-brand-border bg-brand-paper px-4">
          <button
            type="button"
            aria-label="Previous slide"
            disabled={activeIndex <= 0}
            onClick={() => moveSlide(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-xl text-brand-muted transition-colors hover:bg-brand-neutral hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent disabled:text-brand-muted/30"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
            onClick={() => setIsPlaying((playing) => !playing)}
            className="h-8 min-w-16 rounded-md border border-brand-border bg-brand-surface px-3 text-[11px] font-medium text-brand-muted transition-colors hover:bg-brand-neutral hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            aria-label="Next slide"
            disabled={activeIndex < 0 || activeIndex >= slides.length - 1}
            onClick={() => moveSlide(1)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-xl text-brand-muted transition-colors hover:bg-brand-neutral hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent disabled:text-brand-muted/30"
          >
            ›
          </button>
        </footer>
      )}
    </main>
  );
}

interface LivePreviewArtworkProps {
  state: LivePreviewState;
  containerSize: { width: number; height: number };
}

function LivePreviewArtwork({ state, containerSize }: LivePreviewArtworkProps) {
  const presentation = useMemo(
    () => ({ documentMode: state.documentMode, composition: state.composition }),
    [state]
  );
  const noOperationWithId = useCallback((_id: string | null) => {}, []);
  const noOperationWithIndex = useCallback((_index: number) => {}, []);
  const noOperationWithSwap = useCallback((_from: number, _to: number) => {}, []);

  return (
    <PhotoProvider presentation={presentation}>
      <FabricCanvasComponent
        format={state.composition.format}
        layout={state.composition.layout}
        onAddPhotoToSlot={noOperationWithIndex}
        selectedPhotoId={null}
        onSelectPhoto={noOperationWithId}
        selectedElementId={null}
        onSelectElement={noOperationWithId}
        selectedStoryTextId={null}
        onSelectStoryText={noOperationWithId}
        onSwapSlots={noOperationWithSwap}
        readOnly
        containerSize={containerSize}
      />
    </PhotoProvider>
  );
}
