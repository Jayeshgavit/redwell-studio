import type { CanvasElement, CarouselStoryTextItem } from "@/types/editor";
import type { Photo } from "./photo-context";
import { getArtworkLayerStack, type ArtworkComposition } from "./artwork-composition";
import { getCatalogElement, isIconAsset } from "./elements/catalog";
import {
  getPhotoColorOverlay,
  getPhotoGradientOverlay,
  getPhotoCssFilter,
  resolvePhotoFilters,
} from "./photo-filters";
import type { ResolvedPhotoFilters } from "./photo-filters";
import { wrapCarouselText } from "./carousel-text-layout";
import { getActiveBackgroundImage, getBackgroundImageRect } from "./canvas-background";

export type ExportImageFormat = "png" | "jpg" | "webp";
export type ExportScale = 1 | 2 | 3;
export type ExportProgress = string;

export type ExportSnapshot = ArtworkComposition;

export interface ExportOptions {
  imageFormat: ExportImageFormat;
  scale: ExportScale;
  quality: number;
}

const MIME_TYPES: Record<ExportImageFormat, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

/**
 * Rasterizes the editor's normalized artwork state into a standalone image.
 * This deliberately does not read editor controls or mutate editor/history state.
 */
export async function createCollageExport(
  snapshot: ExportSnapshot,
  options: ExportOptions,
  onProgress: (progress: ExportProgress) => void
): Promise<Blob> {
  onProgress("Preparing export...");
  await nextPaint();

  const outputWidth = snapshot.format.width * options.scale;
  const outputHeight = snapshot.format.height * options.scale;
  if (!Number.isSafeInteger(outputWidth) || !Number.isSafeInteger(outputHeight)) {
    throw new Error("The selected export dimensions are not supported.");
  }

  const pixelScale = options.scale;
  const documentWidth = snapshot.format.width;
  const documentHeight = snapshot.format.height;
  const borderWidth = snapshot.collageStyle.borderEnabled
    ? Math.max(0, snapshot.collageStyle.borderWidth)
    : 0;
  const spacing = getRenderedSpacing(snapshot, documentWidth, documentHeight);

  const photosById = new Map(snapshot.photos.map((photo) => [photo.id, photo]));
  const assignedPhotos = snapshot.layout.cells.map((_, slotIndex) => {
    const photoId = snapshot.slotAssignments[slotIndex];
    return photoId ? photosById.get(photoId) : undefined;
  });
  const usedPhotos = assignedPhotos.filter(
    (photo): photo is Photo => photo !== undefined && photo.visible !== false
  );

  onProgress("Rendering artwork...");
  await nextPaint();

  const backgroundImage = getActiveBackgroundImage(snapshot.collageStyle);
  const photoImages = await loadUniqueImages([...usedPhotos.map((photo) => photo.src), ...(backgroundImage ? [backgroundImage.src] : [])]);
  const elementImages = await Promise.all(
    snapshot.elements
      .filter((element) => element.visible !== false)
      .map(async (element) => resolveElementImage(element))
  );
  const layerStack = getArtworkLayerStack({
    layout: snapshot.layout,
    photos: snapshot.photos,
    slotAssignments: snapshot.slotAssignments,
    elements: snapshot.elements,
    storyText: snapshot.storyText ?? [],
  });
  const layerOrderByKey = new Map(
    layerStack.map((layer) => [`${layer.kind}:${layer.id}`, layer.layerOrder])
  );

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not create an export canvas.");

  context.scale(pixelScale, pixelScale);
  context.save();
  roundedRectPath(
    context,
    0,
    0,
    documentWidth,
    documentHeight,
    snapshot.collageStyle.cornerRadius
  );
  context.clip();
  context.fillStyle = snapshot.collageStyle.backgroundColor;
  context.fillRect(0, 0, documentWidth, documentHeight);

  const innerWidth = Math.max(0, documentWidth - borderWidth * 2);
  const innerHeight = Math.max(0, documentHeight - borderWidth * 2);
  roundedRectPath(
    context,
    borderWidth,
    borderWidth,
    innerWidth,
    innerHeight,
    Math.max(0, snapshot.collageStyle.cornerRadius - borderWidth)
  );
  context.clip();
  const grainPattern = usedPhotos.some((photo) => (photo.filters?.grain ?? 0) > 0)
    ? createGrainPattern(context)
    : null;
  if (backgroundImage && innerWidth > 0 && innerHeight > 0) {
    const image = photoImages.get(backgroundImage.src);
    if (image) {
      const rect = getBackgroundImageRect(backgroundImage, innerWidth, innerHeight);
      context.save();
      context.globalAlpha = backgroundImage.opacity;
      context.drawImage(image, borderWidth + rect.x, borderWidth + rect.y, rect.width, rect.height);
      context.restore();
    }
  }
  const slotOrder = new Map(snapshot.layout.cells
    .map((cell, slotIndex) => ({ cell, slotIndex }))
    .sort((first, second) =>
      (first.cell.zIndex ?? first.slotIndex) - (second.cell.zIndex ?? second.slotIndex)
    )
    .map(({ slotIndex }, order) => [slotIndex, order]));
  const renderSlot = (cell: (typeof snapshot.layout.cells)[number], slotIndex: number) => {
    if (assignedPhotos[slotIndex]?.visible === false) return;
    const cellSpacing = cell.isBackground ? 0 : spacing;
    const x = borderWidth + cell.x * innerWidth + cellSpacing / 2;
    const y = borderWidth + cell.y * innerHeight + cellSpacing / 2;
    const width = Math.max(0, cell.width * innerWidth - cellSpacing);
    const height = Math.max(0, cell.height * innerHeight - cellSpacing);
    const radius = cell.frameStyle
      ? 2
      : cell.isBackground
        ? 0
        : Math.min(Math.max(0, snapshot.collageStyle.cornerRadius), width / 2, height / 2);
    const photo = assignedPhotos[slotIndex];

    context.save();
    context.translate(x + width / 2, y + height / 2);
    context.rotate(((cell.rotation ?? 0) * Math.PI) / 180);
    if (!photo) {
      drawEmptySlot(
        context,
        -width / 2,
        -height / 2,
        width,
        height,
        radius,
        backgroundImage && !cell.frameStyle ? "transparent" : snapshot.collageStyle.backgroundColor
      );
      context.restore();
      return;
    }

    const image = photoImages.get(photo.src);
    if (!image) {
      context.restore();
      return;
    }

    if (cell.frameStyle) {
      context.save();
      context.shadowColor = "rgba(20, 18, 16, 0.24)";
      context.shadowBlur = 14;
      context.shadowOffsetY = 5;
      context.fillStyle = cell.frameColor ?? "#ffffff";
      roundedRectPath(context, -width / 2, -height / 2, width, height, 3);
      context.fill();
      context.restore();
    }

    const imageX = cell.frameStyle ? -width / 2 + width * (cell.frameStyle === "polaroid" ? 0.07 : 0.05) : -width / 2;
    const imageY = cell.frameStyle ? -height / 2 + height * (cell.frameStyle === "polaroid" ? 0.06 : 0.05) : -height / 2;
    const imageWidth = cell.frameStyle ? width * (cell.frameStyle === "polaroid" ? 0.86 : 0.9) : width;
    const imageHeight = cell.frameStyle ? height * (cell.frameStyle === "polaroid" ? 0.72 : 0.9) : height;
    const imageLeft = imageX;
    const imageTop = imageY;

    context.save();
    roundedRectPath(context, imageLeft, imageTop, imageWidth, imageHeight, cell.frameStyle ? 1 : radius);
    context.clip();
    context.save();
    context.translate(imageX + imageWidth / 2, imageY + imageHeight / 2);
    context.rotate((photo.rotation * Math.PI) / 180);
    context.scale(
      rotationCoverScale(imageWidth / documentWidth, imageHeight / documentHeight, snapshot.format.ratio, photo.displayMode, photo.rotation),
      rotationCoverScale(imageWidth / documentWidth, imageHeight / documentHeight, snapshot.format.ratio, photo.displayMode, photo.rotation)
    );
    context.scale(photo.flipX ? -1 : 1, photo.flipY ? -1 : 1);
    context.scale(photo.zoom, photo.zoom);
    const filters = resolvePhotoFilters(photo.filters);
    context.globalAlpha = filters.opacity / 100;
    context.filter = getPhotoCssFilter(photo.filters);
    drawPhotoInCell(context, image, imageWidth, imageHeight, photo);
    context.restore();
    drawPhotoEffects(context, filters, imageLeft, imageTop, imageWidth, imageHeight, grainPattern);
    context.restore();
    context.restore();
  };

  const renderElement = (element: CanvasElement) => {
    const resolved = elementImages.find((candidate) => candidate.id === element.id);
    if (!resolved) return;

    const width = element.width * innerWidth;
    const height = element.height * innerHeight;
    context.save();
    context.globalAlpha = Math.min(1, Math.max(0, element.opacity));
    context.translate(
      borderWidth + element.x * innerWidth,
      borderWidth + element.y * innerHeight
    );
    context.rotate((element.rotation * Math.PI) / 180);
    context.scale(
      element.scaleX * (element.flipX ? -1 : 1),
      element.scaleY * (element.flipY ? -1 : 1)
    );

    if (resolved.tint) {
      const tintedImage = tintImage(
        resolved.image,
        Math.max(1, Math.ceil(width * pixelScale)),
        Math.max(1, Math.ceil(height * pixelScale)),
        element.color ?? "#111827"
      );
      context.drawImage(tintedImage, -width / 2, -height / 2, width, height);
    } else {
      drawContainedImage(context, resolved.image, -width / 2, -height / 2, width, height);
    }
    context.restore();
  };
  const renderLayers = [
    ...snapshot.layout.cells.map((cell, slotIndex) => {
      const photoId = snapshot.slotAssignments[slotIndex];
      return {
        kind: "slot" as const,
        cell,
        slotIndex,
        layerOrder: photoId
          ? layerOrderByKey.get(`photo:${photoId}`) ?? slotOrder.get(slotIndex) ?? slotIndex
          : slotOrder.get(slotIndex) ?? slotIndex,
        baseOrder: slotOrder.get(slotIndex) ?? slotIndex,
      };
    }),
    ...(snapshot.storyText ?? []).filter((item) => item.visible !== false).map((item, index) => ({
      kind: "storyText" as const,
      item,
      layerOrder: layerOrderByKey.get(`storyText:${item.id}`) ?? snapshot.layout.cells.length + index,
      baseOrder: snapshot.layout.cells.length + index,
    })),
    ...snapshot.elements.filter((element) => element.visible !== false).map((element, index) => ({
      kind: "element" as const,
      element,
      layerOrder: layerOrderByKey.get(`element:${element.id}`) ?? snapshot.layout.cells.length + (snapshot.storyText?.length ?? 0) + index,
      baseOrder: snapshot.layout.cells.length + (snapshot.storyText?.length ?? 0) + index,
    })),
  ].sort((first, second) =>
    first.layerOrder - second.layerOrder || first.baseOrder - second.baseOrder
  );

  renderLayers.forEach((layer) => {
    if (layer.kind === "slot") renderSlot(layer.cell, layer.slotIndex);
    else if (layer.kind === "storyText") {
      drawStoryText(context, [layer.item], documentWidth, documentHeight);
    } else renderElement(layer.element);
  });
  context.restore();

  if (borderWidth > 0) {
    context.save();
    context.strokeStyle = snapshot.collageStyle.borderColor;
    context.lineWidth = borderWidth;
    roundedRectPath(
      context,
      borderWidth / 2,
      borderWidth / 2,
      Math.max(0, documentWidth - borderWidth),
      Math.max(0, documentHeight - borderWidth),
      Math.max(0, snapshot.collageStyle.cornerRadius - borderWidth / 2)
    );
    context.stroke();
    context.restore();
  }

  onProgress("Generating image...");
  await nextPaint();
  const blob = await canvasToBlob(
    canvas,
    MIME_TYPES[options.imageFormat],
    options.imageFormat === "png" ? undefined : Math.min(1, Math.max(0, options.quality / 100))
  );
  if (blob.type !== MIME_TYPES[options.imageFormat]) {
    throw new Error(
      `${options.imageFormat.toUpperCase()} export is not supported by this browser. Try PNG or another browser.`
    );
  }
  return blob;
}

