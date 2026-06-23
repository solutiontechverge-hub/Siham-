import type { MessagingAttachment } from "./messagingTypes";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx", "txt", "jpg", "jpeg", "png", "gif", "webp", "heic", "heif"]);

function isAllowedFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (file.type === "application/pdf" || file.type === "text/plain") return true;
  if (file.type.includes("word") || file.type === "application/msword") return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return Boolean(ext && ALLOWED_EXTENSIONS.has(ext));
}

export type FileProcessResult =
  | { ok: true; attachments: MessagingAttachment[] }
  | { ok: false; error: string };

/** Fast attach using blob URLs (in-memory only; not persisted to localStorage). */
export function filesToMessagingAttachments(files: FileList | File[]): FileProcessResult {
  const list = Array.from(files);
  if (!list.length) return { ok: false, error: "No file selected." };

  const attachments: MessagingAttachment[] = [];

  for (const file of list) {
    if (!isAllowedFile(file)) {
      return { ok: false, error: `"${file.name}" is not a supported file type.` };
    }
    if (file.size > MAX_FILE_BYTES) {
      return { ok: false, error: `"${file.name}" is too large. Maximum size is 8 MB.` };
    }

    attachments.push({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      url: URL.createObjectURL(file),
    });
  }

  return { ok: true, attachments };
}

export function revokeAttachmentUrls(attachments?: MessagingAttachment[]) {
  attachments?.forEach((att) => {
    if (att.url.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(att.url);
      } catch {
        // ignore
      }
    }
  });
}

export function isImageAttachment(mimeType?: string): boolean {
  return Boolean(mimeType?.startsWith("image/"));
}

export { resolveMessagingAttachmentUrl, resolveMessagingAttachments } from "./messagingAttachmentUpload";
