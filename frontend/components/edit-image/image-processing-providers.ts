export interface BackgroundRemovalProvider {
  readonly id: string;
  removeBackground(image: Blob, signal: AbortSignal): Promise<Blob>;
}

export interface SuperResolutionProvider {
  readonly id: string;
  upscale(image: Blob, scale: 2 | 4, signal: AbortSignal): Promise<Blob>;
}

export interface ImageProcessingProviders {
  backgroundRemoval: BackgroundRemovalProvider | null;
  superResolution: SuperResolutionProvider | null;
}

export const imageProcessingProviders: ImageProcessingProviders = {
  backgroundRemoval: null,
  superResolution: null,
};