export function getExportFilename(imageFormat: ExportImageFormat, documentName = "collage") {
  const baseName = `redwell-${documentName}-${getExportDate()}`;
  const safeName = baseName
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/[. ]+$/g, "")
    .trim();
  return `${safeName}.${imageFormat}`;
}

export function getCarouselSlideFilename(index: number, imageFormat: ExportImageFormat) {
  return getExportFilename(imageFormat, `carousel-slide-${String(index + 1).padStart(2, "0")}`);
}

export function getCarouselZipFilename() {
  return `redwell-carousel-${getExportDate()}.zip`;
}

export async function createZipExport(entries: { filename: string; blob: Blob }[]) {
  const encodedNames = entries.map((entry) => new TextEncoder().encode(entry.filename));
  const files = await Promise.all(entries.map((entry) => entry.blob.arrayBuffer()));
  const localParts: ArrayBuffer[] = [];
  const directoryParts: ArrayBuffer[] = [];
  let offset = 0;

  files.forEach((file, index) => {
    const name = encodedNames[index];
    const bytes = new Uint8Array(file);
    const crc = crc32(bytes);
    const localHeader = createLocalZipHeader(crc, bytes.length, name.length);
    localParts.push(copyBytes(localHeader), copyBytes(name), copyBytes(bytes));
    const directoryHeader = createCentralZipHeader(crc, bytes.length, name.length, offset);
    directoryParts.push(copyBytes(directoryHeader), copyBytes(name));
    offset += localHeader.byteLength + name.length + bytes.length;
  });

  const directorySize = directoryParts.reduce((size, part) => size + part.byteLength, 0);
  const footer = createZipFooter(entries.length, directorySize, offset);
  return new Blob([...localParts, ...directoryParts, copyBytes(footer)], { type: "application/zip" });
}

