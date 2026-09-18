import crypto from "crypto";
import { extensionFromOriginalName } from "../utils/file-content.js";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const getRegion = () => process.env.AWS_REGION?.trim();
const getBucket = () => process.env.AWS_S3_BUCKET?.trim();

export function isS3UploadConfigured() {
  return Boolean(
    getRegion() &&
      getBucket() &&
      process.env.AWS_ACCESS_KEY_ID?.trim() &&
      process.env.AWS_SECRET_ACCESS_KEY?.trim(),
  );
}

function extensionFromMime(mimetype) {
  const map = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "application/pdf": ".pdf",
    "text/plain": ".txt",
    "text/csv": ".csv",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  };
  return map[mimetype] || "";
}

function safeExtension(originalName, mimetype, detectedExt) {
  // Prefer sniffed extension / MIME over client filename (blocks .pdf + text/html tricks).
  if (detectedExt && /^\.[a-z0-9]{2,5}$/i.test(detectedExt)) {
    return detectedExt.toLowerCase();
  }
  const fromMime = extensionFromMime(mimetype);
  if (fromMime) return fromMime;
  const fromName = extensionFromOriginalName(originalName);
  if (/^\.[a-z0-9]{2,5}$/i.test(fromName)) {
    return fromName.toLowerCase();
  }
  return ".bin";
}

/** Optional CloudFront or public CDN base (no trailing slash). */
export function buildPublicUrlForKey(key) {
  const bucket = getBucket();
  const region = getRegion();
  const customBase = process.env.AWS_S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (customBase) {
    return `${customBase}/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

let cachedClient;

function getS3Client() {
  if (!cachedClient) {
    cachedClient = new S3Client({ region: getRegion() });
  }
  return cachedClient;
}

export async function uploadUserProfileAsset({
  userId,
  assetKind,
  buffer,
  contentType,
  originalName,
  detectedExt,
}) {
  if (!isS3UploadConfigured()) {
    throw new Error("S3 upload is not configured (AWS_REGION, AWS_S3_BUCKET, credentials).");
  }

  const bucket = getBucket();
  const trustedType = contentType || "application/octet-stream";
  const ext = safeExtension(originalName, trustedType, detectedExt);
  const key = `profiles/${userId}/${assetKind}-${crypto.randomUUID()}${ext}`;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: trustedType,
      ContentDisposition: "inline",
      Metadata: {
        "x-content-type-options": "nosniff",
      },
    }),
  );

  return buildPublicUrlForKey(key);
}

/**
 * Returns S3 object key only if `storedUrl` points at this app's bucket (or public base)
 * and lives under profiles/{userId}/ (avoids deleting unrelated keys).
 */
export function extractOwnedProfileObjectKey(storedUrl, userId) {
  if (!storedUrl || typeof storedUrl !== "string") {
    return null;
  }

  const bucket = getBucket();
  const region = getRegion();
  if (!bucket || !region) {
    return null;
  }

  const customBase = process.env.AWS_S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
  let key = null;

  try {
    if (customBase && storedUrl.startsWith(`${customBase}/`)) {
      key = storedUrl.slice(customBase.length + 1);
    } else {
      const u = new URL(storedUrl);
      const expectedHost = `${bucket}.s3.${region}.amazonaws.com`;
      if (u.hostname === expectedHost) {
        key = decodeURIComponent(u.pathname.replace(/^\//, ""));
      }
    }
  } catch {
    return null;
  }

  if (!key || key.includes("..")) {
    return null;
  }

  const prefix = `profiles/${userId}/`;
  if (!key.startsWith(prefix)) {
    return null;
  }

  return key;
}

/** Best-effort delete of a previous profile image / logo we own in this bucket. */
export async function deleteProfileMediaIfOwned(storedUrl, userId) {
  if (!isS3UploadConfigured()) {
    return;
  }

  const key = extractOwnedProfileObjectKey(storedUrl, userId);
  if (!key) {
    return;
  }

  try {
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: getBucket(),
        Key: key,
      }),
    );
  } catch (err) {
    console.error("[s3] deleteProfileMediaIfOwned:", err?.message || err);
  }
}

function assetFromMulterFile(userId, assetKind, file) {
  return uploadUserProfileAsset({
    userId,
    assetKind,
    buffer: file.buffer,
    contentType: file.mimetype,
    originalName: file.originalname,
    detectedExt: file.detectedExt,
  });
}

export async function uploadTeamMemberPhotoFileToS3(userId, file) {
  if (!file?.buffer?.length) {
    throw new Error("No image file provided.");
  }

  return assetFromMulterFile(userId, "team_member_photo", file);
}

export async function uploadTeamMemberDocumentFileToS3(userId, file) {
  if (!file?.buffer?.length) {
    throw new Error("No document file provided.");
  }

  return assetFromMulterFile(userId, "team_member_document", file);
}

export async function uploadBusinessMediaFilesToS3(userId, files = []) {
  const urls = [];

  for (const file of files) {
    if (!file?.buffer?.length) {
      continue;
    }

    urls.push(await assetFromMulterFile(userId, "business_media", file));
  }

  return urls;
}

export async function uploadProfileMulterFilesToS3(userId, files) {
  const out = {};

  const pic = files?.profile_picture?.[0];
  if (pic?.buffer?.length) {
    out.profile_picture = await assetFromMulterFile(userId, "profile_picture", pic);
  }

  const logo = files?.logo?.[0];
  if (logo?.buffer?.length) {
    out.logo = await assetFromMulterFile(userId, "logo", logo);
  }

  return out;
}
