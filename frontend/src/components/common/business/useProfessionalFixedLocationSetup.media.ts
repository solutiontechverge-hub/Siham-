"use client";

import * as React from "react";
import {
  BUSINESS_MEDIA_MAX_COUNT,
  filterAllowedProfileImageFiles,
  isPersistedMediaUrl,
  PROFILE_IMAGE_INVALID_MESSAGE,
} from "../../../lib/profileImageUpload";

export type UseProfessionalFixedLocationSetupMediaArgs = {
  mediaSlides: string[];
  setMediaSlides: React.Dispatch<React.SetStateAction<string[]>>;
  mediaIdx: number;
  setMediaIdx: React.Dispatch<React.SetStateAction<number>>;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  setMediaDeleteConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsBusinessPublishEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  onUploadBusinessMedia?: (files: File[]) => Promise<string[]>;
  showSnackbar: (opts: {
    severity: "error" | "warning" | "success" | "info";
    message: string;
  }) => void;
};

/** Business media upload / delete (ponytail: deps bag). */
export function useProfessionalFixedLocationSetupMedia({
  mediaSlides,
  setMediaSlides,
  mediaIdx,
  setMediaIdx,
  fileInputRef,
  setMediaDeleteConfirmOpen,
  setIsBusinessPublishEnabled,
  onUploadBusinessMedia,
  showSnackbar,
}: UseProfessionalFixedLocationSetupMediaArgs) {
  const onUploadMedia = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onConfirmDeleteMedia = React.useCallback(() => {
    const next = mediaSlides.filter((_, i) => i !== mediaIdx);
    setMediaSlides(next);
    setMediaIdx(next.length === 0 ? 0 : Math.min(mediaIdx, next.length - 1));
    setIsBusinessPublishEnabled(true);
    setMediaDeleteConfirmOpen(false);
  }, [mediaIdx, mediaSlides]);

  const onFilesSelected = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const { allowed, rejected } = filterAllowedProfileImageFiles(
        Array.from(e.target.files ?? []),
      );
      if (rejected > 0 && !allowed.length) {
        showSnackbar({
          severity: "error",
          message: PROFILE_IMAGE_INVALID_MESSAGE,
        });
        e.target.value = "";
        return;
      }
      if (rejected > 0) {
        showSnackbar({
          severity: "warning",
          message: `${rejected} file(s) skipped. ${PROFILE_IMAGE_INVALID_MESSAGE}`,
        });
      }

      const persistedCount = mediaSlides.filter(isPersistedMediaUrl).length;
      const slotsLeft = BUSINESS_MEDIA_MAX_COUNT - persistedCount;
      if (slotsLeft <= 0) {
        showSnackbar({
          severity: "error",
          message: `You can upload at most ${BUSINESS_MEDIA_MAX_COUNT} images.`,
        });
        e.target.value = "";
        return;
      }

      const toUpload = allowed.slice(0, slotsLeft);
      if (!toUpload.length) {
        e.target.value = "";
        return;
      }

      if (allowed.length > slotsLeft) {
        showSnackbar({
          severity: "warning",
          message: `Only ${slotsLeft} more image(s) can be added (max ${BUSINESS_MEDIA_MAX_COUNT}).`,
        });
      }

      if (!onUploadBusinessMedia) {
        showSnackbar({
          severity: "error",
          message: "Media upload is not available.",
        });
        e.target.value = "";
        return;
      }

      try {
        const uploaded = await onUploadBusinessMedia(toUpload);
        setMediaSlides(uploaded);
        setMediaIdx(0);
      } catch {
        // Parent shows error snackbar.
      } finally {
        e.target.value = "";
      }
    },
    [mediaSlides, onUploadBusinessMedia, showSnackbar],
  );

  return {
    onUploadMedia,
    onConfirmDeleteMedia,
    onFilesSelected,
  };
}
