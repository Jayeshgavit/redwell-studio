import type { PhotoFilters } from "@/types/editor";
import { getPhotoColorOverlay, getPhotoCssFilter } from "@/components/create/photo-filters";

export type ImageEffect =
  | "fog" | "glow" | "bloom" | "light-leak" | "soft-focus" | "vignette" | "dreamy" | "haze"
  | "golden-light" | "shadow-fade" | "film-grain" | "dust" | "vintage" | "matte" | "faded-film"
  | "analog" | "cinematic-grain" | "warm" | "cool" | "moody" | "cinematic" | "golden-hour"
  | "urban" | "clean" | "soft" | "dramatic" | "deep-contrast" | "pastel" | "black-white"
  | "high-contrast-bw" | "soft-bw" | "warm-mono" | "cool-mono";

export type EffectParameter =
  | "intensity" | "density" | "softness" | "radius" | "highlights" | "amount" | "size"
  | "roughness" | "feather" | "midpoint" | "position" | "warmth" | "threshold";

export interface EffectLayer {
  id: string;
  effect: ImageEffect;
  name: string;
  visible: boolean;
  locked: boolean;
  source: "preset" | "manual";
  opacity?: number;
  parameters: Partial<Record<EffectParameter, number>>;
}

export interface ColorGradeRange {
  hue: number;
  saturation: number;
}

export interface ColorGrade {
  shadows: ColorGradeRange;
  midtones: ColorGradeRange;
  highlights: ColorGradeRange;
  balance: number;
}

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageEditState {
  filters: PhotoFilters;
  highlights: number;
  shadows: number;
  sharpness: number;
  vibrance: number;
  whites: number;
  blacks: number;
  clarity: number;
  texture: number;
  dehaze: number;
  colorGrade: ColorGrade;
  manualAdjustments: Partial<EditorAdjustments>;
  presetName: string;
  presetAmount: number;
  rotation: 0 | 90 | 180 | 270;
  flipX: boolean;
  flipY: boolean;
  crop: CropRegion;
  effects: EffectLayer[];
}

export interface EditorAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  temperature: number;
  tint: number;
  blur: number;
  grain: number;
  vignette: number;
  highlights: number;
  shadows: number;
  sharpness: number;
  vibrance: number;
  whites: number;
  blacks: number;
  clarity: number;
  texture: number;
  dehaze: number;
}

export const INITIAL_IMAGE_EDIT: ImageEditState = {
  filters: {
    preset: "original",
    brightness: 100,
    contrast: 100,
    saturation: 100,
    exposure: 0,
    temperature: 0,
    tint: 0,
    blur: 0,
    grain: 0,
    vignette: 0,
    opacity: 100,
  },
  highlights: 0,
  shadows: 0,
  sharpness: 0,
  vibrance: 0,
  whites: 0,
  blacks: 0,
  clarity: 0,
  texture: 0,
  dehaze: 0,
  colorGrade: {
    shadows: { hue: 220, saturation: 0 },
    midtones: { hue: 35, saturation: 0 },
    highlights: { hue: 45, saturation: 0 },
    balance: 0,
  },
  manualAdjustments: {},
  presetName: "Original",
  presetAmount: 100,
  rotation: 0,
  flipX: false,
  flipY: false,
  crop: { x: 0, y: 0, width: 1, height: 1 },
  effects: [],
};

const DEFAULT_PREVIEW_DIMENSION = 1600;
const EXPORT_MAX_DIMENSION = 16_000;
const EXPORT_MAX_PIXELS = 40_000_000;
export type EditableImageSource = HTMLImageElement | HTMLCanvasElement;

const EFFECT_SCRATCH_CANVASES = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();

