import type { CanvasBackgroundImage, CollageStyle } from "@/types/editor";

export function getActiveBackgroundImage(style: CollageStyle) {
  return style.backgroundType === "image" ? style.backgroundImage ?? null : null;
}

/** Shared geometry in canvas coordinates; CSS and export use the same crop. */
export function getBackgroundImageRect(image: CanvasBackgroundImage, width: number, height: number) {
  const scale = (image.fit === "contain"
    ? Math.min(width / image.width, height / image.height)
    : Math.max(width / image.width, height / image.height)) * image.zoom;
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  return {
    x: (width - drawWidth) * image.positionX,
    y: (height - drawHeight) * image.positionY,
    width: drawWidth,
    height: drawHeight,
  };
}

export function CanvasBackground({ style, width, height }: { style: CollageStyle; width: number; height: number }) {
  const image = getActiveBackgroundImage(style);
  if (!image || width <= 0 || height <= 0) return null;
  const rect = getBackgroundImageRect(image, width, height);
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <img src={image.src} alt="" draggable={false} decoding="async" className="absolute max-w-none"
        style={{ left: `${rect.x / width * 100}%`, top: `${rect.y / height * 100}%`,
          width: `${rect.width / width * 100}%`, height: `${rect.height / height * 100}%`, opacity: image.opacity }} />
    </span>
  );
}
