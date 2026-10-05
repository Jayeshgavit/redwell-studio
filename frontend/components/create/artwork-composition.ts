import type {
  CarouselStoryTextItem,
  CanvasElement,
  CanvasFormat,
  CollageStyle,
  LayoutDefinition,
  Photo,
} from "@/types/editor";

export interface ArtworkComposition {
  format: CanvasFormat;
  layout: LayoutDefinition;
  photos: Photo[];
  slotAssignments: Record<number, string>;
  collageStyle: CollageStyle;
  elements: CanvasElement[];
  storyText?: CarouselStoryTextItem[];
}

export type ArtworkLayerKind = "photo" | "storyText" | "element";
export type LayerDirection = "forward" | "backward" | "front" | "back";

export interface ArtworkLayerEntry {
  kind: ArtworkLayerKind;
  id: string;
  layerOrder: number;
}

interface ArtworkLayersInput {
  layout?: LayoutDefinition;
  photos: Photo[];
  slotAssignments: Record<number, string>;
  elements: CanvasElement[];
  storyText: CarouselStoryTextItem[];
}

export function getArtworkLayerStack({
  layout,
  photos,
  slotAssignments,
  elements,
  storyText,
}: ArtworkLayersInput): ArtworkLayerEntry[] {
  const photosById = new Map(photos.map((photo) => [photo.id, photo]));
  const orderedPhotoIds: string[] = [];
  const assignedPhotoIds = new Set<string>();

  const slots = layout?.cells
    .map((cell, index) => ({ cell, index }))
    .sort((first, second) =>
      (first.cell.zIndex ?? first.index) - (second.cell.zIndex ?? second.index)
    ) ?? [];
  const slotOrder = new Map(slots.map(({ index }, order) => [index, order]));

  slots.forEach(({ index }) => {
    const photoId = slotAssignments[index];
    if (photoId && photosById.has(photoId) && !assignedPhotoIds.has(photoId)) {
      assignedPhotoIds.add(photoId);
      orderedPhotoIds.push(photoId);
    }
  });
  photos.forEach((photo) => {
    if (!assignedPhotoIds.has(photo.id)) orderedPhotoIds.push(photo.id);
  });

  const slotByPhotoId = new Map(
    Object.entries(slotAssignments).map(([index, id]) => [id, Number(index)])
  );
  const defaultOrderByPhotoId = new Map<string, number>();
  orderedPhotoIds.forEach((id, index) => {
    const cellOrder = slotOrder.get(slotByPhotoId.get(id) ?? -1);
    defaultOrderByPhotoId.set(id, cellOrder ?? slots.length + index);
  });
  const textBaseOrder = Math.max(slots.length, photos.length);
  const baseStack: Array<Omit<ArtworkLayerEntry, "layerOrder"> & { defaultOrder: number }> = [
    ...orderedPhotoIds.map((id) => ({
      kind: "photo" as const,
      id,
      defaultOrder: defaultOrderByPhotoId.get(id) ?? 0,
    })),
    ...storyText.map((item, index) => ({
      kind: "storyText" as const,
      id: item.id,
      defaultOrder: textBaseOrder + index,
    })),
    ...[...elements]
      .sort((first, second) => first.zIndex - second.zIndex)
      .map((element, index) => ({
        kind: "element" as const,
        id: element.id,
        defaultOrder: textBaseOrder + storyText.length + index,
      })),
  ];

  const layerOrders = new Map<string, number>();
  photos.forEach((photo) => {
    if (photo.layerOrder !== undefined) layerOrders.set(`photo:${photo.id}`, photo.layerOrder);
  });
  storyText.forEach((item) => {
    if (item.layerOrder !== undefined) layerOrders.set(`storyText:${item.id}`, item.layerOrder);
  });
  elements.forEach((element) => {
    if (element.layerOrder !== undefined) layerOrders.set(`element:${element.id}`, element.layerOrder);
  });

  return baseStack
    .map((entry, baseOrder) => ({
      ...entry,
      layerOrder: layerOrders.get(`${entry.kind}:${entry.id}`) ?? entry.defaultOrder,
      baseOrder,
    }))
    .sort((first, second) => first.layerOrder - second.layerOrder || first.baseOrder - second.baseOrder)
    .map(({ baseOrder: _baseOrder, defaultOrder: _defaultOrder, ...entry }) => entry);
}