export function downloadExport(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getRenderedSpacing(snapshot: ExportSnapshot, width: number, height: number) {
  const tightestCellDimension = Math.min(
    ...snapshot.layout.cells.map((cell) =>
      Math.min(cell.width * width, cell.height * height)
    )
  );
  return Math.min(snapshot.collageStyle.spacing, Math.max(0, tightestCellDimension - 2));
}

function drawPhotoInCell(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  photo: Photo
) {
  const mode = photo.displayMode;
  if (mode === "stretch") {
    context.drawImage(image, -width / 2, -height / 2, width, height);
    return;
  }

  const scale = mode === "fit"
    ? Math.min(width / image.naturalWidth, height / image.naturalHeight)
    : Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const imageWidth = image.naturalWidth * scale;
  const imageHeight = image.naturalHeight * scale;
  const left = -width / 2 + (width - imageWidth) * photo.positionX;
  const top = -height / 2 + (height - imageHeight) * photo.positionY;
  context.drawImage(image, left, top, imageWidth, imageHeight);
}

function drawPhotoEffects(
  context: CanvasRenderingContext2D,
  filters: ResolvedPhotoFilters,
  left: number,
  top: number,
  width: number,
  height: number,
  grainPattern: CanvasPattern | null
) {
  const colorOverlay = getPhotoColorOverlay(filters);
  if (colorOverlay) {
    context.save();
    context.globalAlpha *= colorOverlay.opacity;
    context.globalCompositeOperation = "soft-light";
    context.fillStyle = colorOverlay.color;
    context.fillRect(left, top, width, height);
    context.restore();
  }

  if (getPhotoGradientOverlay(filters)) {
    context.save();
    if (filters.gradientOverlay === "dark-fade") {
      const gradient = context.createLinearGradient(0, top, 0, top + height);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.62)");
      gradient.addColorStop(0.72, "rgba(0, 0, 0, 0)");
      context.fillStyle = gradient;
    } else {
      const gradient = context.createLinearGradient(left, top + height, left + width, top);
      gradient.addColorStop(0, "rgba(177, 91, 42, 0.46)");
      gradient.addColorStop(0.75, "rgba(244, 190, 112, 0)");
      context.fillStyle = gradient;
    }
    context.fillRect(left, top, width, height);
    context.restore();
  }

  const vignette = filters.vignette ?? 0;
  if (vignette > 0) {
    context.save();
    const radius = Math.max(width, height) * 0.72;
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const gradient = context.createRadialGradient(
      centerX,
      centerY,
      Math.min(width, height) * 0.18,
      centerX,
      centerY,
      radius
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, `rgba(0, 0, 0, ${vignette / 100 * 0.65})`);
    context.fillStyle = gradient;
    context.fillRect(left, top, width, height);
    context.restore();
  }

  if (grainPattern && filters.grain > 0) {
    context.save();
    context.globalAlpha *= filters.grain / 100 * 0.3;
    context.fillStyle = grainPattern;
    context.fillRect(left, top, width, height);
    context.restore();
  }
}

