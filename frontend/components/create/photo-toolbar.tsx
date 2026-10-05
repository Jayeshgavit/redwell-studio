"use client";

import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { usePhotos } from "./photo-context";

export interface PhotoToolbarHandle {
  openPicker: () => void;
  openPickerForSlot: (slotIndex: number) => void;
  openPickerForPhoto: (photoId: string) => void;
}

export const PhotoToolbar = forwardRef<PhotoToolbarHandle>(function PhotoToolbar(_, ref) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestedSlotIndexRef = useRef<number | null>(null);
  const requestedPhotoIdRef = useRef<string | null>(null);
  const { addPhotos, replacePhoto } = usePhotos();

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      const targetSlotIndex = requestedSlotIndexRef.current;
      const targetPhotoId = requestedPhotoIdRef.current;
      requestedSlotIndexRef.current = null;
      requestedPhotoIdRef.current = null;

      if (!files || files.length === 0) {
        e.target.multiple = true;
        return;
      }

      try {
        if (targetPhotoId) await replacePhoto(targetPhotoId, files[0]);
        else {
          await addPhotos(
            Array.from(files),
            targetSlotIndex === null ? undefined : targetSlotIndex
          );
        }
      } catch (error) {
        console.error("Failed to add photos:", error);
      } finally {
        // Allows selecting the same file again.
        e.target.value = "";
        e.target.multiple = true;
      }
    },
    [addPhotos, replacePhoto]
  );

  const triggerFileSelect = useCallback(() => {
    const input = fileInputRef.current;
    if (!input) return;

    requestedSlotIndexRef.current = null;
    requestedPhotoIdRef.current = null;
    input.multiple = true;
    input.click();
  }, []);

  const openPickerForSlot = useCallback((slotIndex: number) => {
    const input = fileInputRef.current;
    if (!input) return;

    requestedSlotIndexRef.current = slotIndex;
    requestedPhotoIdRef.current = null;
    input.multiple = false;
    input.click();
  }, []);

  const openPickerForPhoto = useCallback((photoId: string) => {
    const input = fileInputRef.current;
    if (!input) return;

    requestedSlotIndexRef.current = null;
    requestedPhotoIdRef.current = photoId;
    input.multiple = false;
    input.click();
  }, []);

  useImperativeHandle(
    ref,
    () => ({ openPicker: triggerFileSelect, openPickerForSlot, openPickerForPhoto }),
    [openPickerForPhoto, openPickerForSlot, triggerFileSelect]
  );

  return (
    <>
      {/* Hidden native file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="sr-only"
        aria-label="Choose photos"
      />

    </>
  );
});
