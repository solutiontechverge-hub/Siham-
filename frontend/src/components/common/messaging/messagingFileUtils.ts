import type { MessagingAttachment } from "./messagingTypes";
import { resolveMessagingAttachmentUrl } from "./messagingAttachmentUpload";

export const MESSAGING_ATTACHMENT_MAX_BYTES = 8 * 1024 * 1024;

/** Must match backend `messagingUpload.middleware.js` and MessagingComposer. */
export const MESSAGING_ATTACHMENT_FILE_ACCEPT =
  ".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif";

const MAX_FILE_BYTES = MESSAGING_ATTACHMENT_MAX_BYTES;

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "txt",
  "xls",
  "xlsx",
  "csv",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "heic",
  "heif",
]);

export function isAllowedMessagingAttachmentFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (file.type === "application/pdf" || file.type === "text/plain" || file.type === "text/csv") {
    return true;
  }
  if (file.type.includes("word") || file.type === "application/msword") return true;
  if (
    file.type.includes("excel") ||
    file.type.includes("spreadsheet") ||
    file.type === "application/vnd.ms-excel"
  ) {
    return true;
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  return Boolean(ext && ALLOWED_EXTENSIONS.has(ext));
}

export function validateMessagingAttachmentFile(file: File): string | null {
  if (!isAllowedMessagingAttachmentFile(file)) {
    return `"${file.name}" is not a supported file type.`;
  }
  if (file.size > MESSAGING_ATTACHMENT_MAX_BYTES) {
    return `"${file.name}" is too large. Maximum size is 8 MB.`;
  }
  return null;
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
    if (!isAllowedMessagingAttachmentFile(file)) {
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

/** Force-download an attachment (images, PDF, Excel, docs). */
export async function downloadMessagingAttachment(options: {
  url: string;
  fileName: string;
}): Promise<void> {
  const resolvedUrl = resolveMessagingAttachmentUrl(options.url);
  if (!resolvedUrl) {
    throw new Error("Attachment URL is missing.");
  }

  const response = await fetch(resolvedUrl, { credentials: "include" });
  if (!response.ok) {
    throw new Error("Unable to download attachment.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = options.fileName || "attachment";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}

export { resolveMessagingAttachmentUrl, resolveMessagingAttachments } from "./messagingAttachmentUpload";
