/** Must match backend `upload.middleware.js` (multer) rules. */
export const PROFILE_IMAGE_FILE_ACCEPT = ".jpg,.jpeg,.png,.webp";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export const PROFILE_IMAGE_INVALID_MESSAGE =
  "Only JPG, JPEG, PNG, or WebP images are allowed (max 5 MB on upload).";

export const BUSINESS_MEDIA_MAX_COUNT = 10;

export function isPersistedMediaUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

export function getProfileImageExtension(filename: string): string {
  const i = filename.lastIndexOf(".");
  if (i < 0) return "";
  return filename.slice(i).toLowerCase();
}

export function isAllowedProfileImageFile(file: File): boolean {
  const ext = getProfileImageExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return false;
  }
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return false;
  }
  return true;
}

/** For multi-file pickers: returns only allowed files. */
export function filterAllowedProfileImageFiles(files: Iterable<File>): { allowed: File[]; rejected: number } {
  const allowed: File[] = [];
  let rejected = 0;
  for (const f of files) {
    if (isAllowedProfileImageFile(f)) allowed.push(f);
    else rejected += 1;
  }
  return { allowed, rejected };
}
