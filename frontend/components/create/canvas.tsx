
"use client";

import { useEffect, useRef } from "react";
import {
  Canvas as FabricCanvas,
  FabricImage,
} from "fabric";
import { usePhotos } from "./photo-context";

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

export function FabricCanvasComponent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);

  const { photos } = usePhotos();

  // Create Fabric canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    if (fabricCanvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;

    canvas.renderAll();

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // Add photos to Fabric canvas
  useEffect(() => {
    const canvas = fabricCanvasRef.current;

    if (!canvas) return;

    // Remove existing objects.
    canvas.clear();
    canvas.backgroundColor = "#ffffff";

    if (photos.length === 0) {
      canvas.renderAll();
      return;
    }

    let cancelled = false;

    const loadPhotos = async () => {
      for (let index = 0; index < photos.length; index++) {
        const photo = photos[index];

        try {
          const image = await FabricImage.fromURL(photo.src);

          if (cancelled) return;

          // Scale image to fit nicely inside the 500x500 canvas.
          const maxWidth = 400;
          const maxHeight = 400;

          const imageWidth = image.width ?? 1;
          const imageHeight = image.height ?? 1;

          const scale = Math.min(
            maxWidth / imageWidth,
            maxHeight / imageHeight,
            1
          );

          image.set({
            left: CANVAS_WIDTH / 2,
            top: CANVAS_HEIGHT / 2,
            originX: "center",
            originY: "center",
            scaleX: scale,
            scaleY: scale,
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
          });

          canvas.add(image);
        } catch (error) {
          console.error("Failed to load image:", error);
        }
      }

      if (!cancelled) {
        canvas.renderAll();
      }
    };

    loadPhotos();

    return () => {
      cancelled = true;
    };
  }, [photos]);

  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-100 p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-lg border-2 border-gray-200 bg-white shadow-lg"
          style={{
            touchAction: "none",
          }}
        />

        {photos.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="mb-2 text-5xl">⊞</div>

              <p className="text-sm">
                Your collage will appear here
              </p>

              <p className="mt-1 text-xs">
                Add photos to get started
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

