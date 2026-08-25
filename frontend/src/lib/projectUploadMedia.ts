import { resolveMediaUrl } from "./resolveMediaUrl";

export type ProjectUploadLike = {
  id?: string;
  name?: string;
  url?: string;
  previewUrl?: string;
  mimeType?: string;
  kind?: "image" | "document";
};

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif|jfif)$/i;

export function inferProjectUploadKind(
  name?: string,
  mimeType?: string,
): "image" | "document" {
  const mime = String(mimeType ?? "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (IMAGE_EXT.test(String(name ?? ""))) return "image";
  return "document";
}

export function isProjectUploadImage(upload: ProjectUploadLike): boolean {
  const mime = String(upload.mimeType ?? "").toLowerCase();
  const name = String(upload.name ?? "");
  const href = String(upload.url ?? upload.previewUrl ?? "").split("?")[0];
  if (mime.startsWith("image/")) return true;
  if (IMAGE_EXT.test(name) || IMAGE_EXT.test(href)) return true;
  return upload.kind === "image";
}

export function isLiveMediaUrl(url?: string | null): boolean {
  const value = String(url ?? "").trim();
  if (!value) return false;
  return !value.startsWith("blob:") && !value.startsWith("data:");
}

export function liveMediaUrl(url?: string | null): string | undefined {
  const value = String(url ?? "").trim();
  return isLiveMediaUrl(value) ? value : undefined;
}

export function projectUploadHref(upload: ProjectUploadLike): string | undefined {
  return (
    resolveMediaUrl(liveMediaUrl(upload.url)) ||
    resolveMediaUrl(liveMediaUrl(upload.previewUrl))
  );
}

export async function fileFromProjectUpload(upload: {
  name: string;
  file?: File;
  previewUrl?: string;
  mimeType?: string;
}): Promise<File | null> {
  if (upload.file instanceof File) return upload.file;
  const src = String(upload.previewUrl ?? "").trim();
  if (!src.startsWith("blob:") && !src.startsWith("data:")) return null;
  try {
    const blob = await fetch(src).then((res) => res.blob());
    return new File([blob], upload.name, {
      type: blob.type || upload.mimeType || "application/octet-stream",
    });
  } catch {
    return null;
  }
}
