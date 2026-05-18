import path from "path";
import crypto from "crypto";
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
  };
  return map[mimetype] || "";
}

function safeExtension(originalName, mimetype) {
  const fromName = path.extname(originalName || "");
  if (/^\.[a-z0-9]{2,5}$/i.test(fromName)) {
    return fromName.toLowerCase();
  }
  const fromMime = extensionFromMime(mimetype);
  return fromMime || ".bin";
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
}) {
  if (!isS3UploadConfigured()) {
    throw new Error("S3 upload is not configured (AWS_REGION, AWS_S3_BUCKET, credentials).");
  }

  const bucket = getBucket();
  const ext = safeExtension(originalName, contentType);
  const key = `profiles/${userId}/${assetKind}-${crypto.randomUUID()}${ext}`;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType || "application/octet-stream",
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

export async function uploadBusinessMediaFilesToS3(userId, files = []) {
  const urls = [];

  for (const file of files) {
    if (!file?.buffer?.length) {
      continue;
    }

    const url = await uploadUserProfileAsset({
      userId,
      assetKind: "business_media",
      buffer: file.buffer,
      contentType: file.mimetype,
      originalName: file.originalname,
    });
    urls.push(url);
  }

  return urls;
}

export async function uploadProfileMulterFilesToS3(userId, files) {
  const out = {};

  const pic = files?.profile_picture?.[0];
  if (pic?.buffer?.length) {
    out.profile_picture = await uploadUserProfileAsset({
      userId,
      assetKind: "profile_picture",
      buffer: pic.buffer,
      contentType: pic.mimetype,
      originalName: pic.originalname,
    });
  }

  const logo = files?.logo?.[0];
  if (logo?.buffer?.length) {
    out.logo = await uploadUserProfileAsset({
      userId,
      assetKind: "logo",
      buffer: logo.buffer,
      contentType: logo.mimetype,
      originalName: logo.originalname,
    });
  }

  return out;
}
