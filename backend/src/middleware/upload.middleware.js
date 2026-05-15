import path from "path";
import multer from "multer";
import { getUploadsDir } from "../config/uploads-dir.js";

const uploadDir = getUploadsDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    const safeName = file.originalname
      .replace(extension, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50);

    cb(null, `${Date.now()}-${safeName || "file"}${extension}`);
  },
});

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WEBP image files are allowed."));
    }

    return cb(null, true);
  },
});
