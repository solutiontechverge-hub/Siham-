import {
  assertTrustedUploadFile,
  collectMulterFiles,
} from "../utils/file-content.js";

/** Image-only uploads (profile, logo, business media). */
// ponytail: no HEIC here until assertTrustedUploadFile can JPEG-convert (sharp/HEVC).
export const IMAGE_UPLOAD_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/** Messaging / booking / team documents. */
export const MESSAGING_UPLOAD_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export function validateUploadContent(allowedMimes) {
  return (req, _res, next) => {
    try {
      const files = collectMulterFiles(req.files);
      if (req.file) files.push(req.file);
      for (const file of files) {
        assertTrustedUploadFile(file, { allowedMimes });
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export const validateImageUploadContent = validateUploadContent(IMAGE_UPLOAD_MIMES);
export const validateMessagingUploadContent = validateUploadContent(MESSAGING_UPLOAD_MIMES);