export function renderEditedImage(
  target: HTMLCanvasElement,
  image: EditableImageSource,
  state: ImageEditState,
  options: {
    cropSource?: boolean;
    preview?: boolean;
    previewDimension?: number;
    exportMaxDimension?: number;
    backgroundColor?: string;
  } = {}
) {
  const {
    cropSource = false,
    preview = false,
    previewDimension = DEFAULT_PREVIEW_DIMENSION,
    exportMaxDimension,
    backgroundColor,
  } = options;
  const imageWidth = getImageWidth(image);
  const imageHeight = getImageHeight(image);
  const crop = cropSource ? { x: 0, y: 0, width: 1, height: 1 } : state.crop;
  const sourceX = crop.x * imageWidth;
  const sourceY = crop.y * imageHeight;
  const sourceWidth = crop.width * imageWidth;
  const sourceHeight = crop.height * imageHeight;
  const rotation = cropSource ? 0 : state.rotation;
  const turnsSideways = rotation === 90 || rotation === 270;
  const scale = preview
    ? Math.min(1, previewDimension / Math.max(sourceWidth, sourceHeight))
    : exportMaxDimension
      ? Math.min(1, exportMaxDimension / Math.max(sourceWidth, sourceHeight))
      : 1;
  const width = Math.max(1, Math.round((turnsSideways ? sourceHeight : sourceWidth) * scale));
  const height = Math.max(1, Math.round((turnsSideways ? sourceWidth : sourceHeight) * scale));

  if (
    !preview &&
    !cropSource &&
    (Math.max(width, height) > EXPORT_MAX_DIMENSION || width * height > EXPORT_MAX_PIXELS)
  ) {
    throw new Error("This image is too large for a browser export. Try a smaller image.");
  }

  if (target.width !== width) target.width = width;
  if (target.height !== height) target.height = height;
  const context = target.getContext("2d", { willReadFrequently: !cropSource });
  if (!context) throw new Error("This browser could not create an image preview.");
  context.clearRect(0, 0, width, height);
  if (backgroundColor) {
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  if (cropSource) {
    context.drawImage(image, 0, 0, width, height);
    return;
  }

  context.save();
  context.translate(width / 2, height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.scale(state.flipX ? -1 : 1, state.flipY ? -1 : 1);
  context.filter = getPhotoCssFilter(state.filters, scale);
  context.globalAlpha = state.filters.opacity / 100;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    -sourceWidth * scale / 2,
    -sourceHeight * scale / 2,
    sourceWidth * scale,
    sourceHeight * scale
  );
  context.restore();

  applyColorTone(context, width, height, state.filters);
  const visibleEffects = state.effects
    .filter((effect) => effect.visible)
    .map((effect) => ({
      ...effect,
      parameters: {
        ...effect.parameters,
        intensity: (effect.parameters.intensity ?? 45) * (effect.opacity ?? 100) / 100,
      },
    }));
  applyAtmosphereEffects(target, context, visibleEffects);
  adjustPixels(context, width, height, state, visibleEffects);
  applyVignette(context, width, height, state.filters.vignette ?? 0, visibleEffects);
}

export function renderExportCanvas(
  image: EditableImageSource,
  state: ImageEditState,
  format: "png" | "jpg" | "webp",
  quality = 0.92,
  maxDimension?: number
) {
  const canvas = document.createElement("canvas");
  renderEditedImage(canvas, image, state, {
    exportMaxDimension: maxDimension,
    backgroundColor: format === "jpg" ? "#ffffff" : undefined,
  });
  const mimeType = format === "png" ? "image/png" : format === "jpg" ? "image/jpeg" : "image/webp";
  return canvasToBlob(canvas, mimeType, quality);
}

export function getImageWidth(image: EditableImageSource) {
  return image instanceof HTMLImageElement ? image.naturalWidth : image.width;
}

export function getImageHeight(image: EditableImageSource) {
  return image instanceof HTMLImageElement ? image.naturalHeight : image.height;
}

function applyColorTone(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  filters: PhotoFilters
) {
  const tone = getPhotoColorOverlay(filters);
  if (!tone) return;
  context.save();
  context.globalCompositeOperation = "soft-light";
  context.globalAlpha = tone.opacity;
  context.fillStyle = tone.color;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function applyAtmosphereEffects(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  effects: EffectLayer[]
) {
  const { width, height } = canvas;
  for (const layer of effects) {
    const p = effectParameters(layer);
    const amount = clamp(p.intensity / 100, 0, 1);
    if (amount === 0) continue;

    if (layer.effect === "fog" || layer.effect === "haze" || layer.effect === "dreamy") {
      const fog = context.createRadialGradient(
        width * p.position / 100,
        height * 0.42,
        Math.min(width, height) * p.softness / 200,
        width * p.position / 100,
        height * 0.42,
        Math.max(width, height) * (0.4 + p.density / 125)
      );
      fog.addColorStop(0, `rgba(245, 241, 233, ${amount * p.density / 100 * 0.6})`);
      fog.addColorStop(1, `rgba(245, 241, 233, ${amount * p.density / 100 * 0.18})`);
      context.save();
      context.fillStyle = fog;
      context.fillRect(0, 0, width, height);
      context.restore();
    }

    if (layer.effect === "light-leak" || layer.effect === "golden-light" || layer.effect === "golden-hour") {
      const x = width * p.position / 100;
      const leak = context.createRadialGradient(x, 0, 0, x, 0, Math.max(width, height) * 0.9);
      const warmth = clamp(p.warmth / 100, 0, 1);
      leak.addColorStop(0, `rgba(255, ${Math.round(172 + warmth * 36)}, ${Math.round(105 + warmth * 48)}, ${amount * 0.7})`);
      leak.addColorStop(1, "rgba(255, 176, 104, 0)");
      context.save();
      context.globalCompositeOperation = "screen";
      context.fillStyle = leak;
      context.fillRect(0, 0, width, height);
      context.restore();
    }

    if (layer.effect === "shadow-fade" || layer.effect === "faded-film" || layer.effect === "matte") {
      const fade = context.createLinearGradient(0, 0, 0, height);
      fade.addColorStop(0, `rgba(248, 239, 221, ${amount * 0.13})`);
      fade.addColorStop(1, `rgba(28, 27, 25, ${amount * 0.17})`);
      context.save();
      context.globalCompositeOperation = "soft-light";
      context.fillStyle = fade;
      context.fillRect(0, 0, width, height);
      context.restore();
    }

    if (layer.effect === "glow" || layer.effect === "bloom" || layer.effect === "soft-focus" || layer.effect === "dreamy") {
      let softCanvas = EFFECT_SCRATCH_CANVASES.get(canvas);
      if (!softCanvas) {
        softCanvas = document.createElement("canvas");
        EFFECT_SCRATCH_CANVASES.set(canvas, softCanvas);
      }
      if (softCanvas.width !== width) softCanvas.width = width;
      if (softCanvas.height !== height) softCanvas.height = height;
      const softContext = softCanvas.getContext("2d");
      if (!softContext) throw new Error("This browser could not create an effects layer.");
      softContext.clearRect(0, 0, width, height);
      const radius = Math.max(1, Math.min(width, height) * p.radius / 1000);
      softContext.filter = `blur(${radius}px)`;
      softContext.drawImage(canvas, 0, 0);
      context.save();
      context.globalCompositeOperation = layer.effect === "soft-focus" ? "source-over" : "screen";
      const highlightWeight = layer.effect === "glow"
        ? p.highlights / 100
        : layer.effect === "bloom"
          ? 1 - p.threshold / 150
          : 1;
      context.globalAlpha = amount * (layer.effect === "soft-focus" ? 0.3 : 0.48) * highlightWeight;
      context.drawImage(softCanvas, 0, 0);
      context.restore();
    }

    if (layer.effect === "warm" || layer.effect === "vintage" || layer.effect === "analog") {
      context.save();
      context.globalCompositeOperation = "soft-light";
      context.globalAlpha = amount * p.warmth / 100 * 0.45;
      context.fillStyle = "#e3a66e";
      context.fillRect(0, 0, width, height);
      context.restore();
    }

    if (layer.effect === "cool" || layer.effect === "cinematic" || layer.effect === "urban") {
      context.save();
      context.globalCompositeOperation = "soft-light";
      context.globalAlpha = amount * 0.2;
      context.fillStyle = "#6f9caf";
      context.fillRect(0, 0, width, height);
      context.restore();
    }
  }
}

function adjustPixels(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: ImageEditState,
  effects: EffectLayer[]
) {
  const effectAmount = (effect: ImageEffect) =>
    effects.reduce((maximum, layer) => layer.effect === effect ? Math.max(maximum, effectParameters(layer).intensity / 100) : maximum, 0);
  const grainAmount = Math.min(1,
    state.filters.grain / 100 +
    effectAmount("film-grain") * 0.45 +
    effectAmount("cinematic-grain") * 0.35 +
    effectAmount("analog") * 0.22 +
    effectAmount("vintage") * 0.12
  );
  const dustAmount = effectAmount("dust");
  const sharpness = Math.min(1, state.sharpness / 130);
  const usesPixels = grainAmount > 0 || dustAmount > 0 || sharpness > 0 ||
    state.highlights !== 0 || state.shadows !== 0 || state.vibrance !== 0 ||
    state.whites !== 0 || state.blacks !== 0 || state.clarity !== 0 ||
    state.texture !== 0 || state.dehaze !== 0 || hasColorGrade(state.colorGrade) ||
    effects.some(({ effect }) => [
      "warm", "cool", "moody", "cinematic", "golden-hour", "urban", "clean", "soft",
      "dramatic", "deep-contrast", "pastel", "black-white", "high-contrast-bw",
      "soft-bw", "warm-mono", "cool-mono", "film-grain", "cinematic-grain", "dust",
      "vintage", "matte", "faded-film", "analog",
    ].includes(effect));
  if (!usesPixels) return;

  const pixels = context.getImageData(0, 0, width, height);
  const { data } = pixels;
  const original = sharpness > 0 || state.texture !== 0 ? new Uint8ClampedArray(data) : null;
  const monochrome = effects.filter(({ visible, effect }) => visible && [
    "black-white", "high-contrast-bw", "soft-bw", "warm-mono", "cool-mono",
  ].includes(effect)).map((layer) => ({
    layer,
    amount: effectParameters(layer).intensity / 100,
  }));
  const colorEffect = effects.filter(({ visible, effect }) => visible && [
    "warm", "cool", "moody", "cinematic", "golden-hour", "urban", "clean", "soft",
    "dramatic", "deep-contrast", "pastel",
  ].includes(effect)).map((layer) => ({
    layer,
    amount: effectParameters(layer).intensity / 100,
  }));
  const textureEffects = effects.filter(({ visible, effect }) => visible && [
    "film-grain", "cinematic-grain", "dust", "vintage", "matte", "faded-film", "analog",
  ].includes(effect)).map((layer) => ({
    layer,
    parameters: effectParameters(layer),
  }));
  const grainLayer = textureEffects.find(({ layer }) =>
    layer.effect === "film-grain" || layer.effect === "cinematic-grain" || layer.effect === "analog"
  );
  const grainParameters = grainLayer?.parameters;
  const roughness = Math.max(0.2, Math.min(3, (grainParameters?.roughness ?? 50) / 50));
  const grainSize = Math.max(0.2, Math.min(3, (grainParameters?.size ?? 50) / 50));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      let red = data[index];
      let green = data[index + 1];
      let blue = data[index + 2];
      const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      const shadowMask = Math.pow(1 - luminance / 255, 2);
      const highlightMask = Math.pow(luminance / 255, 2);
      const midtoneMask = Math.max(0, 1 - Math.abs(luminance / 255 - 0.5) * 2);

      const shadowLift = (state.shadows / 100) * shadowMask * 72 + state.blacks * shadowMask * 0.55;
      const highlightShift = (state.highlights / 100) * highlightMask * 72 + state.whites * highlightMask * 0.55;
      red += shadowLift + highlightShift;
      green += shadowLift + highlightShift;
      blue += shadowLift + highlightShift;

      if (state.clarity !== 0 || state.dehaze !== 0) {
        const amount = 1 + state.clarity / 160 + state.dehaze / 130;
        red = 128 + (red - 128) * amount;
        green = 128 + (green - 128) * amount;
        blue = 128 + (blue - 128) * amount;
      }

      if (state.vibrance !== 0) {
        const [hue, saturation, lightness] = rgbToHsl(red, green, blue);
        const boosted = clamp(saturation + state.vibrance / 100 * (1 - saturation) * 0.7, 0, 1);
        [red, green, blue] = hslToRgb(hue, boosted, lightness);
      }

      for (const { layer, amount } of colorEffect) {
        const effect = layer.effect;
        if (effect === "dramatic" || effect === "deep-contrast") {
          const contrast = effect === "deep-contrast" ? 1.45 : 1.28;
          red = 128 + (red - 128) * (1 + (contrast - 1) * amount);
          green = 128 + (green - 128) * (1 + (contrast - 1) * amount);
          blue = 128 + (blue - 128) * (1 + (contrast - 1) * amount);
        } else if (effect === "soft" || effect === "pastel") {
          const lift = amount * (effect === "pastel" ? 24 : 12);
          red = red * (1 - amount * 0.12) + lift;
          green = green * (1 - amount * 0.12) + lift;
          blue = blue * (1 - amount * 0.12) + lift;
        } else if (effect === "warm" || effect === "golden-hour" || effect === "vintage") {
          red += amount * 20;
          green += amount * 7;
          blue -= amount * 10;
        } else if (effect === "cool" || effect === "cinematic" || effect === "urban") {
          red -= amount * 8;
          green += amount * 3;
          blue += amount * 15;
        } else if (effect === "moody") {
          red -= amount * 12;
          green -= amount * 10;
          blue -= amount * 7;
        } else if (effect === "clean") {
          const center = 128;
          red = center + (red - center) * (1 + amount * 0.1);
          green = center + (green - center) * (1 + amount * 0.1);
          blue = center + (blue - center) * (1 + amount * 0.1);
        }
      }

      for (const { layer, amount } of monochrome) {
        const gray = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
        let monoRed = gray;
        let monoGreen = gray;
        let monoBlue = gray;
        if (layer.effect === "high-contrast-bw") {
          monoRed = monoGreen = monoBlue = 128 + (gray - 128) * 1.48;
        } else if (layer.effect === "soft-bw") {
          monoRed = monoGreen = monoBlue = 128 + (gray - 128) * 0.78 + 8;
        } else if (layer.effect === "warm-mono") {
          monoRed = gray * 1.06;
          monoGreen = gray;
          monoBlue = gray * 0.88;
        } else if (layer.effect === "cool-mono") {
          monoRed = gray * 0.9;
          monoGreen = gray * 0.98;
          monoBlue = gray * 1.08;
        }
        red += (monoRed - red) * amount;
        green += (monoGreen - green) * amount;
        blue += (monoBlue - blue) * amount;
      }

      const shadowGradeWeight = clamp(shadowMask + Math.max(0, -state.colorGrade.balance) / 100 * midtoneMask, 0, 1);
      const highlightGradeWeight = clamp(highlightMask + Math.max(0, state.colorGrade.balance) / 100 * midtoneMask, 0, 1);
      [red, green, blue] = gradePixels(red, green, blue, state.colorGrade.shadows, shadowGradeWeight);
      [red, green, blue] = gradePixels(red, green, blue, state.colorGrade.midtones, midtoneMask);
      [red, green, blue] = gradePixels(red, green, blue, state.colorGrade.highlights, highlightGradeWeight);

      if (original && state.texture !== 0) {
        const center = original[index];
        const left = original[(y * width + Math.max(0, x - 1)) * 4];
        const right = original[(y * width + Math.min(width - 1, x + 1)) * 4];
        const top = original[(Math.max(0, y - 1) * width + x) * 4];
        const bottom = original[(Math.min(height - 1, y + 1) * width + x) * 4];
        const edge = 4 * center - left - right - top - bottom;
        red += edge * state.texture / 180;
        green += edge * state.texture / 180;
        blue += edge * state.texture / 180;
      }

      if (original && sharpness > 0) {
        const center = original[index];
        const left = original[(y * width + Math.max(0, x - 1)) * 4];
        const right = original[(y * width + Math.min(width - 1, x + 1)) * 4];
        const top = original[(Math.max(0, y - 1) * width + x) * 4];
        const bottom = original[(Math.min(height - 1, y + 1) * width + x) * 4];
        const edge = 4 * center - left - right - top - bottom;
        red += edge * sharpness;
        green += edge * sharpness;
        blue += edge * sharpness;
      }

      if (textureEffects.length > 0) {
        for (const { layer, parameters: p } of textureEffects) {
          if (layer.effect === "dust" && noiseAt(Math.floor(x / p.size), Math.floor(y / p.size)) > 0.9998 - p.intensity / 100 * 0.0003) {
            red = 238;
            green = 231;
            blue = 216;
          }
          if (layer.effect === "matte") {
            const amount = p.intensity / 100;
            red = red * (1 - amount * 0.08) + 14 * amount;
            green = green * (1 - amount * 0.08) + 14 * amount;
            blue = blue * (1 - amount * 0.08) + 14 * amount;
          }
          if (layer.effect === "faded-film" || layer.effect === "vintage") {
            const amount = p.intensity / 100;
            red = red * (1 - amount * 0.06) + 8 * amount;
            green = green * (1 - amount * 0.06) + 6 * amount;
            blue = blue * (1 - amount * 0.06) + 2 * amount;
          }
        }
      }

      if (grainAmount > 0) {
        const noise = noiseAt(Math.floor(x * roughness / grainSize), Math.floor(y * roughness / grainSize)) * grainAmount * 40;
        red += noise;
        green += noise;
        blue += noise;
      }

      if (dustAmount > 0 && noiseAt(x + 302, y + 719) > 0.9998 - dustAmount * 0.0003) {
        red = 238;
        green = 231;
        blue = 216;
      }

      data[index] = red;
      data[index + 1] = green;
      data[index + 2] = blue;
    }
  }
  context.putImageData(pixels, 0, 0);
}

