import multer from "multer";
import { extensionFromOriginalName } from "../utils/file-content.js";

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

// ponytail: keep HEIC/HEIF out of profile/logo (prebuilt sharp has no HEVC). Convert to JPEG in assertTrustedUploadFile when sharp/HEVC is available, then allow.
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const ext = extensionFromOriginalName(file.originalname);
    if (!allowedExtensions.has(ext)) {
      return cb(new Error("Only .jpg, .jpeg, .png, and .webp image files are allowed."));
    }
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WEBP image files are allowed."));
    }

    return cb(null, true);
  },
});
