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

type LocationUploadRow = {
  id?: string;
  name?: string;
  url?: string | null;
  mimeType?: string | null;
  kind?: "image" | "document" | null;
};

/** Coerce pg/jsonb quirks (stringified JSON, single url) into a string list. */
function coerceMediaUrlList(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry ?? "").trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        return coerceMediaUrlList(JSON.parse(trimmed));
      } catch {
        // fall through — treat as a single url path
      }
    }
    return [trimmed];
  }
  return [];
}

/** Prefer location_details.uploads with live urls; else booking images/documents columns. */
export function resolveBookingProjectUploads(input: {
  locationUploads?: LocationUploadRow[] | null;
  images?: Array<string | null | undefined> | string | null;
  documents?: Array<string | null | undefined> | string | null;
}): Array<{
  id: string;
  name: string;
  url?: string;
  previewUrl?: string;
  mimeType?: string;
  kind: "image" | "document";
}> {
  const locationUploads = Array.isArray(input.locationUploads)
    ? input.locationUploads
    : [];
  const fromLocation = locationUploads
    .map((upload, index) => {
      const url = liveMediaUrl(upload?.url);
      if (!url) return null;
      const name = upload.name || `File ${index + 1}`;
      return {
        id: upload.id || `ld-upload-${index}`,
        name,
        url,
        previewUrl: resolveMediaUrl(url) ?? url,
        mimeType: upload.mimeType ?? undefined,
        kind: inferProjectUploadKind(name, upload.mimeType ?? undefined),
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
  if (fromLocation.length) return fromLocation;

  const imageUploads = coerceMediaUrlList(input.images).map((href, index) => ({
    id: `img-${index}`,
    name: `Image ${index + 1}`,
    url: href,
    previewUrl: resolveMediaUrl(href) ?? href,
    kind: "image" as const,
  }));
  const documentUploads = coerceMediaUrlList(input.documents).map((href, index) => ({
    id: `doc-${index}`,
    name: `Document ${index + 1}`,
    url: href,
    previewUrl: resolveMediaUrl(href) ?? href,
    kind: "document" as const,
  }));
  return [...imageUploads, ...documentUploads];
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
