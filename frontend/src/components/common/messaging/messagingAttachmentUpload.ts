import { apiUrl } from "../../../lib/api";
import type { MessagingAttachment } from "./messagingTypes";

async function blobUrlToFile(url: string, name: string, mimeType: string): Promise<File> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], name, { type: mimeType || blob.type || "application/octet-stream" });
}

function needsUpload(url: string): boolean {
  return !url || url.startsWith("blob:") || url.startsWith("data:");
}

export function resolveMessagingAttachmentUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("blob:") || url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return apiUrl(url.startsWith("/") ? url : `/${url}`);
}

export function resolveMessagingAttachments(attachments?: MessagingAttachment[]): MessagingAttachment[] | undefined {
  if (!attachments?.length) return attachments;
  return attachments.map((att) => ({
    ...att,
    url: resolveMessagingAttachmentUrl(att.url),
  }));
}

export async function uploadMessagingAttachments(
  attachments: MessagingAttachment[],
  accessToken: string,
): Promise<MessagingAttachment[]> {
  if (!attachments.length) return [];

  const uploaded: MessagingAttachment[] = [];
  const toUpload = attachments.filter((attachment) => needsUpload(attachment.url));
  for (const attachment of attachments) {
    if (needsUpload(attachment.url)) continue;
    uploaded.push({
      ...attachment,
      url: resolveMessagingAttachmentUrl(attachment.url),
    });
  }

  const pending = await Promise.all(
    toUpload.map(async (attachment) => ({
      attachment,
      file: await blobUrlToFile(attachment.url, attachment.name, attachment.mimeType ?? ""),
    })),
  );

  if (!pending.length) return uploaded;

  const formData = new FormData();
  for (const item of pending) {
    formData.append("files", item.file, item.file.name);
  }

  const response = await fetch(apiUrl("/api/messaging/attachments"), {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const payload = (await response.json()) as {
    success?: boolean;
    message?: string;
    data?: { attachments?: MessagingAttachment[] };
  };

  if (!response.ok || !payload.success || !payload.data?.attachments?.length) {
    throw new Error(payload.message || "Failed to upload attachments.");
  }

  const serverAttachments = payload.data.attachments.map((att) => ({
    ...att,
    url: resolveMessagingAttachmentUrl(att.url),
  }));

  return [...uploaded, ...serverAttachments];
}