function applyVignette(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  filterAmount: number,
  effects: EffectLayer[]
) {
  const layers = effects.filter(({ effect }) => effect === "vignette");
  const amount = Math.min(0.85, filterAmount / 100 * 0.78 + layers.reduce((sum, layer) => sum + effectParameters(layer).intensity / 100 * 0.6, 0));
  if (amount <= 0) return;
  const parameters = layers.length ? effectParameters(layers[layers.length - 1]) : null;
  const feather = parameters ? parameters.feather / 100 : 0.72;
  const radius = Math.max(width, height) * (0.5 + feather * 0.5);
  const gradient = context.createRadialGradient(width / 2, height / 2, radius * 0.15, width / 2, height / 2, radius);
  gradient.addColorStop(clamp(parameters?.midpoint ?? 55, 0, 100) / 100 * 0.75, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, `rgba(0, 0, 0, ${amount})`);
  context.save();
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function effectParameters(layer: EffectLayer) {
  return {
    intensity: layer.parameters.intensity ?? 45,
    density: layer.parameters.density ?? 45,
    softness: layer.parameters.softness ?? 55,
    radius: layer.parameters.radius ?? 35,
    highlights: layer.parameters.highlights ?? 40,
    amount: layer.parameters.amount ?? 45,
    size: layer.parameters.size ?? 50,
    roughness: layer.parameters.roughness ?? 50,
    feather: layer.parameters.feather ?? 72,
    midpoint: layer.parameters.midpoint ?? 55,
    position: layer.parameters.position ?? 18,
    warmth: layer.parameters.warmth ?? 62,
    threshold: layer.parameters.threshold ?? 65,
  };
}

function hasColorGrade(grade: ColorGrade) {
  return grade.shadows.saturation !== 0 || grade.midtones.saturation !== 0 ||
    grade.highlights.saturation !== 0 || grade.balance !== 0;
}

function gradePixels(
  red: number,
  green: number,
  blue: number,
  grade: ColorGrade["shadows"],
  tonalWeight: number
): [number, number, number] {
  if (grade.saturation <= 0 || tonalWeight <= 0) return [red, green, blue];
  const [hue, saturation, lightness] = rgbToHsl(red, green, blue);
  const target = hslToRgb(grade.hue, Math.max(saturation, grade.saturation / 100 * 0.6), lightness);
  const strength = clamp(grade.saturation / 100 * tonalWeight * 0.72, 0, 0.72);
  return [
    red + (target[0] - red) * strength,
    green + (target[1] - green) * strength,
    blue + (target[2] - blue) * strength,
  ];
}

function rgbToHsl(red: number, green: number, blue: number): [number, number, number] {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  const lightness = (max + min) / 2;
  let saturation = 0;
  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return [hue, saturation, lightness];
}

function hslToRgb(hue: number, saturation: number, lightness: number): [number, number, number] {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = hue / 60;
  const secondary = chroma * (1 - Math.abs(segment % 2 - 1));
  let rgb: [number, number, number] = [0, 0, 0];
  if (segment < 1) rgb = [chroma, secondary, 0];
  else if (segment < 2) rgb = [secondary, chroma, 0];
  else if (segment < 3) rgb = [0, chroma, secondary];
  else if (segment < 4) rgb = [0, secondary, chroma];
  else if (segment < 5) rgb = [secondary, 0, chroma];
  else rgb = [chroma, 0, secondary];
  const offset = lightness - chroma / 2;
  return [
    (rgb[0] + offset) * 255,
    (rgb[1] + offset) * 255,
    (rgb[2] + offset) * 255,
  ];
}

function noiseAt(x: number, y: number) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("The edited image could not be exported."));
      },
      mimeType,
      quality
    );
  });
}