function createGrainPattern(context: CanvasRenderingContext2D) {
  const tile = document.createElement("canvas");
  tile.width = 64;
  tile.height = 64;
  const tileContext = tile.getContext("2d");
  if (!tileContext) return null;
  const imageData = tileContext.createImageData(tile.width, tile.height);
  for (let index = 0; index < imageData.data.length; index += 4) {
    const noise = ((Math.imul(index + 17, 1103515245) + 12345) >>> 16) & 0xff;
    imageData.data[index] = noise;
    imageData.data[index + 1] = noise;
    imageData.data[index + 2] = noise;
    imageData.data[index + 3] = 112;
  }
  tileContext.putImageData(imageData, 0, 0);
  return context.createPattern(tile, "repeat");
}

function drawStoryText(
  context: CanvasRenderingContext2D,
  items: CarouselStoryTextItem[],
  documentWidth: number,
  documentHeight: number
) {
  items.forEach((item) => {
    if (!item.text.trim()) return;
    const x = item.x * documentWidth;
    const y = item.y * documentHeight;
    const width = item.width * documentWidth;
    const height = item.height * documentHeight;
    const padding = item.padding ?? 0;
    context.save();
    if (item.textBox) {
      context.font = `${item.fontWeight} ${item.fontSize}px ${item.fontFamily === "serif" ? "Georgia, 'Times New Roman', serif" : "Inter, ui-sans-serif, system-ui, sans-serif"}`;
      context.letterSpacing = `${item.letterSpacing}px`;
      const lineHeight = item.fontSize * item.lineHeight;
      const lines = wrapCarouselText((value) => context.measureText(value).width, item.text, Math.max(1, width - padding * 2));
      // Carousel text flows naturally just like its DOM text box. The canvas clips its edges.
      if (item.backgroundColor) {
        context.fillStyle = item.backgroundColor;
        context.fillRect(x, y, width, lines.length * lineHeight + padding * 2);
      }
      context.fillStyle = item.color;
      context.textBaseline = "top";
      context.textAlign = item.textAlign;
      applyTextShadow(context, item.textShadow);
      const textX = item.textAlign === "left" ? x + padding : item.textAlign === "right" ? x + width - padding : x + width / 2;
      lines.forEach((line, index) => context.fillText(line, textX, y + padding + index * lineHeight));
      context.restore();
      return;
    }
    if (item.backgroundColor) {
      context.fillStyle = item.backgroundColor;
      context.fillRect(x, y, width, height);
    }
    context.fillStyle = item.color;
    context.font = `${item.fontWeight} ${item.fontSize}px ${item.fontFamily === "serif" ? "Georgia, 'Times New Roman', serif" : "Inter, Arial, sans-serif"}`;
    context.textBaseline = "top";
    context.textAlign = item.textAlign;
    applyTextShadow(context, item.textShadow);
    const lineHeight = item.fontSize * item.lineHeight;
    const lines = wrapText(context, item.text, Math.max(1, width - padding * 2));
    const textX = item.textAlign === "left" ? x + padding : item.textAlign === "right" ? x + width - padding : x + width / 2;
    const maxLines = Math.max(1, Math.floor((height - padding * 2) / lineHeight));
    lines.slice(0, maxLines).forEach((line, index) => {
      context.fillText(line, textX, y + padding + index * lineHeight);
    });
    context.restore();
  });
}

