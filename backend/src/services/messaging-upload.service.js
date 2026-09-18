import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getUploadsDir } from "../config/uploads-dir.js";
import { extensionFromOriginalName } from "../utils/file-content.js";

export async function saveMessagingAttachments(userId, files = []) {
  if (!files.length) return [];

  const userDir = path.join(getUploadsDir(), "messaging", String(userId));
  await fs.mkdir(userDir, { recursive: true });

  const saved = [];
  for (const file of files) {
    const ext = file.detectedExt || extensionFromOriginalName(file.originalname) || "";
    const filename = `${randomUUID()}${ext}`;
    const absolutePath = path.join(userDir, filename);
    await fs.writeFile(absolutePath, file.buffer);
    saved.push({
      id: `att-${randomUUID()}`,
      name: file.originalname || filename,
      mimeType: file.mimetype || "application/octet-stream",
      url: `/uploads/messaging/${userId}/${filename}`,
    });
  }

  return saved;
}
