import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getUploadsDir } from "../config/uploads-dir.js";
import { extensionFromOriginalName, isImageMime } from "../utils/file-content.js";

export async function saveBookingAttachments(userId, files = []) {
  if (!files.length) return [];

  const userDir = path.join(getUploadsDir(), "bookings", String(userId));
  await fs.mkdir(userDir, { recursive: true });

  const saved = [];
  for (const file of files) {
    const ext = file.detectedExt || extensionFromOriginalName(file.originalname) || "";
    const filename = `${randomUUID()}${ext}`;
    const absolutePath = path.join(userDir, filename);
    await fs.writeFile(absolutePath, file.buffer);
    const mimeType = file.mimetype || "application/octet-stream";
    saved.push({
      id: `booking-att-${randomUUID()}`,
      name: file.originalname || filename,
      mimeType,
      kind: isImageMime(mimeType) ? "image" : "document",
      url: `/uploads/bookings/${userId}/${filename}`,
    });
  }

  return saved;
}