function wrapText(context: CanvasRenderingContext2D, value: string, maxWidth: number) {
  return value.split(/\r?\n/).flatMap((paragraph) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) return [""];
    const lines: string[] = [];
    let line = words.shift()!;
    words.forEach((word) => {
      const candidate = `${line} ${word}`;
      if (context.measureText(candidate).width <= maxWidth) line = candidate;
      else {
        lines.push(line);
        line = word;
      }
    });
    lines.push(line);
    return lines;
  });
}

function applyTextShadow(context: CanvasRenderingContext2D, shadow?: string) {
  if (!shadow) return;
  const match = shadow.match(/(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px\s+(.+)/);
  if (!match) return;
  context.shadowOffsetX = Number(match[1]);
  context.shadowOffsetY = Number(match[2]);
  context.shadowBlur = Number(match[3]);
  context.shadowColor = match[4];
}

function drawEmptySlot(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  backgroundColor: string
) {
  if (width <= 0 || height <= 0) return;
  context.save();
  roundedRectPath(context, x, y, width, height, radius);
  context.fillStyle = backgroundColor;
  context.fill();
  context.strokeStyle = "#d1d5db";
  context.lineWidth = 1;
  context.setLineDash([4, 4]);
  roundedRectPath(context, x + 0.5, y + 0.5, Math.max(0, width - 1), Math.max(0, height - 1), radius);
  context.stroke();
  context.restore();
}

function drawContainedImage(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource & { width: number; height: number },
  x: number,
  y: number,
  width: number,
  height: number
) {
  if (width <= 0 || height <= 0 || image.width <= 0 || image.height <= 0) return;
  const factor = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * factor;
  const drawHeight = image.height * factor;
  context.drawImage(
    image,
    x + (width - drawWidth) / 2,
    y + (height - drawHeight) / 2,
    drawWidth,
    drawHeight
  );
}

async function resolveElementImage(element: CanvasElement) {
  const asset = getCatalogElement(element.assetId);
  const isIcon = asset ? isIconAsset(asset) : false;
  const source = isIcon
    ? createInlineIconSource(element.id, element.color ?? "#111827") ?? createCatalogIconSource(element.assetId, element.color ?? "#111827")
    : new URL(asset?.src ?? element.src, document.baseURI).href;
  try {
    const image = await loadImage(source);
    return { id: element.id, image, tint: !isIcon && (asset?.supportsColor ?? element.supportsColor) };
  } finally {
    if (isIcon) URL.revokeObjectURL(source);
  }
}

function createInlineIconSource(elementId: string, color: string) {
  const artwork = [...document.querySelectorAll<HTMLElement>("[data-artwork-element-id]")]
    .find((candidate) => candidate.dataset.artworkElementId === elementId);
  const svg = artwork?.querySelector("svg");
  if (!svg) return null;

  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", "256");
  clone.setAttribute("height", "256");
  clone.setAttribute("color", color);
  clone.style.color = color;
  const markup = new XMLSerializer().serializeToString(clone);
  return URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }));
}

function createCatalogIconSource(assetId: string, color: string) {
  const paths: Record<string, string> = {
    "tabler-heart": '<path d="M12 21s-7-4.4-9-8.7C1.2 8.2 3.5 5 6.8 5c2 0 3.4 1.1 4.2 2.4C11.8 6.1 13.2 5 15.2 5c3.3 0 5.6 3.2 3.8 7.3C17 16.6 12 21 12 21Z"/>',
    "tabler-star": '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>',
    "tabler-sparkles": '<path d="m12 3-1.4 4.6L6 9l4.6 1.4L12 15l1.4-4.6L18 9l-4.6-1.4ZM5 15l-.8 2.2L2 18l2.2.8L5 21l.8-2.2L8 18l-2.2-.8ZM19 15l-.8 2.2L16 18l2.2.8L19 21l.8-2.2L22 18l-2.2-.8Z"/>',
    "tabler-arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "tabler-circle": '<circle cx="12" cy="12" r="8"/>',
    "tabler-plane": '<path d="m3 11 18-8-8 18-3.5-7.5Z M9.5 13.5 15 8"/>',
    "tabler-confetti": '<path d="m5 3 2 2M3 10h3M5 17l2-2M15 4l1 4 4 1-4 1-1 4-1-4-4-1 4-1ZM19 16l2 2M20 10h2"/>',
    "tabler-balloon": '<path d="M12 3a6 6 0 0 0-4 10.5c.7.6 1.2 1.4 1.3 2.3h5.4c.1-.9.6-1.7 1.3-2.3A6 6 0 0 0 12 3ZM10 16h4M12 16v5"/>',
  };
  const path = paths[assetId];
  if (!path) throw new Error("An element could not be prepared for export. Please retry.");
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  return URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }));
}

async function loadUniqueImages(sources: string[]) {
  const entries = await Promise.all(
    [...new Set(sources)].map(async (source) => [source, await loadImage(source)] as const)
  );
  return new Map(entries);
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) resolve(image);
      else reject(new Error("An image could not be prepared for export."));
    };
    image.onerror = () => reject(new Error("An image or doodle could not be loaded for export. Please retry."));
    image.src = source;
  });
}

function tintImage(image: HTMLImageElement, width: number, height: number, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not prepare a tinted element for export.");
  drawContainedImage(context, image, 0, 0, width, height);
  context.globalCompositeOperation = "source-in";
  context.fillStyle = color;
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = "source-over";
  return canvas;
}

function rotationCoverScale(
  cellWidth: number,
  cellHeight: number,
  canvasRatio: number,
  displayMode: Photo["displayMode"],
  rotation: Photo["rotation"]
) {
  if (displayMode !== "fill" || rotation % 180 === 0) return 1;
  const cellAspectRatio = (cellWidth / cellHeight) * canvasRatio;
  return Math.max(cellAspectRatio, 1 / cellAspectRatio);
}

function roundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.min(Math.max(radius, 0), Math.max(0, width / 2), Math.max(0, height / 2));
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("The browser could not generate this image. Try a smaller resolution or PNG.")),
        mimeType,
        quality
      );
    } catch {
      reject(new Error("The browser could not generate this image. Try a smaller resolution or PNG."));
    }
  });
}

function nextPaint() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function getExportDate() {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
}

function createLocalZipHeader(crc: number, size: number, filenameLength: number) {
  const buffer = new ArrayBuffer(30);
  const view = new DataView(buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, size, true);
  view.setUint32(22, size, true);
  view.setUint16(26, filenameLength, true);
  return new Uint8Array(buffer);
}

function createCentralZipHeader(crc: number, size: number, filenameLength: number, offset: number) {
  const buffer = new ArrayBuffer(46);
  const view = new DataView(buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint32(16, crc, true);
  view.setUint32(20, size, true);
  view.setUint32(24, size, true);
  view.setUint16(28, filenameLength, true);
  view.setUint32(42, offset, true);
  return new Uint8Array(buffer);
}

function createZipFooter(entryCount: number, directorySize: number, directoryOffset: number) {
  const buffer = new ArrayBuffer(22);
  const view = new DataView(buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, entryCount, true);
  view.setUint16(10, entryCount, true);
  view.setUint32(12, directorySize, true);
  view.setUint32(16, directoryOffset, true);
  return new Uint8Array(buffer);
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function copyBytes(bytes: Uint8Array) {
  return Uint8Array.from(bytes).buffer;
}
